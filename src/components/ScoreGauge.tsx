import { useEffect, useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { VerdictLabel } from '../types/analysis';

interface ScoreGaugeProps {
  score: number;
  verdict: VerdictLabel;
}

export function ScoreGauge({ score, verdict }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const gradientId = useId();
  const glowId = useId();

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayScore(score);
      return;
    }

    let frameId = 0;
    const duration = 950;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    setDisplayScore(0);
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const isHigh = score >= 80;
  const isModerate = score >= 60 && score < 80;

  const verdictStyle = isHigh
    ? 'border-[#10B981]/35 bg-[#10B981]/15 text-[#10B981]'
    : isModerate
    ? 'border-[#F59E0B]/35 bg-[#F59E0B]/15 text-[#F59E0B]'
    : 'border-[#F43F5E]/35 bg-[#F43F5E]/15 text-[#F43F5E]';

  const ambientGlow = isHigh
    ? 'shadow-[0_0_48px_rgba(16,185,129,0.22)]'
    : isModerate
    ? 'shadow-[0_0_48px_rgba(99,102,241,0.25)]'
    : 'shadow-[0_0_48px_rgba(244,63,94,0.22)]';

  const VerdictIcon = isHigh ? CheckCircle2 : isModerate ? AlertTriangle : XCircle;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-[180px] w-[180px] items-center justify-center rounded-full bg-slate-100/70 dark:bg-[#0B0F19]/80 ${ambientGlow}`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 overflow-visible"
          role="img"
          aria-label={`Overall resume match score ${score} out of 100`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="55%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#22D3EE" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-[#1E293B]"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#${glowId})`}
            className="transition-[stroke-dashoffset] duration-75"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-[#94A3B8]">
            Match Score
          </span>
          <span className="mt-1 font-score text-[48px] font-bold leading-none text-slate-900 dark:text-white print-text-dark">
            {displayScore}
          </span>
          <span className="mt-1 text-xs font-medium text-slate-500 dark:text-[#94A3B8] tabular-nums">
            out of 100
          </span>
        </div>
      </div>

      <div
        className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${verdictStyle}`}
      >
        <VerdictIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{verdict}</span>
      </div>
    </div>
  );
}
