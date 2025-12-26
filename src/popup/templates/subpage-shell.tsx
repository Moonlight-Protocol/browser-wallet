import React from "react";
import { Shell } from "@/popup/templates/shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { IconArrowLeft } from "@tabler/icons-react";

type Props = {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
};

export function SubpageShell(props: Props) {
  return (
    <Shell>
      <header className="h-12 flex items-center justify-between">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Back"
          onClick={props.onBack}
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>

        <div className={cn("text-sm font-medium text-primary", "truncate")}>
          {props.title}
        </div>

        <div className="w-8" />
      </header>

      <div className="mt-3">{props.children}</div>
    </Shell>
  );
}
