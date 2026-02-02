import * as React from "react";
import { cn } from "@/popup/utils/cn.ts";
import { Spinner } from "@/popup/atoms/spinner.tsx";

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  uiSize?: "sm" | "md";
}

export function LoadingSpinner({
  className,
  message,
  uiSize = "md",
  ...props
}: LoadingSpinnerProps) {
  const sizeClass = uiSize === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div
      className={cn("flex flex-col items-center justify-center", className)}
      {...props}
    >
      <Spinner className={cn("text-primary", sizeClass)} />
      {message
        ? (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {message}
          </div>
        )
        : null}
    </div>
  );
}
