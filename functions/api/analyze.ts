interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_PRIMARY_MODEL = 'llama-3.3-70b-versatile';
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';
const GEMINI_FALLBACK_MODEL = 'gemini-4-hydrogen';

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
    throw new Error('Could not parse valid JSON from AI response.');
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

async function callGroq(apiKey: string, userPrompt: string) {
  const runRequest = async (model: string) =>
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

  let response = await runRequest(GROQ_PRIMARY_MODEL);

  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    response = await runRequest(GROQ_PRIMARY_MODEL);
    if (response.status === 429) {
      throw new Error('Groq rate limit, please wait 10 seconds and retry');
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Server Groq API Key is invalid. Please contact admin.');
  }

  if (!response.ok) {
    response = await runRequest(GROQ_FALLBACK_MODEL);
    if (response.status === 429) {
      throw new Error('Groq rate limit, please wait 10 seconds and retry');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Server Groq API Key is invalid. Please contact admin.');
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
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

async function callGeminiFallback(apiKey: string, userPrompt: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI provider error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI provider returned an empty response.');
  }
  return extractJsonFromText(rawText);
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const body = (await context.request.json()) as {
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
      return Response.json({ error: 'Please upload resume PDF' }, { status: 400 });
    }
    if (!jobDescription) {
      return Response.json({ error: 'Please paste Job Description' }, { status: 400 });
    }

    const groqKey = context.env.GROQ_API_KEY?.trim();
    const geminiKey = context.env.GEMINI_API_KEY?.trim();
    const validGroqKey = groqKey && groqKey !== 'your_key_here' ? groqKey : '';
    const validGeminiKey = geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' ? geminiKey : '';

    if (!validGroqKey && !validGeminiKey) {
      return Response.json(
        { error: 'Server API Key not configured. Please contact admin.' },
        { status: 500 }
      );
    }

    const prompt = buildUserPrompt(resumeText, jobDescription, targetRole);
    const parsed = validGroqKey
      ? await callGroq(validGroqKey, prompt)
      : await callGeminiFallback(validGeminiKey, prompt);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('AI returned an invalid JSON payload.');
    }

    const normalized = normalizeResult(parsed as Record<string, unknown>);
    return Response.json(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected analysis error';
    return Response.json({ error: message }, { status: 500 });
  }
}
