import { computeWordDiff } from "@/lib/engine/scoring";

interface WordDiffProps {
  before: string;
  after: string;
}

export function WordDiff({ before, after }: WordDiffProps) {
  const tokens = computeWordDiff(before, after);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs leading-relaxed font-sans select-text">
      {tokens.map((token, idx) => {
        if (token.type === "same") {
          return <span key={idx} className="text-zinc-300">{token.text}</span>;
        }
        if (token.type === "remove") {
          return (
            <del
              key={idx}
              className="bg-rose-500/15 text-rose-300 line-through decoration-rose-400 px-1 py-0.5 rounded border border-rose-500/30 mx-0.5"
            >
              {token.text}
            </del>
          );
        }
        if (token.type === "add") {
          return (
            <ins
              key={idx}
              className="bg-emerald-500/15 text-emerald-300 no-underline font-semibold px-1 py-0.5 rounded border border-emerald-500/30 mx-0.5"
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
