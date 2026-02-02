import { cn } from "@/popup/utils/cn.ts";

export function MnemonicWords(props: { words: string[] }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {props.words.map((word, idx) => (
        <div key={`${idx}-${word}`} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-right text-xs text-muted">
            {idx + 1}
          </span>
          <div
            className={cn(
              "flex-1 rounded-md border border-muted",
              "bg-background px-2 py-1",
            )}
          >
            <span className="text-sm text-primary">{word}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
