import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overall_score: {
      type: Type.INTEGER,
      description: 'Strict overall match score from 0 to 100.',
    },
    verdict: {
      type: Type.STRING,
      description: 'Must be exactly one of: Strong Match, Moderate Match, Weak Match.',
    },
    skill_score: {
      type: Type.INTEGER,
      description: 'Technical and domain skills match score from 0 to 100.',
    },
    experience_score: {
      type: Type.INTEGER,
      description: 'Relevant work experience and seniority match score from 0 to 100.',
    },
    education_score: {
      type: Type.INTEGER,
      description: 'Education and credentials alignment score from 0 to 100.',
    },
    matched_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          evidence: {
            type: Type.STRING,
            description: 'Exact verbatim quote or snippet from the resume proving this skill.',
          },
        },
        required: ['skill', 'evidence'],
      },
    },
    missing_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          importance: {
            type: Type.STRING,
            description: 'Must be exactly High, Medium, or Low.',
          },
          reason: { type: Type.STRING },
        },
        required: ['skill', 'importance', 'reason'],
      },
    },
    partial_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ['skill', 'note'],
      },
    },
    ats_issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    improvement_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    optimized_summary: {
      type: Type.STRING,
      description: 'Rewritten professional summary tailored to this JD, around 3 lines.',
    },
    recruiter_summary: {
      type: Type.STRING,
      description: '2-3 sentences candid recruiter verdict.',
    },
    interview_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 likely interview questions specifically targeting gaps or partial skills.',
    },
  },
  required: [
    'overall_score',
    'verdict',
    'skill_score',
    'experience_score',
    'education_score',
    'matched_skills',
    'missing_skills',
    'partial_skills',
    'ats_issues',
    'strengths',
    'weaknesses',
    'improvement_suggestions',
    'optimized_summary',
    'recruiter_summary',
    'interview_questions',
  ],
};

function extractJsonFromText(rawText: string): unknown {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip markdown code fences if present
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue to brace extraction
      }
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Could not parse structured JSON from model output.');
  }
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeVerdict(verdict: unknown, score: number): 'Strong Match' | 'Moderate Match' | 'Weak Match' {
  if (typeof verdict === 'string') {
    const lower = verdict.toLowerCase();
    if (lower.includes('strong')) return 'Strong Match';
    if (lower.includes('moderate')) return 'Moderate Match';
    if (lower.includes('weak')) return 'Weak Match';
  }
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Moderate Match';
  return 'Weak Match';
}

function normalizeResult(raw: Record<string, unknown>) {
  const overall_score = clampScore(raw.overall_score);
  const verdict = normalizeVerdict(raw.verdict, overall_score);
  const skill_score = clampScore(raw.skill_score);
  const experience_score = clampScore(raw.experience_score);
  const education_score = clampScore(raw.education_score);

  const matched_skills = Array.isArray(raw.matched_skills)
    ? raw.matched_skills
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          skill: String(item.skill ?? '').trim(),
          evidence: String(item.evidence ?? '').trim(),
        }))
        .filter((item) => item.skill.length > 0)
    : [];

  const missing_skills = Array.isArray(raw.missing_skills)
    ? raw.missing_skills
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => {
          const impRaw = String(item.importance ?? 'Medium').toLowerCase();
          const importance: 'High' | 'Medium' | 'Low' =
            impRaw === 'high' ? 'High' : impRaw === 'low' ? 'Low' : 'Medium';
          return {
            skill: String(item.skill ?? '').trim(),
            importance,
            reason: String(item.reason ?? '').trim(),
          };
        })
        .filter((item) => item.skill.length > 0)
    : [];

  const partial_skills = Array.isArray(raw.partial_skills)
    ? raw.partial_skills
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item) => ({
          skill: String(item.skill ?? '').trim(),
          note: String(item.note ?? '').trim(),
        }))
        .filter((item) => item.skill.length > 0)
    : [];

  const toStringList = (val: unknown): string[] =>
    Array.isArray(val)
      ? val.map((v) => String(v ?? '').trim()).filter((s) => s.length > 0)
      : [];

  return {
    overall_score,
    verdict,
    skill_score,
    experience_score,
    education_score,
    matched_skills,
    missing_skills,
    partial_skills,
    ats_issues: toStringList(raw.ats_issues),
    strengths: toStringList(raw.strengths),
    weaknesses: toStringList(raw.weaknesses),
    improvement_suggestions: toStringList(raw.improvement_suggestions),
    optimized_summary: String(raw.optimized_summary ?? '').trim(),
    recruiter_summary: String(raw.recruiter_summary ?? '').trim(),
    interview_questions: toStringList(raw.interview_questions).slice(0, 5),
  };
}

async function generateWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  maxAttempts = 3
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
          systemInstruction:
            'You are a strict principal technical recruiter and ATS evaluation engine. Never inflate scores. Penalize missing must-have skills heavily. Recognize industry synonyms accurately (e.g., React.js = ReactJS = React, Node.js = NodeJS, PostgreSQL = Postgres, K8s = Kubernetes). Quote exact verbatim resume text for matched skill evidence.',
        },
      });
      if (!response.text) {
        throw new Error('Empty response received from Gemini API.');
      }
      return response.text;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('DEADLINE_EXCEEDED');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/analyze', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error:
            'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const body = req.body as {
        resumeText?: unknown;
        jobDescription?: unknown;
        jobRole?: unknown;
      };

      const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
      const jobDescription =
        typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
      const jobRole =
        typeof body.jobRole === 'string' && body.jobRole.trim()
          ? body.jobRole.trim()
          : 'Software Engineer';

      if (!resumeText) {
        res.status(400).json({ error: 'Please upload resume PDF' });
        return;
      }

      if (!jobDescription) {
        res.status(400).json({ error: 'Please paste Job Description' });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Evaluate the following candidate resume against the target job description for the role "${jobRole}".

STRICT SCORING RULES:
1. Do NOT inflate scores. A candidate missing multiple must-have requirements must score below 70, and missing critical core requirements must drop the score below 60.
2. Recognize technical synonyms and equivalents accurately (for example: React.js = ReactJS = React, Node.js = Node, PostgreSQL = Postgres, AWS ECS = container orchestration on AWS, CI/CD = GitHub Actions).
3. For every item in "matched_skills", provide an exact verbatim quote from the resume text in "evidence".
4. For "missing_skills", classify importance as "High" (must-have / core requirement), "Medium" (important secondary skill), or "Low" (nice-to-have) and explain why it matters for this JD.
5. For "partial_skills", identify skills where the candidate has adjacent/basic exposure or fewer years than requested.
6. Identify real ATS formatting, keyword density, metrics, or seniority alignment issues in "ats_issues".
7. Write an "optimized_summary" tailored specifically to this JD in ~3 concise lines.
8. Write 3 targeted "interview_questions" probing the candidate's specific skill gaps or partial matches.
9. Verdict mapping guidance: Strong Match (80-100), Moderate Match (60-79), Weak Match (0-59).

TARGET ROLE:
${jobRole}

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 18000)}
"""

CANDIDATE RESUME TEXT:
"""
${resumeText.slice(0, 28000)}
"""

Return ONLY valid JSON matching the required schema.`;

      const rawOutput = await generateWithRetry(ai, prompt);
      const parsed = extractJsonFromText(rawOutput);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Model returned non-object JSON payload.');
      }

      const normalized = normalizeResult(parsed as Record<string, unknown>);
      res.json(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected analysis error';
      console.error('Analysis error:', error);

      if (message.includes('API_KEY_INVALID') || message.includes('403') || message.includes('PERMISSION_DENIED')) {
        res.status(403).json({
          error: 'The configured Gemini API key was rejected. Please verify GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error: 'Gemini API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      res.status(500).json({
        error: `AI analysis failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResumeRank AI server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
