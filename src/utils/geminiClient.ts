import type { JobRole, ResumeAnalysisResult, VerdictLabel } from '../types/analysis';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-4-hydrogen';

function buildEndpoint(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;
}

function isInvalidKeyError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    lower.includes('permission_denied')
  );
}

function isModelNotFoundError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 404 ||
    lower.includes('not_found') ||
    lower.includes('no longer available to new users') ||
    lower.includes('is not found')
  );
}

async function callGeminiEndpoint(
  model: string,
  apiKey: string,
  payload: Record<string, unknown>
): Promise<Response> {
  return fetch(buildEndpoint(model, apiKey), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const errJson = await response.json();
    const msg = errJson?.error?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }
  } catch {
    // Ignore non-JSON error body
  }
  return `Request failed with status ${response.status}`;
}

export async function testGeminiApiKey(apiKey: string): Promise<void> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Please enter your Gemini API Key first.');
  }

  const payload = {
    contents: [
      {
        parts: [{ text: 'Respond with the single word: OK' }],
      },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 16,
    },
  };

  let response = await callGeminiEndpoint(PRIMARY_MODEL, trimmedKey, payload);

  if (!response.ok) {
    const firstMsg = await parseErrorMessage(response);
    if (isInvalidKeyError(response.status, firstMsg)) {
      throw new Error('Invalid API Key. Please check your key from Google AI Studio and try again.');
    }

    if (isModelNotFoundError(response.status, firstMsg)) {
      const fallbackPayload = {
        contents: payload.contents,
      };
      response = await callGeminiEndpoint(FALLBACK_MODEL, trimmedKey, fallbackPayload);
      if (!response.ok) {
        const secondMsg = await parseErrorMessage(response);
        if (isInvalidKeyError(response.status, secondMsg)) {
          throw new Error(
            'Invalid API Key. Please check your key from Google AI Studio and try again.'
          );
        }
        throw new Error(secondMsg);
      }
    } else {
      throw new Error(firstMsg);
    }
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned an empty test response.');
  }
}

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
        // Continue to brace extraction
      }
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Could not parse valid JSON from Gemini response.');
  }
}

function clampScore(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeVerdict(verdict: unknown, score: number): VerdictLabel {
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

function normalizeResult(raw: Record<string, unknown>): ResumeAnalysisResult {
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

export async function analyzeResumeWithGemini(params: {
  apiKey: string;
  resumeText: string;
  jobDescription: string;
  jobRole: JobRole;
}): Promise<ResumeAnalysisResult> {
  const trimmedKey = params.apiKey.trim();
  if (!trimmedKey) {
    throw new Error('Please add your Gemini API Key first');
  }

  const prompt = `You are a strict principal technical recruiter and ATS evaluation engine.
Analyze the candidate resume below against the target Job Description for the role "${params.jobRole}".

STRICT RULES:
- Do NOT inflate scores. Penalize missing must-have skills heavily.
- Understand synonyms accurately (e.g., React.js = ReactJS = React, Node.js = NodeJS, PostgreSQL = Postgres, K8s = Kubernetes).
- Return ONLY valid JSON with this exact structure and field names:
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
${params.jobRole}

JOB DESCRIPTION:
"""
${params.jobDescription.slice(0, 18000)}
"""

RESUME TEXT:
"""
${params.resumeText.slice(0, 28000)}
"""`;

  const baseContents = [
    {
      parts: [{ text: prompt }],
    },
  ];

  let response = await callGeminiEndpoint(PRIMARY_MODEL, trimmedKey, {
    contents: baseContents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  if (!response.ok) {
    const firstMsg = await parseErrorMessage(response);
    if (isInvalidKeyError(response.status, firstMsg)) {
      throw new Error('Invalid API Key. Please check your key from Google AI Studio and try again.');
    }

    if (isModelNotFoundError(response.status, firstMsg)) {
      response = await callGeminiEndpoint(FALLBACK_MODEL, trimmedKey, {
        contents: baseContents,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      if (!response.ok) {
        const secondMsg = await parseErrorMessage(response);
        if (isInvalidKeyError(response.status, secondMsg)) {
          throw new Error(
            'Invalid API Key. Please check your key from Google AI Studio and try again.'
          );
        }
        throw new Error(secondMsg);
      }
    } else if (response.status === 429) {
      throw new Error('Gemini API rate limit exceeded. Please wait a moment and try again.');
    } else {
      throw new Error(firstMsg);
    }
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Gemini API returned an empty analysis response. Please try again.');
  }

  const parsed = extractJsonFromText(rawText);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini API returned an invalid JSON structure.');
  }

  return normalizeResult(parsed as Record<string, unknown>);
}
