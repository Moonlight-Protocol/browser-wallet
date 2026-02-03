import { cn } from "@/popup/utils/cn.ts";
import { ChevronDownIcon } from "@/popup/icons/index.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/popup/atoms/tooltip.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/popup/atoms/dropdown-menu.tsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/popup/atoms/sheet.tsx";
import { SidebarTrigger } from "@/popup/atoms/sidebar.tsx";
import { IconShieldLock, IconWorld } from "@tabler/icons-react";
import type { ReactNode } from "react";

export type HomeHeaderProps = {
  selectedNetworkLabel: string;
  viewMode: "public" | "private";
  onToggleViewMode: () => void | Promise<void>;
  viewModeToggleDisabled?: boolean;

  accountPickerOpen: boolean;
  onToggleAccountPicker: (open: boolean) => void;
  accountPicker: ReactNode;

  headerKeyName?: string;
  headerAddressShort: string;

  // Private mode connection status
  channelName?: string;
  isConnected?: boolean;
  onToggleChannelPicker?: (open: boolean) => void;
  channelPickerOpen?: boolean;
  channelPicker?: ReactNode;
};

export function HomeHeader(props: HomeHeaderProps) {
  return (
    <>
      <header
        className={cn(
          "relative z-50 transition-all duration-300 ease-in-out",
          props.viewMode === "private" ? "pb-2" : "",
        )}
      >
        {/* Main header row */}
        <div className="flex items-center justify-between w-full h-12">
          {/* Left: Menu */}
          <SidebarTrigger className="h-8 w-8 flex items-center justify-center rounded-full text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 transition-colors" />

          {/* Center: Account selector */}
          <DropdownMenu
            open={props.accountPickerOpen}
            onOpenChange={props.onToggleAccountPicker}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Select account"
                className="group inline-flex items-center gap-1.5 outline-none cursor-pointer"
              >
                <div className="flex flex-col items-center min-w-0">
                  <span className="text-sm font-extrabold text-gradient-moonlight truncate max-w-[150px]">
                    {props.headerKeyName || props.headerAddressShort}
                  </span>
                  {props.headerKeyName && (
                    <span className="text-[10px] text-foreground/40 font-medium truncate max-w-[150px]">
                      {props.headerAddressShort}
                    </span>
                  )}
                </div>
                <ChevronDownIcon className="h-3.5 w-3.5 text-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-70 max-h-100 overflow-y-auto">
              {props.accountPicker}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={props.viewModeToggleDisabled}
                  onClick={() => props.onToggleViewMode()}
                  className={cn(
                    "h-8 w-8 inline-flex items-center justify-center rounded-full transition-all duration-200 shrink-0 cursor-pointer",
                    props.viewMode === "private"
                      ? "text-secondary bg-secondary/10 hover:bg-secondary/20"
                      : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5",
                  )}
                >
                  {props.viewMode === "private"
                    ? <IconShieldLock className="h-4 w-4" />
                    : <IconWorld className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                <div className="text-xs">
                  <div className="font-medium">
                    {props.viewMode === "public"
                      ? "Switch to Private"
                      : "Switch to Public"}
                  </div>
                  <div className="mt-0.5 text-muted-foreground text-[10px]">
                    {props.selectedNetworkLabel}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Private mode */}
        {props.viewMode === "private" && (
          <div className="flex items-center justify-center w-full animate-in fade-in duration-200 mt-1">
            <Sheet
              open={props.channelPickerOpen}
              onOpenChange={props.onToggleChannelPicker}
            >
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors hover:bg-secondary/10"
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      props.isConnected ? "bg-green-400" : "bg-red-400",
                    )}
                  />
                  <span className="text-xs font-semibold text-secondary">
                    {props.channelName || "No Channel"}
                  </span>
                  <ChevronDownIcon className="h-3 w-3 text-secondary/50" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] flex flex-col">
                <SheetHeader>
                  <SheetTitle>Private Channels</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {props.channelPicker}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Decorative separator */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="flex items-center gap-1.5">
            <div
              className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: "oklch(0.75 0.18 45 / 0.6)" }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.55 0.20 300) 100%)",
                boxShadow: "0 0 8px oklch(0.75 0.18 45 / 0.4)",
              }}
            />
            <div
              className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: "oklch(0.55 0.20 300 / 0.6)" }}
            />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
        </div>
      </header>
    </>
  );
}
