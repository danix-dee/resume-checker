import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';
const GEMINI_FALLBACK_MODEL = 'gemini-4-hydrogen';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    overall_score: { type: Type.INTEGER },
    verdict: { type: Type.STRING },
    skill_score: { type: Type.INTEGER },
    experience_score: { type: Type.INTEGER },
    education_score: { type: Type.INTEGER },
    matched_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          evidence: { type: Type.STRING },
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
          importance: { type: Type.STRING },
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
    ats_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    optimized_summary: { type: Type.STRING },
    recruiter_summary: { type: Type.STRING },
    interview_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Could not parse structured JSON from AI output.');
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

function buildUserPrompt(resumeText: string, jobDescription: string, targetRole: string): string {
  return `Analyze the RESUME against the JOB DESCRIPTION for the target role "${targetRole}".

STRICT RULES:
- Do NOT inflate scores. Penalize missing must-have skills heavily.
- Understand synonyms accurately (e.g., React.js = ReactJS = React, Node.js = NodeJS, PostgreSQL = Postgres, K8s = Kubernetes).
- Return ONLY valid JSON with this exact structure:
{
  "overall_score": number 0-100,
  "verdict": "Strong Match" | "Moderate Match" | "Weak Match",
  "skill_score": number 0-100,
  "experience_score": number 0-100,
  "education_score": number 0-100,
  "matched_skills": [{"skill": "", "evidence": "exact quote from resume"}],
  "missing_skills": [{"skill": "", "importance": "High" | "Medium" | "Low", "reason": ""}],
  "partial_skills": [{"skill": "", "note": ""}],
  "ats_issues": [""],
  "strengths": [""],
  "weaknesses": [""],
  "improvement_suggestions": ["specific actionable suggestion"],
  "optimized_summary": "rewritten professional summary tailored to this JD, 3 lines",
  "recruiter_summary": "2-3 sentences recruiter verdict",
  "interview_questions": ["3 likely interview questions based on gaps"]
}

TARGET ROLE:
${targetRole}

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 18000)}
"""

RESUME TEXT:
"""
${resumeText.slice(0, 28000)}
"""`;
}

async function discoverGroqChatModel(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      data?: Array<{ id?: string; active?: boolean }>;
    };
    const candidates = (payload.data ?? [])
      .filter((m) => m.active !== false && typeof m.id === 'string')
      .map((m) => m.id as string)
      .filter((id) => !/whisper|tts|guard|safeguard|orpheus|playai/i.test(id));

    if (candidates.length === 0) return null;

    const preferenceOrder = [
      /llama-3\.3-70b/i,
      /llama-4/i,
      /llama3-70b/i,
      /llama-3\.1-70b/i,
      /openai\/gpt-oss-120b/i,
      /openai\/gpt-oss-20b/i,
      /qwen/i,
      /llama-3\.1-8b/i,
      /llama3-8b/i,
      /mixtral/i,
      /gemma/i,
    ];

    for (const pattern of preferenceOrder) {
      const match = candidates.find((id) => pattern.test(id));
      if (match) return match;
    }
    return candidates[0];
  } catch {
    return null;
  }
}

async function analyzeWithGroq(apiKey: string, userPrompt: string) {
  const sendGroqRequest = async (model: string) =>
    fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS Recruiter. Return ONLY valid JSON, no markdown, no extra text.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

  let response = await sendGroqRequest(GROQ_PRIMARY_MODEL);

  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    response = await sendGroqRequest(GROQ_PRIMARY_MODEL);
    if (response.status === 429) {
      throw new Error('Groq rate limit, please wait 10 seconds and retry');
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Server Groq API Key is invalid. Please contact admin.');
  }

  if (!response.ok) {
    response = await sendGroqRequest(GROQ_FALLBACK_MODEL);
    if (response.status === 429) {
      throw new Error('Groq rate limit, please wait 10 seconds and retry');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Server Groq API Key is invalid. Please contact admin.');
    }
    if (response.status === 404) {
      const discoveredModel = await discoverGroqChatModel(apiKey);
      if (discoveredModel && discoveredModel !== GROQ_PRIMARY_MODEL && discoveredModel !== GROQ_FALLBACK_MODEL) {
        response = await sendGroqRequest(discoveredModel);
      }
    }
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errBody}`);
    }
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq API returned an empty response.');
  }

  return extractJsonFromText(content);
}

async function analyzeWithGeminiFallback(apiKey: string, userPrompt: string) {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_FALLBACK_MODEL,
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
          systemInstruction:
            'You are an expert ATS Recruiter. Return ONLY valid JSON, no markdown, no extra text. Never inflate scores.',
        },
      });

      if (!response.text) {
        throw new Error('AI provider returned an empty response.');
      }

      return extractJsonFromText(response.text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 1 && (msg.includes('503') || msg.includes('UNAVAILABLE'))) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        continue;
      }
      if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
        throw new Error(
          'Fallback AI model is temporarily busy (503). Configure GROQ_API_KEY on the server for fast Groq Llama 3.3 inference, or try again shortly.'
        );
      }
      throw err;
    }
  }
  throw new Error('AI analysis failed.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/analyze', async (req, res) => {
    try {
      const body = req.body as {
        resumeText?: unknown;
        jobDescription?: unknown;
        targetRole?: unknown;
        jobRole?: unknown;
      };

      const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
      const jobDescription =
        typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
      const targetRoleRaw = body.targetRole ?? body.jobRole;
      const targetRole =
        typeof targetRoleRaw === 'string' && targetRoleRaw.trim()
          ? targetRoleRaw.trim()
          : 'Software Engineer';

      if (!resumeText) {
        res.status(400).json({ error: 'Please upload resume PDF' });
        return;
      }
      if (!jobDescription) {
        res.status(400).json({ error: 'Please paste Job Description' });
        return;
      }

      const rawGroqKey = process.env.GROQ_API_KEY?.trim();
      const rawGeminiKey = process.env.GEMINI_API_KEY?.trim();
      const groqKey = rawGroqKey && rawGroqKey !== 'your_key_here' ? rawGroqKey : '';
      const geminiKey = rawGeminiKey && rawGeminiKey !== 'MY_GEMINI_API_KEY' ? rawGeminiKey : '';

      if (!groqKey && !geminiKey) {
        res.status(500).json({
          error: 'Server API Key not configured. Please contact admin.',
        });
        return;
      }

      const prompt = buildUserPrompt(resumeText, jobDescription, targetRole);
      const parsed = groqKey
        ? await analyzeWithGroq(groqKey, prompt)
        : await analyzeWithGeminiFallback(geminiKey, prompt);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI provider returned an invalid JSON payload.');
      }

      const normalized = normalizeResult(parsed as Record<string, unknown>);
      res.json(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected server analysis error.';
      console.error('Analysis error:', err);
      res.status(500).json({ error: message });
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
