import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/popup/utils/cn.ts";

const titleVariants = cva("font-light tracking-wide text-primary", {
  variants: {
    size: {
      default: "text-lg",
      sm: "text-base",
      lg: "text-xl",
      xl: "text-2xl",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface TitleProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof titleVariants> {}

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        className={cn(titleVariants({ size, className }))}
        {...props}
      />
    );
  }
);
Title.displayName = "Title";

export { Title, titleVariants };
