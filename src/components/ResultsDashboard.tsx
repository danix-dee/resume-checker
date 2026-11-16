import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileSearch,
  FileWarning,
  HelpCircle,
  KeyRound,
  Layers,
  Lightbulb,
  MessageSquareQuote,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from 'lucide-react';
import type { JobRole, ResumeAnalysisResult } from '../types/analysis';
import { formatAnalysisReport } from '../utils/reportFormatter';
import { ScoreGauge } from './ScoreGauge';

interface ResultsDashboardProps {
  result: ResumeAnalysisResult | null;
  isAnalyzing: boolean;
  fileName: string | null;
  jobRole: JobRole;
  onReset: () => void;
  onScrollToApiKey: () => void;
}

type ResultsTab = 'overview' | 'skills' | 'ats' | 'interview';

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const fillGradient =
    value >= 80
      ? 'from-[#10B981] to-[#22D3EE]'
      : value >= 60
      ? 'from-[#6366F1] to-[#8B5CF6]'
      : 'from-[#F43F5E] to-[#F59E0B]';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8]">
          {label}
        </span>
        <span className="font-score text-base font-bold text-[#0F172A] dark:text-white tabular-nums">
          {value}%
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-[#1E293B]">
        <div
          style={{ width: `${value}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${fillGradient} transition-all duration-700 ease-out`}
        />
      </div>
    </div>
  );
}

function getImportanceBadgeClass(importance: 'High' | 'Medium' | 'Low'): string {
  if (importance === 'High') {
    return 'bg-[#F43F5E]/15 text-[#BE123C] border-[#F43F5E]/50 dark:bg-[#F43F5E]/20 dark:text-[#F43F5E] dark:border-[#F43F5E]/35';
  }
  if (importance === 'Medium') {
    return 'bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/50 dark:bg-[#F59E0B]/20 dark:text-[#F59E0B] dark:border-[#F59E0B]/35';
  }
  return 'bg-slate-200 text-[#334155] border-slate-400 dark:bg-[#1E293B] dark:text-[#94A3B8] dark:border-slate-700';
}

export function ResultsDashboard({
  result,
  isAnalyzing,
  fileName,
  jobRole,
  onReset,
  onScrollToApiKey,
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('overview');
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleCopyReport = async () => {
    if (!result) return;
    const text = formatAnalysisReport(result, {
      fileName: fileName ?? 'resume.pdf',
      jobRole,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // Clipboard permission ignored
    }
  };

  const handleCopySummary = async () => {
    if (!result?.optimized_summary) return;
    try {
      await navigator.clipboard.writeText(result.optimized_summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Clipboard permission ignored
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  /* Loading State: Shimmer Skeleton + Animated AI Typing Dots */
  if (isAnalyzing) {
    return (
      <section
        id="results"
        aria-label="Analysis in progress"
        className="space-y-5 rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-[1.5px] border-[#CBD5E1] pb-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_24px_rgba(99,102,241,0.4)]">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white">
                  Calling Gemini AI
                </p>
                <span className="inline-flex items-center gap-1 pt-1" aria-hidden="true">
                  <span className="typing-dot-1 h-1.5 w-1.5 rounded-full bg-[#0284C7] dark:bg-[#22D3EE]" />
                  <span className="typing-dot-2 h-1.5 w-1.5 rounded-full bg-[#6366F1]" />
                  <span className="typing-dot-3 h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Evaluating your resume and job description with live Gemini intelligence
              </p>
            </div>
          </div>
          <div className="skeleton-shimmer h-9 w-36 rounded-xl" />
        </div>

        <div className="grid gap-6 sm:grid-cols-12 items-center py-4">
          <div className="sm:col-span-5 flex justify-center">
            <div className="skeleton-shimmer h-[180px] w-[180px] rounded-full" />
          </div>
          <div className="sm:col-span-7 space-y-5">
            <div className="skeleton-shimmer h-6 w-full rounded-xl" />
            <div className="skeleton-shimmer h-6 w-full rounded-xl" />
            <div className="skeleton-shimmer h-6 w-full rounded-xl" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="skeleton-shimmer h-36 rounded-2xl" />
          <div className="skeleton-shimmer h-36 rounded-2xl" />
        </div>
      </section>
    );
  }

  /* Empty State */
  if (!result) {
    return (
      <section
        id="results"
        aria-label="Results dashboard empty state"
        className="flex min-h-[600px] flex-col items-center justify-center rounded-[20px] border-[1.5px] border-slate-400 bg-white p-6 sm:p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border-[1.5px] border-slate-300 bg-[#F8FAFC] dark:border-slate-700 dark:bg-[#0B0F19]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#6366F1]/25 via-[#8B5CF6]/15 to-[#22D3EE]/25 blur-xl"
          />
          <FileSearch
            className="relative h-12 w-12 text-[#6366F1] dark:text-[#22D3EE]"
            aria-hidden="true"
          />
        </div>

        <h2 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white text-balance">
          No Analysis Yet
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-[#64748B] dark:text-[#94A3B8]">
          Add your API Key, upload resume, paste JD and click Analyze to see real AI results
        </p>

        <button
          type="button"
          onClick={onScrollToApiKey}
          className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 text-[15px] font-semibold text-white shadow-[0_8px_28px_rgba(99,102,241,0.35)] hover:scale-[1.02] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
        >
          <KeyRound className="h-4.5 w-4.5" aria-hidden="true" />
          <span>Add API Key</span>
        </button>
      </section>
    );
  }

  const tabs: { id: ResultsTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'skills',
      label: 'Skills',
      count: result.matched_skills.length + result.missing_skills.length,
    },
    {
      id: 'ats',
      label: 'ATS & Improvements',
      count: result.ats_issues.length + result.improvement_suggestions.length,
    },
    {
      id: 'interview',
      label: 'Interview Prep',
      count: result.interview_questions.length,
    },
  ];

  return (
    <div id="results" className="space-y-5 print-full-width">
      {/* Print-Only Report Header */}
      <div className="hidden print-only-block border-b border-slate-300 pb-4 mb-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          ResumeRank AI — Candidate Evaluation Report
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Candidate: {fileName ?? 'Resume'} · Role: {jobRole} · Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Top Action & Tabs Bar */}
      <div className="no-print rounded-[20px] border-[1.5px] border-slate-300 bg-white p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0284C7] dark:text-[#22D3EE]">
              {jobRole} Evaluation
            </p>
            <h2 className="mt-1 truncate font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white">
              {fileName ?? 'Evaluated Resume'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-400 bg-white px-5 text-[15px] font-semibold text-[#0F172A] hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:text-white transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Analyze Another Resume</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-400 bg-white px-5 text-[15px] font-semibold text-[#0F172A] hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:text-white transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
            >
              {copiedReport ? (
                <>
                  <ClipboardCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#0284C7] dark:text-[#22D3EE]" aria-hidden="true" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 text-[15px] font-semibold text-white shadow-[0_6px_24px_rgba(99,102,241,0.32)] hover:scale-[1.02] transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Interactive Switchable Tabs */}
        <div
          role="tablist"
          aria-label="Analysis report sections"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  isSelected
                    ? 'border-transparent bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_4px_18px_rgba(99,102,241,0.3)]'
                    : 'border-slate-300 bg-[#F8FAFC] text-[#334155] hover:border-slate-400 hover:bg-slate-100 hover:text-[#0F172A] dark:border-slate-700 dark:bg-[#0B0F19]/80 dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`font-score text-xs font-bold tabular-nums ${
                      isSelected ? 'text-white/90' : 'text-[#0284C7] dark:text-[#22D3EE]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      <div className={activeTab === 'overview' ? 'space-y-5' : 'hidden print-only-block space-y-5'}>
        <section className="print-card rounded-[20px] border-[1.5px] border-slate-400 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="grid gap-8 md:grid-cols-12 items-center">
            <div className="md:col-span-5 flex justify-center">
              <ScoreGauge score={result.overall_score} verdict={result.verdict} />
            </div>

            <div className="md:col-span-7 space-y-5">
              <div className="pb-3 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Award className="h-4.5 w-4.5 text-[#0284C7] dark:text-[#22D3EE]" aria-hidden="true" />
                  <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                    Score Breakdown
                  </h3>
                </div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] print-text-muted">
                  Weighted evaluation across domain skills, experience seniority, and education
                </p>
              </div>

              <div className="space-y-4">
                <BreakdownBar label="Skills Score" value={result.skill_score} />
                <BreakdownBar label="Experience Score" value={result.experience_score} />
                <BreakdownBar label="Education Score" value={result.education_score} />
              </div>
            </div>
          </div>
        </section>

        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <MessageSquareQuote className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
              Recruiter Verdict
            </h3>
          </div>
          <p className="text-[15px] leading-[1.6] text-[#334155] dark:text-[#CBD5E1] print-text-dark">
            {result.recruiter_summary}
          </p>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#059669] dark:text-[#10B981]">
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                Strengths
              </h3>
            </div>
            <ul className="space-y-3">
              {result.strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-[15px] leading-[1.6] text-[#334155] dark:text-[#CBD5E1] print-text-dark"
                >
                  <CheckCircle2
                    className="mt-1 h-4 w-4 shrink-0 text-[#059669] dark:text-[#10B981]"
                    aria-hidden="true"
                  />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F43F5E]/15 text-[#E11D48] dark:text-[#F43F5E]">
                <ThumbsDown className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                Weaknesses
              </h3>
            </div>
            <ul className="space-y-3">
              {result.weaknesses.map((weakness, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-[15px] leading-[1.6] text-[#334155] dark:text-[#CBD5E1] print-text-dark"
                >
                  <XCircle
                    className="mt-1 h-4 w-4 shrink-0 text-[#E11D48] dark:text-[#F43F5E]"
                    aria-hidden="true"
                  />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="print-card rounded-[20px] border-[1.5px] border-[#6366F1]/60 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-[#6366F1]/35 dark:bg-[#111827]/90 dark:backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                Optimized Professional Summary
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="no-print inline-flex h-10 items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 text-xs font-semibold text-[#0F172A] hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1E293B] dark:text-white transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              {copiedSummary ? (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#0284C7] dark:text-[#22D3EE]" aria-hidden="true" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[15px] leading-[1.6] text-[#334155] dark:text-[#CBD5E1] print-text-dark">
            {result.optimized_summary}
          </p>
        </section>
      </div>

      {/* TAB 2: SKILLS */}
      <div className={activeTab === 'skills' ? 'space-y-5' : 'hidden print-only-block space-y-5'}>
        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl">
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22D3EE]/15 text-[#0284C7] dark:text-[#22D3EE]">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
              Skill Signal Matrix
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.matched_skills.map((item, idx) => (
              <span
                key={`chip-match-${idx}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/50 bg-[#10B981]/10 px-[14px] py-2 text-xs font-semibold text-[#059669] dark:border-[#10B981]/35 dark:text-[#22D3EE]"
              >
                <Check className="h-3.5 w-3.5 text-[#059669] dark:text-[#10B981]" aria-hidden="true" />
                <span>{item.skill}</span>
              </span>
            ))}
            {result.missing_skills.map((item, idx) => (
              <span
                key={`chip-miss-${idx}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#F43F5E]/50 bg-[#F43F5E]/10 px-[14px] py-2 text-xs font-semibold text-[#BE123C] dark:border-[#F43F5E]/35 dark:text-[#FDA4AF]"
              >
                <XCircle className="h-3.5 w-3.5 text-[#E11D48] dark:text-[#F43F5E]" aria-hidden="true" />
                <span>{item.skill}</span>
              </span>
            ))}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#059669] dark:text-[#10B981]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                  Matched Skills
                </h3>
              </div>
              <span className="font-score text-sm font-bold text-[#059669] dark:text-[#10B981] tabular-nums">
                {result.matched_skills.length}
              </span>
            </div>

            {result.matched_skills.length === 0 ? (
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                No matched skills detected.
              </p>
            ) : (
              <div className="space-y-3">
                {result.matched_skills.map((item, idx) => (
                  <div
                    key={`${item.skill}-${idx}`}
                    className="rounded-xl border-[1.5px] border-slate-300 border-l-4 border-l-[#10B981] bg-[#F8FAFC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:border-l-[#10B981] dark:bg-[#0B0F19]/75 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10B981]/20 text-[#059669] dark:text-[#10B981]">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-[15px] font-bold text-[#0F172A] dark:text-white print-text-dark">
                        {item.skill}
                      </span>
                    </div>
                    {item.evidence && (
                      <p className="mt-2 text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8] print-text-muted">
                        Evidence: &ldquo;{item.evidence}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F43F5E]/15 text-[#E11D48] dark:text-[#F43F5E]">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                  Missing Skills
                </h3>
              </div>
              <span className="font-score text-sm font-bold text-[#E11D48] dark:text-[#F43F5E] tabular-nums">
                {result.missing_skills.length}
              </span>
            </div>

            {result.missing_skills.length === 0 ? (
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                No critical missing skills found.
              </p>
            ) : (
              <div className="space-y-3">
                {result.missing_skills.map((item, idx) => (
                  <div
                    key={`${item.skill}-${idx}`}
                    className="rounded-xl border-[1.5px] border-slate-300 border-l-4 border-l-[#F43F5E] bg-[#F8FAFC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:border-l-[#F43F5E] dark:bg-[#0B0F19]/75 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-bold text-[#0F172A] dark:text-white print-text-dark">
                        {item.skill}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] shrink-0 ${getImportanceBadgeClass(
                          item.importance
                        )}`}
                      >
                        {item.importance}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="mt-2 text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8] print-text-muted">
                        {item.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#D97706] dark:text-[#F59E0B]">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
                Partial Skills
              </h3>
            </div>
            <span className="font-score text-sm font-bold text-[#D97706] dark:text-[#F59E0B] tabular-nums">
              {result.partial_skills.length}
            </span>
          </div>

          {result.partial_skills.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              No partial skill overlaps detected.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {result.partial_skills.map((item, idx) => (
                <div
                  key={`${item.skill}-${idx}`}
                  className="rounded-xl border-[1.5px] border-slate-300 border-l-4 border-l-[#F59E0B] bg-[#F8FAFC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:border-l-[#F59E0B] dark:bg-[#0B0F19]/75"
                >
                  <p className="text-[15px] font-bold text-[#0F172A] dark:text-white print-text-dark">
                    {item.skill}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8] print-text-muted">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* TAB 3: ATS & IMPROVEMENTS */}
      <div className={activeTab === 'ats' ? 'space-y-5' : 'hidden print-only-block space-y-5'}>
        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#D97706] dark:text-[#F59E0B]">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
              ATS Compatibility Issues
            </h3>
          </div>

          {result.ats_issues.length === 0 ? (
            <p className="text-[15px] font-medium text-[#059669] dark:text-[#10B981]">
              No ATS parsing or keyword formatting issues detected.
            </p>
          ) : (
            <ul className="space-y-3">
              {result.ats_issues.map((issue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border-[1.5px] border-[#F59E0B]/50 bg-[#F59E0B]/10 p-4 text-[15px] leading-[1.6] text-[#334155] dark:border-[#F59E0B]/25 dark:bg-[#F59E0B]/5 dark:text-[#CBD5E1] print-text-dark"
                >
                  <FileWarning
                    className="mt-1 h-4.5 w-4.5 shrink-0 text-[#D97706] dark:text-[#F59E0B]"
                    aria-hidden="true"
                  />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
              Actionable Improvement Plan
            </h3>
          </div>

          <ol className="space-y-3">
            {result.improvement_suggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3.5 rounded-xl border-[1.5px] border-slate-300 bg-[#F8FAFC] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#0B0F19]/60"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] font-score text-xs font-bold text-white tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-[15px] leading-[1.6] text-[#334155] dark:text-[#CBD5E1] print-text-dark">
                  {suggestion}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* TAB 4: INTERVIEW PREP */}
      <div className={activeTab === 'interview' ? 'space-y-5' : 'hidden print-only-block space-y-5'}>
        <section className="print-card rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white print-text-dark">
              Gap-Targeted Interview Questions
            </h3>
          </div>

          <p className="mb-4 text-sm text-[#64748B] dark:text-[#94A3B8]">
            Questions an interviewer is likely to ask based on missing or partial qualifications in your resume.
          </p>

          <ol className="space-y-4">
            {result.interview_questions.map((question, idx) => (
              <li
                key={idx}
                className="rounded-2xl border-[1.5px] border-slate-300 bg-[#F8FAFC] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#0B0F19]/70 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0284C7] dark:text-[#22D3EE]">
                  Question {idx + 1}
                </span>
                <p className="mt-2 text-[15px] font-medium leading-[1.6] text-[#0F172A] dark:text-white print-text-dark">
                  {question}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
