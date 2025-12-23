import React from "react";
import { cn } from "@/popup/utils/cn.ts";

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
          className="absolute inset-0"
        />
      </div>

      <div
        className={cn(
          "absolute left-0 top-12 z-50 w-full rounded-md border border-primary bg-background p-2",
          props.panelClassName,
        )}
      >
        {props.children}
      </div>
    </>
  );
}
