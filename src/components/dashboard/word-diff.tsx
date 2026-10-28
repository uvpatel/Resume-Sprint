import { computeWordDiff } from "@/lib/engine/scoring";

interface WordDiffProps {
  before: string;
  after: string;
}

export function WordDiff({ before, after }: WordDiffProps) {
  const tokens = computeWordDiff(before, after);

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 text-xs leading-relaxed font-sans select-text">
      {tokens.map((token, idx) => {
        if (token.type === "same") {
          return <span key={idx} className="text-zinc-700">{token.text}</span>;
        }
        if (token.type === "remove") {
          return (
            <del
              key={idx}
              className="bg-red-100 text-red-800 line-through decoration-red-400 px-0.5 rounded-xs"
            >
              {token.text}
            </del>
          );
        }
        if (token.type === "add") {
          return (
            <ins
              key={idx}
              className="bg-emerald-100 text-emerald-800 no-underline font-medium px-0.5 rounded-xs"
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
