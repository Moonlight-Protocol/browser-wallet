import React from "react";
import { cn } from "@/popup/utils/cn.ts";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  uiSize?: "sm" | "md";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  contentAlign?: "start" | "center" | "end";
};

export function Button(props: Props) {
  const {
    className,
    type,
    disabled,
    uiSize,
    icon,
    iconPosition,
    iconOnly,
    contentAlign,
    children,
    ...rest
  } = props;

  const sizeClass = (() => {
    if (iconOnly) {
      return uiSize === "sm" ? "p-1.5" : "p-2";
    }
    return uiSize === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  })();

  const justifyClass = (() => {
    switch (contentAlign) {
      case "start":
        return "justify-start";
      case "end":
        return "justify-end";
      case "center":
      default:
        return "justify-center";
    }
  })();

  const iconPos = iconPosition ?? "left";
  const showIcon = Boolean(icon);
  const showText = !iconOnly && Boolean(children);

  return (
    <button
      {...rest}
      type={type ?? "button"}
      disabled={disabled}
      className={cn(
        "inline-flex items-center rounded-md border border-primary text-primary",
        justifyClass,
        sizeClass,
        showIcon && showText ? "gap-2" : undefined,
        "disabled:opacity-50",
        className
      )}
    >
      {showIcon && iconPos === "left" ? (
        <span className="shrink-0">{icon}</span>
      ) : null}

      {showText ? <span className="min-w-0 truncate">{children}</span> : null}

      {showIcon && iconPos === "right" ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
    </button>
  );
}
