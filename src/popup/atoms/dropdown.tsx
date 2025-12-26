import * as React from "react";
import { cn } from "@/popup/utils/cn.ts";

// NOTE: This is a custom implementation to match the existing atomic interface
// while using shadcn-like styling. For full shadcn power, we should eventually
// migrate to using Radix UI's Popover or DropdownMenu primitives directly.

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
};

export function Dropdown(props: Props) {
  if (!props.open) return null;

  return (
    <>
      <div className={cn("fixed inset-0 z-40", props.overlayClassName)}>
        <button
          type="button"
          aria-label="Close dropdown"
          onClick={props.onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
      </div>

      <div
        className={cn(
          "absolute left-0 top-12 z-50 w-full rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          props.panelClassName
        )}
      >
        {props.children}
      </div>
    </>
  );
}
