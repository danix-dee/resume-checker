import { useRef, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  FileText,
  FileUp,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { JOB_ROLES, type JobRole } from '../types/analysis';
import { formatFileSize } from '../utils/pdfExtractor';

interface InputPanelProps {
  fileName: string | null;
  fileSize: number | null;
  pageCount: number | null;
  wordCount: number | null;
  resumeText: string;
  isExtractingPdf: boolean;
  jobRole: JobRole;
  jobDescription: string;
  isAnalyzing: boolean;
  errorMessage: string | null;
  onSelectPdf: (file: File) => void;
  onRemoveResume: () => void;
  onJobRoleChange: (role: JobRole) => void;
  onJobDescriptionChange: (text: string) => void;
  onAnalyze: () => void;
}

export function InputPanel({
  fileName,
  fileSize,
  pageCount,
  wordCount,
  resumeText,
  isExtractingPdf,
  jobRole,
  jobDescription,
  isAnalyzing,
  errorMessage,
  onSelectPdf,
  onRemoveResume,
  onJobRoleChange,
  onJobDescriptionChange,
  onAnalyze,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  const hasResume = Boolean(resumeText.trim().length > 0 && fileName);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectPdf(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSelectPdf(file);
    }
  };

  return (
    <section
      id="workspace"
      aria-label="Resume and job description input"
      className="no-print rounded-[20px] border-[1.5px] border-slate-300 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:border-slate-700 dark:bg-[#111827]/85 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="space-y-4">
        {/* 1. Resume PDF Upload */}
        <div>
          <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b-[1.5px] border-[#CBD5E1] dark:border-slate-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white">
              Resume Upload
            </h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileInput}
            className="sr-only"
            aria-label="Upload resume PDF file"
          />

          {!hasResume ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                isDragging
                  ? 'border-[#6366F1] bg-[#6366F1]/10 shadow-[0_0_24px_rgba(99,102,241,0.2)]'
                  : 'border-[#64748B] bg-[#F8FAFC] hover:border-[#6366F1] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#0B0F19]/60 dark:hover:border-[#6366F1]/70 dark:hover:bg-[#1E293B]/40'
              }`}
            >
              {isExtractingPdf ? (
                <>
                  <Loader2
                    className="h-9 w-9 animate-spin text-[#6366F1]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-[15px] font-semibold text-[#0F172A] dark:text-white">
                    Extracting text from PDF...
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 text-[#6366F1] dark:text-[#22D3EE]">
                    <FileUp className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-3.5 text-[15px] font-medium text-[#0F172A] dark:text-white">
                    Drop resume PDF or{' '}
                    <span className="text-[#6366F1] dark:text-[#22D3EE] underline underline-offset-4">
                      browse
                    </span>
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8]">
                    PDF Only · Max 5 MB · Browser Parsed
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border-[1.5px] border-[#10B981]/60 bg-[#10B981]/10 p-4 dark:border-[#10B981]/35 dark:bg-[#10B981]/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10B981]/20 text-[#059669] dark:text-[#10B981]">
                    <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#0F172A] dark:text-white">
                      {fileName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#334155] dark:text-[#94A3B8] tabular-nums">
                      <span>{fileSize ? formatFileSize(fileSize) : 'PDF'}</span>
                      {pageCount !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            {pageCount} {pageCount === 1 ? 'pg' : 'pgs'}
                          </span>
                        </>
                      )}
                      {wordCount !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{wordCount} words</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRemoveResume}
                  disabled={isAnalyzing}
                  aria-label="Remove uploaded resume"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-400 bg-white px-3 text-xs font-semibold text-[#334155] hover:border-[#F43F5E] hover:text-[#F43F5E] disabled:opacity-50 dark:border-slate-700 dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:text-[#F43F5E] transition-all duration-300 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t-[1.5px] border-[#10B981]/30">
                <button
                  type="button"
                  onClick={() => setShowExtractedPreview((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#059669] hover:text-[#047857] dark:text-[#22D3EE] dark:hover:text-white cursor-pointer transition-colors"
                >
                  {showExtractedPreview ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{showExtractedPreview ? 'Hide extracted text' : 'Inspect extracted text'}</span>
                </button>

                {showExtractedPreview && (
                  <pre className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl border-[1.5px] border-slate-300 bg-white p-3.5 text-xs leading-relaxed text-[#334155] dark:border-slate-700 dark:bg-[#0B0F19] dark:text-[#CBD5E1]">
                    {resumeText}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Target Job Role */}
        <div className="pt-2">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
            </span>
            <label
              htmlFor="job-role-select"
              className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white"
            >
              Target Role
            </label>
          </div>

          <div className="relative">
            <select
              id="job-role-select"
              value={jobRole}
              onChange={(e) => onJobRoleChange(e.target.value as JobRole)}
              disabled={isAnalyzing}
              className="h-[52px] w-full appearance-none rounded-xl border-[1.5px] border-slate-400 bg-white px-4 pr-10 text-[15px] font-medium text-[#0F172A] focus:border-2 focus:border-[#6366F1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.22)] disabled:opacity-60 dark:border-slate-700 dark:bg-[#1E293B] dark:text-white dark:focus:border-[#6366F1] transition-all duration-300"
            >
              {JOB_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* 3. Job Description */}
        <div className="pt-2">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22D3EE]/15 text-[#0284C7] dark:text-[#22D3EE]">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <label
              htmlFor="job-description-input"
              className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white"
            >
              Job Description
            </label>
          </div>

          <textarea
            id="job-description-input"
            rows={8}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Paste Job Description here..."
            className="w-full rounded-xl border-[1.5px] border-slate-400 bg-white p-4 text-[15px] leading-[1.6] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-2 focus:border-[#6366F1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.22)] disabled:opacity-60 dark:border-slate-700 dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#6366F1] transition-all duration-300"
          />

          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8] tabular-nums">
            <span>Requirements &amp; qualifications</span>
            <span>{jobDescription.length.toLocaleString()} chars</span>
          </div>
        </div>

        {/* Validation / API Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border-[1.5px] border-[#F43F5E]/60 bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-[#BE123C] dark:border-[#F43F5E]/40 dark:text-[#FDA4AF]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#F43F5E]" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Analyze CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isAnalyzing || isExtractingPdf}
            className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 text-[15px] font-semibold text-white shadow-[0_8px_28px_rgba(99,102,241,0.38)] hover:scale-[1.02] hover:shadow-[0_10px_34px_rgba(139,92,246,0.45)] disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-70 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
                <span>Calling Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
                <span>Analyze with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
