import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return (
    <div
      className={cn(
        "w-full h-full p-5 flex flex-col overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
