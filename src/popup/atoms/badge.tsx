import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Badge(props: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-muted",
        "px-1 py-0",
        "text-[9px] leading-none text-muted",
        props.className
      )}
    >
      {props.children}
    </span>
  );
}
