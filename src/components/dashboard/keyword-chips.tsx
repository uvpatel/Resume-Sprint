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
    <div className="space-y-4">
      {/* Matched Keywords */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Supported by Resume Evidence ({matchedKeywords.length})</span>
        </div>
        {matchedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700"
              >
                <span>✓</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] italic">No direct keyword matches found.</p>
        )}
      </div>

      {/* Missing / Needs Confirmation */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span>Needs Clarification ({missingKeywords.length})</span>
        </div>
        {missingKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {missingKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700"
              >
                <span>?</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] italic">No unconfirmed skills identified.</p>
        )}
      </div>

      {/* Unsupported Gaps */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#626262] mb-2">
          <MinusCircle className="h-3.5 w-3.5 text-[#9CA3AF]" />
          <span>Unsupported Gaps — Excluded from Rewrites ({unsupportedKeywords.length})</span>
        </div>
        {unsupportedKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {unsupportedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 rounded-md bg-[#F8FAFC] border border-[#E8E8E8] px-2 py-0.5 text-xs font-medium text-[#626262]"
              >
                <span>✕</span>
                <span>{kw}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF] italic">No unsupported gaps found.</p>
        )}
      </div>
    </div>
  );
}
