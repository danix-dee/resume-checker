import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Header } from './components/Header';
import { HistorySidebar } from './components/HistorySidebar';
import { InputPanel } from './components/InputPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import type { HistoryEntry, JobRole, ResumeAnalysisResult } from './types/analysis';
import { extractTextFromPdf, validatePdfFile } from './utils/pdfExtractor';

const HISTORY_STORAGE_KEY = 'resumerank_history_v1';
const THEME_STORAGE_KEY = 'resumerank_theme_v1';
const MAX_HISTORY_ITEMS = 3;

function loadSavedHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function loadSavedTheme(): boolean {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light') return false;
    return true;
  } catch {
    return true;
  }
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(loadSavedTheme);

  // Toast notifications
  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  // Input state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);

  const [jobRole, setJobRole] = useState<JobRole>('Software Engineer');
  const [jobDescription, setJobDescription] = useState<string>('');

  // Analysis & results state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [activeFileNameForResult, setActiveFileNameForResult] = useState<string | null>(null);
  const [activeJobRoleForResult, setActiveJobRoleForResult] = useState<JobRole>('Software Engineer');

  // History state (last 3 real analyses)
  const [history, setHistory] = useState<HistoryEntry[]>(loadSavedHistory);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type: 'error' | 'success', message: string) => {
    setToast({ type, message });
  };

  const persistHistory = (items: HistoryEntry[]) => {
    const capped = items.slice(0, MAX_HISTORY_ITEMS);
    setHistory(capped);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // Ignore storage quota issues
    }
  };

  const handleSelectPdf = async (file: File) => {
    setErrorMessage(null);
    const validationError = validatePdfFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsExtractingPdf(true);
    try {
      const extracted = await extractTextFromPdf(file);
      setFileName(file.name);
      setFileSize(file.size);
      setPageCount(extracted.pageCount);
      setWordCount(extracted.wordCount);
      setResumeText(extracted.text);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to read PDF file. Please verify the file is not corrupted or encrypted.';
      setErrorMessage(msg);
      setFileName(null);
      setFileSize(null);
      setPageCount(null);
      setWordCount(null);
      setResumeText('');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleRemoveResume = () => {
    setFileName(null);
    setFileSize(null);
    setPageCount(null);
    setWordCount(null);
    setResumeText('');
    setErrorMessage(null);
  };

  const handleReset = () => {
    handleRemoveResume();
    setJobDescription('');
    setJobRole('Software Engineer');
    setAnalysisResult(null);
    setActiveHistoryId(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async () => {
    setErrorMessage(null);

    if (!resumeText.trim()) {
      const msg = 'Please upload resume PDF';
      setErrorMessage(msg);
      showToast('error', msg);
      return;
    }

    if (!jobDescription.trim()) {
      const msg = 'Please paste Job Description';
      setErrorMessage(msg);
      showToast('error', msg);
      return;
    }

    setIsAnalyzing(true);
    setActiveHistoryId(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetRole: jobRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Analysis failed with status ${response.status}.`);
      }

      const result = data as ResumeAnalysisResult;
      const resolvedFileName = fileName ?? 'resume.pdf';

      setAnalysisResult(result);
      setActiveFileNameForResult(resolvedFileName);
      setActiveJobRoleForResult(jobRole);

      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        fileName: resolvedFileName,
        jobRole,
        overallScore: result.overall_score,
        verdict: result.verdict,
        jdSnippet: jobDescription.slice(0, 120),
        result,
      };

      setActiveHistoryId(newEntry.id);
      persistHistory([newEntry, ...history]);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to complete AI analysis. Please try again.';
      setErrorMessage(msg);
      showToast('error', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setErrorMessage(null);
    setAnalysisResult(entry.result);
    setActiveFileNameForResult(entry.fileName);
    setActiveJobRoleForResult(entry.jobRole);
    setActiveHistoryId(entry.id);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    persistHistory(updated);
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleClearHistory = () => {
    persistHistory([]);
    setActiveHistoryId(null);
  };

  const resumesAnalyzedCount = history.length;
  const avgScore =
    resumesAnalyzedCount > 0
      ? Math.round(history.reduce((sum, item) => sum + item.overallScore, 0) / resumesAnalyzedCount)
      : null;

  return (
    <div className="saas-mesh-bg flex min-h-screen flex-col text-[#334155] dark:text-[#CBD5E1]">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onNewAnalysis={handleReset}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`no-print fixed right-4 top-[88px] z-50 flex max-w-md items-start gap-3 rounded-xl border px-4 py-3.5 shadow-xl backdrop-blur-xl ${
            toast.type === 'error'
              ? 'border-[#F43F5E]/50 bg-[#111827]/95 text-[#FDA4AF] shadow-[0_8px_32px_rgba(244,63,94,0.25)]'
              : 'border-[#10B981]/50 bg-[#111827]/95 text-[#6EE7B7] shadow-[0_8px_32px_rgba(16,185,129,0.2)]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#F43F5E]" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#10B981]" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-white">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-2 rounded p-0.5 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 lg:p-8">
        {/* Hero Strip */}
        <section
          aria-label="Workspace overview"
          className="no-print mb-6 rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/80 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0284C7] dark:text-[#22D3EE]">
                AI-Powered Resume Intelligence
              </p>
              <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] bg-gradient-to-r from-[#0F172A] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent dark:from-white dark:via-[#A5B4FC] dark:to-[#22D3EE] text-balance">
                Your Resume, Ranked by AI
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-[#64748B] dark:text-[#94A3B8]">
                Upload your PDF resume and paste any job description for instant ATS scoring, skill proof, and optimization.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="rounded-2xl border-[1.5px] border-slate-300 bg-[#F8FAFC] px-5 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#0B0F19]/80 dark:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8]">
                  Resumes Analyzed
                </p>
                <p className="mt-1 font-score text-2xl font-bold text-[#0F172A] dark:text-white tabular-nums">
                  {resumesAnalyzedCount}
                </p>
              </div>

              <div className="rounded-2xl border-[1.5px] border-slate-300 bg-[#F8FAFC] px-5 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#0B0F19]/80 dark:shadow-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8]">
                  Avg Score
                </p>
                <p className="mt-1 font-score text-2xl font-bold text-[#6366F1] dark:text-[#22D3EE] tabular-nums">
                  {avgScore !== null ? `${avgScore}%` : '--'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main 2-Column SaaS Grid: Left Input + History (420px) | Right Results (1fr) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr] items-start">
          <div className="no-print space-y-5">
            <InputPanel
              fileName={fileName}
              fileSize={fileSize}
              pageCount={pageCount}
              wordCount={wordCount}
              resumeText={resumeText}
              isExtractingPdf={isExtractingPdf}
              jobRole={jobRole}
              jobDescription={jobDescription}
              isAnalyzing={isAnalyzing}
              errorMessage={errorMessage}
              onSelectPdf={handleSelectPdf}
              onRemoveResume={handleRemoveResume}
              onJobRoleChange={setJobRole}
              onJobDescriptionChange={setJobDescription}
              onAnalyze={handleAnalyze}
            />

            <HistorySidebar
              history={history}
              activeHistoryId={activeHistoryId}
              onSelectHistory={handleSelectHistory}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onClearHistory={handleClearHistory}
            />
          </div>

          <div className="min-w-0 print-full-width">
            <ResultsDashboard
              result={analysisResult}
              isAnalyzing={isAnalyzing}
              fileName={activeFileNameForResult ?? fileName}
              jobRole={activeJobRoleForResult}
              onReset={handleReset}
            />
          </div>
        </div>
      </main>

      <footer className="no-print border-t-[1.5px] border-slate-300 bg-white/80 py-6 text-center text-xs font-medium text-[#64748B] dark:border-slate-700 dark:bg-transparent dark:text-[#94A3B8]">
        <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
          Powered by Groq AI - No API Key Required
        </div>
      </footer>
    </div>
  );
}
