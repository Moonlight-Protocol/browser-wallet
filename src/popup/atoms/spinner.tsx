import { IconLoader, IconLoaderQuarter } from "@tabler/icons-react";
import { cn } from "@/popup/utils/cn.ts";
import type { ComponentProps } from "react";

export function Spinner({
  className,
  ...props
}: ComponentProps<typeof IconLoader>) {
  return (
    <div className={cn("relative inline-block", className)}>
      <IconLoader className="h-full w-full opacity-20" {...props} />
      <IconLoaderQuarter
        className="absolute inset-0 h-full w-full animate-spin"
        {...props}
      />
    </div>
  );
}
