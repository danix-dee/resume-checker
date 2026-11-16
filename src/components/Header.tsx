import { Moon, RotateCcw, Sun } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNewAnalysis: () => void;
  onJumpToApiKey: () => void;
}

export function Header({
  hasApiKey,
  isDarkMode,
  onToggleTheme,
  onNewAnalysis,
  onJumpToApiKey,
}: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-40 h-[72px] border-b-[1.5px] border-slate-300 bg-white/95 backdrop-blur-xl dark:border-slate-700 dark:bg-[#0B0F19]/80">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 lg:px-8">
        {/* Left: Brand Mark + Wordmark */}
        <a
          href="#workspace"
          className="flex items-center gap-3 whitespace-nowrap shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white">
            ResumeRank <span className="text-[#0284C7] dark:text-[#22D3EE]">AI</span>
          </span>
        </a>

        {/* Right: Real API Key Status + Dark Mode Toggle + Reset */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onJumpToApiKey}
            className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
              hasApiKey
                ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#059669] dark:border-[#10B981]/35 dark:text-[#10B981]'
                : 'border-[#F43F5E]/50 bg-[#F43F5E]/10 text-[#E11D48] dark:border-[#F43F5E]/35 dark:text-[#F43F5E]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                hasApiKey
                  ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.75)]'
                  : 'bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.75)]'
              }`}
            />
            <span>{hasApiKey ? 'API Key Connected' : 'No API Key'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-400 bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#111827] dark:text-[#CBD5E1] dark:hover:border-[#6366F1]/50 dark:hover:text-white transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-[#6366F1]" aria-hidden="true" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNewAnalysis}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-400 bg-white px-4 text-xs font-semibold text-[#0F172A] hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1E293B]/80 dark:text-white dark:hover:bg-[#1E293B] transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#0284C7] dark:text-[#22D3EE]" aria-hidden="true" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>
    </header>
  );
}
