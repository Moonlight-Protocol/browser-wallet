import { cn } from "@/popup/utils/cn.ts";
import { Button } from "@/popup/atoms/button.tsx";
import { LockIcon, XIcon } from "@/popup/icons/index.tsx";

export type HomeMenuDrawerProps = {
  open: boolean;
  selectedNetworkLabel: string;

  actionBusy: boolean;
  actionError?: string;

  onClose: () => void;
  goImport: () => void;
  goSettings: () => void;
  onLockFromMenu: () => void | Promise<void>;
};

export function HomeMenuDrawer(props: HomeMenuDrawerProps) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close menu"
        onClick={props.onClose}
        className="absolute inset-0"
      />

      <div className="absolute left-0 top-0 h-full w-64 border-r border-primary bg-background p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-primary">Menu</div>
          <button
            type="button"
            aria-label="Close"
            onClick={props.onClose}
            className={cn(
              "h-9 w-9 inline-flex items-center justify-center rounded-md",
              "text-primary"
            )}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 text-[11px] text-muted">
          Network: {props.selectedNetworkLabel}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              props.onClose();
              props.goImport();
            }}
            className={cn(
              "text-left rounded-md border border-primary px-3 py-2 text-sm",
              "text-primary"
            )}
          >
            Import
          </button>

          <button
            type="button"
            onClick={() => {
              props.onClose();
              props.goSettings();
            }}
            className={cn(
              "text-left rounded-md border border-primary px-3 py-2 text-sm",
              "text-primary"
            )}
          >
            Settings
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-primary">
          <Button
            uiSize="md"
            disabled={props.actionBusy}
            onClick={props.onLockFromMenu}
            className="w-full"
            contentAlign="start"
            icon={<LockIcon className="h-4 w-4" />}
          >
            Lock wallet
          </Button>

          {props.actionError ? (
            <div className="mt-2 text-[11px] text-error">
              {props.actionError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
