import React from "react";
import { cn } from "@/popup/utils/cn.ts";

export type LoadingSpinnerProps = {
  message?: string;
  uiSize?: "sm" | "md";
  className?: string;
};

export function LoadingSpinner(props: LoadingSpinnerProps) {
  const size = props.uiSize ?? "md";
  const ringClass = size === "sm" ? "h-4 w-4 border-2" : "h-6 w-6 border-2";

  return (
    <div className={cn("flex flex-col items-center justify-center", props.className)}>
      <div
        aria-label="Loading"
        role="status"
        className={cn(
          "rounded-full animate-spin",
          ringClass,
          "border-muted border-t-primary"
        )}
      />
      {props.message ? (
        <div className="mt-2 text-xs text-muted text-center">{props.message}</div>
      ) : null}
    </div>
  );
}
