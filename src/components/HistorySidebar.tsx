import { BarChart3, Clock, FileText, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../types/analysis';

interface HistorySidebarProps {
  history: HistoryEntry[];
  activeHistoryId: string | null;
  onSelectHistory: (entry: HistoryEntry) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

function getScoreBarGradient(score: number): string {
  if (score >= 80) return 'bg-gradient-to-t from-[#10B981] to-[#22D3EE]';
  if (score >= 60) return 'bg-gradient-to-t from-[#F59E0B] to-[#FBBF24]';
  return 'bg-gradient-to-t from-[#F43F5E] to-[#FB7185]';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-[#10B981]';
  if (score >= 60) return 'text-[#F59E0B]';
  return 'text-[#F43F5E]';
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function HistorySidebar({
  history,
  activeHistoryId,
  onSelectHistory,
  onDeleteHistoryItem,
  onClearHistory,
}: HistorySidebarProps) {
  const orderedForChart = [...history].reverse();

  return (
    <aside
      id="history"
      aria-label="Analysis history and score trends"
      className="no-print space-y-5"
    >
      {/* Recent Analyses Card */}
      <section className="rounded-[20px] border border-slate-200 bg-white/90 p-6 backdrop-blur-xl shadow-sm dark:border-[#1E293B] dark:bg-[#111827]/85 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
              Recent Analyses
            </h2>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-[#F43F5E] dark:text-[#94A3B8] dark:hover:text-[#F43F5E] transition-colors cursor-pointer"
              title="Clear saved history"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-[#94A3B8]">
            Your last 3 evaluations are saved locally so you can switch and compare scores anytime.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((entry) => {
              const isActive = entry.id === activeHistoryId;
              return (
                <li key={entry.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelectHistory(entry)}
                    className={`w-full rounded-xl border p-3.5 pr-9 text-left transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                      isActive
                        ? 'border-[#6366F1]/70 bg-[#6366F1]/10 shadow-[0_0_20px_rgba(99,102,241,0.16)]'
                        : 'border-slate-200 bg-slate-50/70 hover:border-[#6366F1]/40 dark:border-[#1E293B] dark:bg-[#0B0F19]/60 dark:hover:border-[#6366F1]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-[#22D3EE]"
                          aria-hidden="true"
                        />
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {entry.fileName}
                        </span>
                      </div>
                      <span
                        className={`font-score text-base font-bold shrink-0 ${getScoreTextColor(
                          entry.overallScore
                        )}`}
                      >
                        {entry.overallScore}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-[#94A3B8]">
                      <span className="truncate">{entry.jobRole}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0 tabular-nums">{formatShortDate(entry.timestamp)}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(entry.id);
                    }}
                    aria-label={`Remove ${entry.fileName} from history`}
                    className="absolute right-2.5 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:bg-[#1E293B] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Score History Chart Card */}
      <section className="rounded-[20px] border border-slate-200 bg-white/90 p-6 backdrop-blur-xl shadow-sm dark:border-[#1E293B] dark:bg-[#111827]/85 dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22D3EE]/15 text-[#0284C7] dark:text-[#22D3EE]">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
              Score History
            </h2>
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-[#94A3B8] tabular-nums">
            Last {orderedForChart.length}
          </span>
        </div>

        {orderedForChart.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center">
            <p className="text-sm text-slate-500 dark:text-[#94A3B8]">
              Score trend bars appear here after your first analysis.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="relative flex h-36 items-end justify-around gap-4 border-b border-slate-200 pb-2 dark:border-[#1E293B]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-[80%] border-t border-dashed border-slate-300/70 dark:border-[#1E293B]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-[60%] border-t border-dashed border-slate-300/70 dark:border-[#1E293B]"
              />

              {orderedForChart.map((entry, idx) => {
                const heightPct = Math.max(14, entry.overallScore);
                const isActive = entry.id === activeHistoryId;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectHistory(entry)}
                    title={`${entry.fileName} (${entry.jobRole}): ${entry.overallScore}/100`}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] rounded"
                  >
                    <span className="font-score text-xs font-bold text-slate-800 dark:text-white tabular-nums">
                      {entry.overallScore}
                    </span>
                    <div className="flex w-full max-w-[38px] flex-1 items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${getScoreBarGradient(
                          entry.overallScore
                        )} ${
                          isActive
                            ? 'ring-2 ring-[#22D3EE] ring-offset-2 ring-offset-white dark:ring-offset-[#111827]'
                            : 'opacity-85 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-[#94A3B8]">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}
