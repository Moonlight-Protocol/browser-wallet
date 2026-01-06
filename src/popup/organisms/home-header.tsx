import { cn } from "@/popup/utils/cn.ts";
import { toDecimals } from "@colibri/core";
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
import {
  IconWorld,
  IconShieldLock,
  IconPlugConnected,
  IconPlugConnectedX,
} from "@tabler/icons-react";
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
  const modeLabel = props.viewMode === "public" ? "Public" : "Private";

  return (
    <>
      <header
        className={cn(
          "flex flex-col justify-center relative z-50 px-3 border-b border-border/50 transition-all duration-300 ease-in-out bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          props.viewMode === "private" ? "h-24 py-2 gap-1" : "h-14"
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="w-[40px] flex items-center justify-start">
            <SidebarTrigger />
          </div>

          <div className="flex-1 flex justify-center min-w-0">
            <DropdownMenu
              open={props.accountPickerOpen}
              onOpenChange={props.onToggleAccountPicker}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Select account"
                  className="inline-flex flex-col items-center justify-center gap-0 group outline-none min-w-0"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-bold text-primary truncate max-w-[120px]">
                      {props.headerKeyName || props.headerAddressShort}
                    </span>
                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                  {props.headerKeyName && (
                    <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">
                      {props.headerAddressShort}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-70 max-h-100 overflow-y-auto">
                {props.accountPicker}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-[40px] flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={props.viewModeToggleDisabled}
                    onClick={() => props.onToggleViewMode()}
                    className={cn(
                      "h-9 w-9 inline-flex items-center justify-center rounded-md transition-colors shrink-0",
                      "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                    )}
                  >
                    {props.viewMode === "private" ? (
                      <IconShieldLock className="h-5 w-5" />
                    ) : (
                      <IconWorld className="h-5 w-5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  <div className="text-xs">
                    <div className="font-medium">
                      {props.viewMode === "public"
                        ? "Public mode: on-chain balances"
                        : "Private mode: confidential balances"}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Network: {props.selectedNetworkLabel}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      Click to switch.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {props.viewMode === "private" && (
          <div className="flex items-center justify-end w-full animate-in fade-in slide-in-from-top-1 duration-200">
            <Sheet
              open={props.channelPickerOpen}
              onOpenChange={props.onToggleChannelPicker}
            >
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-accent transition-colors text-left border border-transparent hover:border-border min-w-0"
                >
                  <div className="flex flex-col items-end leading-tight min-w-0">
                    <span className="text-xs font-bold text-primary truncate max-w-[120px]">
                      {props.channelName || "No Channel"}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-medium whitespace-nowrap",
                        props.isConnected
                          ? "text-green-500"
                          : "text-destructive"
                      )}
                    >
                      {props.isConnected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                  {props.isConnected ? (
                    <IconPlugConnected className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <IconPlugConnectedX className="h-4 w-4 text-destructive shrink-0" />
                  )}
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
      </header>
    </>
  );
}
