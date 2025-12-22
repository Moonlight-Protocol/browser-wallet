import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  uiSize?: "sm" | "md";
};

export function Input(props: Props) {
  const { className, uiSize, ...rest } = props;

  const sizeClass = uiSize === "sm" ? "px-2 py-1 text-sm" : "px-3 py-2";

  return (
    <input
      {...rest}
      className={cn(
        "w-full rounded-md border border-muted bg-background text-primary",
        sizeClass,
        "placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
        className
      )}
    />
  );
}
