import { cn } from "@/popup/utils/cn.ts";
import { toDecimals } from "@colibri/core";
import {
  ChevronDownIcon,
  HamburgerIcon,
  GlobeIcon,
  LockIcon,
  SyncIcon,
} from "@/popup/icons/index.tsx";

export type HomeHeaderProps = {
  selectedNetworkLabel: string;
  viewMode: "public" | "private";
  onToggleViewMode: () => void | Promise<void>;
  viewModeToggleDisabled?: boolean;

  accountPickerOpen: boolean;
  onToggleAccountPicker: () => void;

  onOpenMenu: () => void;

  headerKeyName?: string;
  headerAddressShort: string;

  showBalance: boolean;
  balanceXlm?: string;
  syncing: boolean;
};

export function HomeHeader(props: HomeHeaderProps) {
  const modeLabel = props.viewMode === "public" ? "Public" : "Private";

  return (
    <>
      <header className="h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Menu"
            onClick={props.onOpenMenu}
            className={cn(
              "h-9 w-9 inline-flex items-center justify-center rounded-md",
              "text-primary"
            )}
          >
            <HamburgerIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 text-center">
          <button
            type="button"
            aria-label="Select account"
            aria-expanded={props.accountPickerOpen}
            onClick={props.onToggleAccountPicker}
            className={cn(
              "inline-flex items-center justify-center gap-1",
              "max-w-[240px]",
              "text-primary"
            )}
          >
            {props.headerKeyName ? (
              <div className="flex flex-col items-center leading-tight">
                <div className="text-sm font-medium text-primary truncate max-w-[220px]">
                  {props.headerKeyName}
                </div>
                <div className="text-[10px] text-muted truncate max-w-[220px]">
                  {props.headerAddressShort}
                </div>
              </div>
            ) : (
              <h1 className="text-sm font-medium text-primary truncate">
                {props.headerAddressShort}
              </h1>
            )}

            <ChevronDownIcon className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="w-[76px] flex items-center justify-end">
          <div className="relative group">
            <button
              type="button"
              aria-label={`${modeLabel} mode`}
              aria-pressed={props.viewMode === "private"}
              disabled={props.viewModeToggleDisabled}
              onClick={() => props.onToggleViewMode()}
              className={cn(
                "h-9 w-9 inline-flex items-center justify-center rounded-md",
                "text-primary",
                props.viewModeToggleDisabled ? "opacity-50" : undefined
              )}
            >
              {props.viewMode === "private" ? (
                <LockIcon className="h-5 w-5" />
              ) : (
                <GlobeIcon className="h-5 w-5" />
              )}
            </button>

            <div
              className={cn(
                "opacity-0 group-hover:opacity-100",
                "pointer-events-none",
                "absolute right-0 top-full mt-1",
                "w-[220px]",
                "px-2 py-2 rounded-md border border-primary bg-background",
                "text-xs text-primary"
              )}
            >
              <div className="text-primary">
                {props.viewMode === "public"
                  ? "Public mode: on-chain balances"
                  : "Private mode: (WIP)"}
              </div>
              <div className="mt-1 text-muted">
                Network: {props.selectedNetworkLabel}
              </div>
              <div className="mt-1 text-muted">Click to switch.</div>
            </div>
          </div>
        </div>
      </header>

      {props.showBalance ? (
        <div className="mt-1 flex items-center justify-center gap-2 text-[11px] text-muted">
          <div className="truncate">
            Balance:{" "}
            {props.balanceXlm ? toDecimals(BigInt(props.balanceXlm), 7) : "—"}{" "}
            XLM
          </div>
          {props.syncing ? (
            <SyncIcon className="h-3.5 w-3.5 text-muted" />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
