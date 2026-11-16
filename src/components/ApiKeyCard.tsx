import { forwardRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Trash2,
  XCircle,
} from 'lucide-react';
import { testGeminiApiKey } from '../utils/geminiClient';

interface ApiKeyCardProps {
  apiKeyInput: string;
  savedApiKey: string;
  highlightError: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onApiKeyInputChange: (val: string) => void;
  onSaveKey: () => void;
  onClearKey: () => void;
}

export const ApiKeyCard = forwardRef<HTMLElement, ApiKeyCardProps>(function ApiKeyCard(
  {
    apiKeyInput,
    savedApiKey,
    highlightError,
    inputRef,
    onApiKeyInputChange,
    onSaveKey,
    onClearKey,
  },
  ref
) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'valid' | 'invalid';
    message: string;
  } | null>(null);

  const isConnected = savedApiKey.trim().length > 0;

  const handleTestConnection = async () => {
    const keyToTest = apiKeyInput.trim() || savedApiKey.trim();
    if (!keyToTest) {
      setTestResult({
        status: 'invalid',
        message: 'Key is Invalid ✗ — Please enter a Gemini API Key first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      await testGeminiApiKey(keyToTest);
      setTestResult({
        status: 'valid',
        message: 'Key is Valid ✓',
      });
    } catch (err) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Invalid API Key. Please check your key from Google AI Studio and try again.';
      setTestResult({
        status: 'invalid',
        message: `Key is Invalid ✗ — ${errMsg}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section
      ref={ref}
      id="api-key-section"
      aria-label="Gemini API Key Configuration"
      className={`no-print mb-6 rounded-[20px] border-[1.5px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 dark:bg-[#111827]/90 dark:backdrop-blur-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] ${
        highlightError
          ? 'border-[#F43F5E] ring-2 ring-[#F43F5E]/40 shadow-[0_0_28px_rgba(244,63,94,0.25)]'
          : 'border-slate-400 dark:border-slate-700'
      }`}
    >
      {/* Top Row: Lock icon + Title/Subtitle + Live Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 text-[#6366F1] dark:text-[#22D3EE]">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#0F172A] dark:text-white">
              Gemini API Key
            </h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Required to run AI Analysis
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
            isConnected
              ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#059669] dark:border-[#10B981]/35 dark:text-[#10B981]'
              : 'border-[#F43F5E]/50 bg-[#F43F5E]/10 text-[#E11D48] dark:border-[#F43F5E]/35 dark:text-[#F43F5E]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                : 'bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.8)]'
            }`}
          />
          <span>{isConnected ? 'API Key Connected' : 'No API Key'}</span>
        </div>
      </div>

      {/* Input + Action Buttons Row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <KeyRound
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="gemini-api-key-input"
            type={showKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => {
              onApiKeyInputChange(e.target.value);
              setTestResult(null);
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your Gemini API Key here - AIza..."
            className="h-[52px] w-full rounded-xl border-[1.5px] border-slate-400 bg-white pl-11 pr-12 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-2 focus:border-[#6366F1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.22)] dark:border-slate-700 dark:bg-[#1E293B] dark:text-white dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#6366F1] transition-all duration-300"
          />
          <button
            type="button"
            onClick={() => setShowKey((prev) => !prev)}
            aria-label={showKey ? 'Hide API Key' : 'Show API Key'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#0B0F19] dark:hover:text-white transition-colors cursor-pointer"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTestResult(null);
              onSaveKey();
            }}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 text-[15px] font-semibold text-white shadow-[0_6px_22px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            Save Key
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0284C7] bg-[#22D3EE]/10 px-5 text-[15px] font-semibold text-[#0284C7] hover:scale-[1.02] hover:bg-[#22D3EE]/20 disabled:opacity-60 dark:border-[#22D3EE]/40 dark:text-[#22D3EE] transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
          >
            {isTesting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTestResult(null);
              onClearKey();
            }}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-400 bg-white px-5 text-[15px] font-semibold text-[#334155] hover:scale-[1.02] hover:border-[#F43F5E] hover:text-[#F43F5E] dark:border-slate-700 dark:bg-[#1E293B] dark:text-[#CBD5E1] dark:hover:text-[#F43F5E] transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Clear Key</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Google AI Studio Link + Test Connection Result */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0284C7] hover:underline underline-offset-4 dark:text-[#22D3EE]"
        >
          <span>Don&apos;t have a key? Get Free Key from Google AI Studio -&gt;</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>

        {testResult && (
          <div
            role="status"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              testResult.status === 'valid'
                ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#059669] dark:border-[#10B981]/35 dark:text-[#10B981]'
                : 'border-[#F43F5E]/50 bg-[#F43F5E]/10 text-[#E11D48] dark:border-[#F43F5E]/35 dark:text-[#F43F5E]'
            }`}
          >
            {testResult.status === 'valid' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </section>
  );
});
