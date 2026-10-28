import { computeWordDiff } from "@/lib/engine/scoring";

interface WordDiffProps {
  before: string;
  after: string;
}

export function WordDiff({ before, after }: WordDiffProps) {
  const tokens = computeWordDiff(before, after);

  return (
    <div className="rounded-lg border border-[#E8E8E8] bg-[#F8FAFC] p-3.5 text-xs leading-relaxed font-sans select-text">
      {tokens.map((token, idx) => {
        if (token.type === "same") {
          return <span key={idx} className="text-[#252525]">{token.text}</span>;
        }
        if (token.type === "remove") {
          return (
            <del
              key={idx}
              className="bg-rose-50 text-rose-700 line-through decoration-rose-400 px-1 py-0.5 rounded"
            >
              {token.text}
            </del>
          );
        }
        if (token.type === "add") {
          return (
            <ins
              key={idx}
              className="bg-emerald-50 text-emerald-700 no-underline font-semibold px-1 py-0.5 rounded border border-emerald-200/60"
            >
              {token.text}
            </ins>
          );
        }
        return null;
      })}
    </div>
  );
}
