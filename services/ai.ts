import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type ResumeMatchAnalysis = {
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
};

async function getInvokeErrorMessage(error: FunctionsHttpError) {
  try {
    const payload = await error.context.json();
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const message = (payload as { error?: unknown }).error;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  } catch {
    return error.message;
  }

  return error.message;
}

function isResumeMatchAnalysis(value: unknown): value is ResumeMatchAnalysis {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ResumeMatchAnalysis>;

  return (
    typeof candidate.matchScore === 'number' &&
    Array.isArray(candidate.strengths) &&
    candidate.strengths.every((item) => typeof item === 'string') &&
    Array.isArray(candidate.missingSkills) &&
    candidate.missingSkills.every((item) => typeof item === 'string') &&
    Array.isArray(candidate.improvementSuggestions) &&
    candidate.improvementSuggestions.every((item) => typeof item === 'string')
  );
}

export async function analyzeResumeMatch(
  resumeText: string,
  jobDescription: string
): Promise<ResumeMatchAnalysis> {
  const trimmedResume = resumeText.trim();
  const trimmedJobDescription = jobDescription.trim();

  if (!trimmedResume) {
    throw new Error('Resume text is required.');
  }

  if (!trimmedJobDescription) {
    throw new Error('Job description is required.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be signed in to analyze your resume.');
  }

  const { data, error } = await supabase.functions.invoke('resume-match', {
    body: {
      resumeText: trimmedResume,
      jobDescription: trimmedJobDescription,
    },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      throw new Error(await getInvokeErrorMessage(error));
    }

    throw new Error(error.message || 'Could not reach the analysis service.');
  }

  if (!isResumeMatchAnalysis(data)) {
    throw new Error('Received an invalid analysis response.');
  }

  return data;
}
