export type JobRole =
  | 'Software Engineer'
  | 'Data Analyst'
  | 'Marketing'
  | 'Designer'
  | 'Other';

export const JOB_ROLES: JobRole[] = [
  'Software Engineer',
  'Data Analyst',
  'Marketing',
  'Designer',
  'Other',
];

export type VerdictLabel = 'Strong Match' | 'Moderate Match' | 'Weak Match';

export type ImportanceLevel = 'High' | 'Medium' | 'Low';

export interface MatchedSkill {
  skill: string;
  evidence: string;
}

export interface MissingSkill {
  skill: string;
  importance: ImportanceLevel;
  reason: string;
}

export interface PartialSkill {
  skill: string;
  note: string;
}

export interface ResumeAnalysisResult {
  overall_score: number;
  verdict: VerdictLabel;
  skill_score: number;
  experience_score: number;
  education_score: number;
  matched_skills: MatchedSkill[];
  missing_skills: MissingSkill[];
  partial_skills: PartialSkill[];
  ats_issues: string[];
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  optimized_summary: string;
  recruiter_summary: string;
  interview_questions: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  fileName: string;
  jobRole: JobRole;
  overallScore: number;
  verdict: VerdictLabel;
  jdSnippet: string;
  result: ResumeAnalysisResult;
}
