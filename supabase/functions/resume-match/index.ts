import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT_LENGTH = 50000;
const GEMINI_MODEL = 'gemini-2.5-flash';

type ResumeMatchRequest = {
  resumeText?: unknown;
  jobDescription?: unknown;
};

type ResumeMatchResult = {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function parseRequestBody(body: ResumeMatchRequest) {
  if (typeof body.resumeText !== 'string' || typeof body.jobDescription !== 'string') {
    return { error: 'resumeText and jobDescription must be strings.' };
  }

  const resumeText = body.resumeText.trim();
  const jobDescription = body.jobDescription.trim();

  if (!resumeText) {
    return { error: 'resumeText is required.' };
  }

  if (!jobDescription) {
    return { error: 'jobDescription is required.' };
  }

  if (resumeText.length > MAX_TEXT_LENGTH || jobDescription.length > MAX_TEXT_LENGTH) {
    return { error: `Each field must be ${MAX_TEXT_LENGTH} characters or fewer.` };
  }

  return { resumeText, jobDescription };
}

function buildPrompt(resumeText: string, jobDescription: string) {
  return `You are an expert technical recruiter. Compare the resume against the job description.

Return JSON only with:
- matchScore: integer 0-100
- strengths: 3-6 concise strings
- missingSkills: 3-6 concise strings
- improvementSuggestions: 3-5 actionable strings

Resume:
${resumeText}

Job Description:
${jobDescription}`;
}

function normalizeStringArray(value: unknown, maxItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function normalizeResult(payload: unknown): ResumeMatchResult | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as Partial<ResumeMatchResult>;
  const rawScore = candidate.matchScore;

  if (typeof rawScore !== 'number' || Number.isNaN(rawScore)) {
    return null;
  }

  const matchScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const strengths = normalizeStringArray(candidate.strengths, 8);
  const missingSkills = normalizeStringArray(candidate.missingSkills, 8);
  const improvementSuggestions = normalizeStringArray(candidate.improvementSuggestions, 8);

  if (
    strengths.length === 0 ||
    missingSkills.length === 0 ||
    improvementSuggestions.length === 0
  ) {
    return null;
  }

  return {
    matchScore,
    strengths,
    missingSkills,
    improvementSuggestions,
  };
}

async function callGemini(apiKey: string, resumeText: string, jobDescription: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(resumeText, jobDescription) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              matchScore: { type: 'integer' },
              strengths: { type: 'array', items: { type: 'string' } },
              missingSkills: { type: 'array', items: { type: 'string' } },
              improvementSuggestions: { type: 'array', items: { type: 'string' } },
            },
            required: ['matchScore', 'strengths', 'missingSkills', 'improvementSuggestions'],
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  const parsed = JSON.parse(text);
  const normalized = normalizeResult(parsed);

  if (!normalized) {
    throw new Error('Gemini returned an invalid analysis payload.');
  }

  return normalized;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Supabase environment is not configured.' }, 500);
    }

    if (!geminiApiKey) {
      return jsonResponse({ error: 'Gemini API key is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header.' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    let requestBody: ResumeMatchRequest;
    try {
      requestBody = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const parsedBody = parseRequestBody(requestBody);
    if ('error' in parsedBody) {
      return jsonResponse({ error: parsedBody.error }, 400);
    }

    const analysis = await callGemini(
      geminiApiKey,
      parsedBody.resumeText,
      parsedBody.jobDescription
    );

    return jsonResponse(analysis, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonResponse({ error: message }, 500);
  }
});
