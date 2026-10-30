import { CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";

interface KeywordChipsProps {
  matchedKeywords: string[];
  missingKeywords: string[];
  unsupportedKeywords: string[];
}

export function KeywordChips({
  matchedKeywords,
  missingKeywords,
  unsupportedKeywords,
}: KeywordChipsProps) {
  return (
    <div className="space-y-5">
      {/* Matched Keywords */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Supported by Resume Evidence ({matchedKeywords.length})</span>
        </div>
        {matchedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 font-mono"
              >
                <span>✓</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">No direct keyword matches found.</p>
        )}
      </div>

      {/* Missing / Needs Confirmation */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>Needs Clarification / Evidence ({missingKeywords.length})</span>
        </div>
        {missingKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400 font-mono"
              >
                <span>?</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">No unconfirmed skills identified.</p>
        )}
      </div>

      {/* Unsupported Gaps */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2.5">
          <MinusCircle className="h-3.5 w-3.5 text-zinc-500" />
          <span>Unsupported Gaps — Excluded from Rewrites ({unsupportedKeywords.length})</span>
        </div>
        {unsupportedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unsupportedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-1 text-xs font-medium text-zinc-400 font-mono"
              >
                <span>✕</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">No unsupported gaps recorded.</p>
        )}
      </div>
    </div>
  );
}
