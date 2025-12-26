import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/popup/utils/cn.ts";

const textVariants = cva("mt-4", {
  variants: {
    size: {
      default: "text-base",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
    tone: {
      default: "text-muted-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      error: "text-destructive",
      normal: "text-foreground",
    },
  },
  defaultVariants: {
    size: "default",
    tone: "default",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size, tone, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(textVariants({ size, tone, className }))}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants };
