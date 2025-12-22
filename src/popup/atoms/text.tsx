import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = {
  children: React.ReactNode;
  size?: "sm" | "md";
  tone?: "muted" | "primary" | "error";
  className?: string;
};

export function Text(props: Props) {
  const sizeClass = props.size === "sm" ? "text-sm" : "text-base";

  const toneClass =
    props.tone === "primary"
      ? "text-primary"
      : props.tone === "error"
      ? "text-error"
      : "text-muted";

  return (
    <p className={cn("mt-4", sizeClass, toneClass, props.className)}>
      {props.children}
    </p>
  );
}
