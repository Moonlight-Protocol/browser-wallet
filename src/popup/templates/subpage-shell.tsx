import React from "react";
import { Shell } from "@/popup/templates/shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { BackIcon } from "@/popup/icons/index.tsx";

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
          uiSize="sm"
          iconOnly
          icon={<BackIcon className="h-5 w-5" />}
          aria-label="Back"
          onClick={props.onBack}
        />

        <div className={cn("text-sm font-medium text-primary", "truncate")}>
          {props.title}
        </div>

        <div className="w-8" />
      </header>

      <div className="mt-3">{props.children}</div>
    </Shell>
  );
}
