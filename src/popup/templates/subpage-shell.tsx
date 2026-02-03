import React from "react";
import { Shell } from "@/popup/templates/shell.tsx";
import { IconArrowLeft } from "@tabler/icons-react";

type Props = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

export function SubpageShell(props: Props) {
  return (
    <Shell>
      <header className="flex items-center justify-between py-2">
        <button
          type="button"
          aria-label="Back"
          onClick={props.onBack}
          className="h-9 w-9 flex items-center justify-center rounded-xl transition-all duration-200 text-foreground/60 hover:text-foreground hover:bg-foreground/5 cursor-pointer"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>

        <span className="text-sm font-extrabold text-gradient-moonlight truncate">
          {props.title}
        </span>

        <div className="w-9" />
      </header>

      {/* Decorative separator */}
      <div className="mt-2 mb-4 flex items-center justify-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="flex items-center gap-1.5">
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{ background: "oklch(0.75 0.18 45 / 0.6)" }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.55 0.20 300) 100%)",
              boxShadow: "0 0 8px oklch(0.75 0.18 45 / 0.4)",
            }}
          />
          <div
            className="w-1 h-1 rounded-full animate-pulse"
            style={{ background: "oklch(0.55 0.20 300 / 0.6)" }}
          />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
      </div>

      <div className="animate-fade-in-up">{props.children}</div>
    </Shell>
  );
}
