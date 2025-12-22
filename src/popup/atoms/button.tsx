import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  uiSize?: "sm" | "md";
};

export function Button(props: Props) {
  const { className, type, disabled, uiSize, ...rest } = props;

  const sizeClass =
    uiSize === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";

  return (
    <button
      {...rest}
      type={type ?? "button"}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-primary text-primary",
        sizeClass,
        "disabled:opacity-50",
        className
      )}
    />
  );
}
