import * as React from "react";
import { cn } from "@/popup/utils/cn.ts";
import { IconDots } from "@tabler/icons-react";

export type PickerItemProps = {
  isSelected?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  onActionClick?: (e: React.MouseEvent) => void;
  actionOpen?: boolean;
  actionContent?: React.ReactNode;
  editing?: boolean;
  editingContent?: React.ReactNode;
  className?: string;
};

export function PickerItem({
  isSelected,
  icon,
  title,
  subtitle,
  onClick,
  onActionClick,
  actionOpen,
  actionContent,
  editing,
  editingContent,
  className,
}: PickerItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground",
        className,
      )}
    >
      {editing
        ? (
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              {icon}
              <div className="min-w-0 flex-1">{editingContent}</div>
            </div>
          </div>
        )
        : (
          <button
            type="button"
            onClick={onClick}
            className="flex-1 text-left outline-none min-w-0"
          >
            <div className="flex items-center gap-2">
              <div className="shrink-0">{icon}</div>
              <div className="min-w-0">
                <div className="min-w-0 text-xs truncate font-medium">
                  {title}
                </div>
                {subtitle && (
                  <div className="text-[9px] leading-tight truncate opacity-80">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          </button>
        )}

      {!editing && onActionClick && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              aria-label="Item menu"
              onClick={onActionClick}
              className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-background/50 text-muted-foreground"
            >
              <IconDots className="h-4 w-4" />
            </button>

            {actionOpen && actionContent && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-md border border-border bg-popover p-1 shadow-md">
                {actionContent}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
