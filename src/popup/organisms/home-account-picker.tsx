import { cn } from "@/popup/utils/cn.ts";
import { shortenAddress } from "@/popup/utils/common.ts";
import { Badge } from "@/popup/atoms/badge.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import {
  DotsIcon,
  ImportedWalletIcon,
  MasterWalletIcon,
} from "@/popup/icons/index.tsx";
import { AccountRenameInline } from "@/popup/molecules/account-rename-inline.tsx";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";

type KeyGroups = {
  main?: SafeAccount;
  derived: SafeAccount[];
  imported: SafeAccount[];
};

export type HomeAccountPickerProps = {
  actionError?: string;

  keyGroups: KeyGroups;
  selectedAccount?: SafeAccount;

  rowMenuOpenFor?: string;
  setRowMenuOpenFor: (
    v: string | undefined | ((v: string | undefined) => string | undefined)
  ) => void;

  editingAccountId?: string;
  editingName: string;
  setEditingName: (v: string) => void;

  actionBusy: boolean;
  canDeriveNew: boolean;

  onSelectAccount: (account: SafeAccount) => void | Promise<void>;
  startRename: (account: SafeAccount) => void;
  cancelRename: () => void;
  confirmRename: (account: SafeAccount) => void | Promise<void>;

  onCreateNew: () => void | Promise<void>;
  goImport: () => void;
  onClose: () => void;
};

export function HomeAccountPicker(props: HomeAccountPickerProps) {
  return (
    <>
      {props.actionError ? (
        <div className="px-2 pt-2 text-[11px] text-error">
          {props.actionError}
        </div>
      ) : null}

      {props.keyGroups.main ? (
        <div className="py-1">
          <div
            className={cn(
              "mt-1 flex items-center justify-between gap-2 px-2 py-1 rounded-md",
              props.selectedAccount?.walletId ===
                props.keyGroups.main!.walletId &&
                props.selectedAccount?.accountId ===
                  props.keyGroups.main!.accountId
                ? "text-primary"
                : "text-muted"
            )}
          >
            {props.editingAccountId === props.keyGroups.main.accountId ? (
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <MasterWalletIcon className="h-4 w-4" />
                  <div className="min-w-0">
                    <AccountRenameInline
                      value={props.editingName}
                      setValue={props.setEditingName}
                      busy={props.actionBusy}
                      onConfirm={() =>
                        props.confirmRename(props.keyGroups.main!)
                      }
                      onCancel={props.cancelRename}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => props.onSelectAccount(props.keyGroups.main!)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <MasterWalletIcon className="h-4 w-4" />
                  <div className="min-w-0">
                    <div className="min-w-0 text-xs truncate">
                      {props.keyGroups.main.name?.trim() ||
                        shortenAddress(props.keyGroups.main.publicKey)}
                    </div>
                    <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                      {shortenAddress(props.keyGroups.main.publicKey)}
                    </div>
                  </div>
                </div>
              </button>
            )}

            {props.editingAccountId !== props.keyGroups.main.accountId ? (
              <div className="flex items-center gap-2 shrink-0">
                <Badge className="shrink-0">Main</Badge>

                <div className="relative">
                  <button
                    type="button"
                    aria-label="Key menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.setRowMenuOpenFor((prev) =>
                        prev === props.keyGroups.main!.accountId
                          ? undefined
                          : props.keyGroups.main!.accountId
                      );
                    }}
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                  >
                    <DotsIcon className="h-4 w-4" />
                  </button>

                  {props.rowMenuOpenFor === props.keyGroups.main.accountId ? (
                    <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.startRename(props.keyGroups.main!);
                        }}
                        className="px-2 py-1 text-sm text-primary whitespace-nowrap"
                      >
                        Rename
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {props.keyGroups.derived.length > 0 ? (
        <div className="py-1">
          <div className="mt-1 flex flex-col">
            {props.keyGroups.derived.map((account) => {
              const isSelected =
                props.selectedAccount?.walletId === account.walletId &&
                props.selectedAccount?.accountId === account.accountId;

              const label =
                account.name?.trim() || shortenAddress(account.publicKey);

              return (
                <div
                  key={account.accountId}
                  className={cn(
                    "flex items-center justify-between gap-2 pr-2 pl-3 py-0.5 rounded-md",
                    isSelected ? "text-primary" : "text-muted"
                  )}
                >
                  <div className="relative w-5 shrink-0 flex justify-center">
                    <div className="absolute left-1/2 -translate-x-1/2 top-[-12px] bottom-[-2px] w-px bg-muted opacity-60" />
                  </div>
                  {props.editingAccountId === account.accountId ? (
                    <div className="flex-1 text-left">
                      <AccountRenameInline
                        value={props.editingName}
                        setValue={props.setEditingName}
                        busy={props.actionBusy}
                        onConfirm={() => props.confirmRename(account)}
                        onCancel={props.cancelRename}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => props.onSelectAccount(account)}
                      className="flex-1 text-left"
                    >
                      <div className="min-w-0 text-xs truncate">{label}</div>
                      <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                        {shortenAddress(account.publicKey)}
                      </div>
                    </button>
                  )}

                  {props.editingAccountId !== account.accountId ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="shrink-0">Derived</Badge>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Key menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setRowMenuOpenFor((prev) =>
                              prev === account.accountId
                                ? undefined
                                : account.accountId
                            );
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>

                        {props.rowMenuOpenFor === account.accountId ? (
                          <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                props.startRename(account);
                              }}
                              className="px-2 py-1 text-sm text-primary whitespace-nowrap"
                            >
                              Rename
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {props.keyGroups.imported.length > 0 ? (
        <div className="py-1">
          <div className="mt-1 flex flex-col">
            {props.keyGroups.imported.map((account) => {
              const isSelected =
                props.selectedAccount?.walletId === account.walletId &&
                props.selectedAccount?.accountId === account.accountId;

              const label =
                account.name?.trim() || shortenAddress(account.publicKey);

              return (
                <div
                  key={account.accountId}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1 rounded-md",
                    isSelected ? "text-primary" : "text-muted"
                  )}
                >
                  {props.editingAccountId === account.accountId ? (
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <ImportedWalletIcon className="h-4 w-4" />
                        <div className="min-w-0">
                          <AccountRenameInline
                            value={props.editingName}
                            setValue={props.setEditingName}
                            busy={props.actionBusy}
                            onConfirm={() => props.confirmRename(account)}
                            onCancel={props.cancelRename}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => props.onSelectAccount(account)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ImportedWalletIcon className="h-4 w-4" />
                        <div className="min-w-0">
                          <div className="min-w-0 text-xs truncate">
                            {label}
                          </div>
                          <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                            {shortenAddress(account.publicKey)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )}

                  {props.editingAccountId !== account.accountId ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="shrink-0">Imported</Badge>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Key menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            props.setRowMenuOpenFor((prev) =>
                              prev === account.accountId
                                ? undefined
                                : account.accountId
                            );
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>

                        {props.rowMenuOpenFor === account.accountId ? (
                          <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                props.startRename(account);
                              }}
                              className="px-2 py-1 text-sm text-primary whitespace-nowrap"
                            >
                              Rename
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-2 border-t border-muted pt-2 px-2">
        <div className="flex gap-2">
          <Button
            uiSize="sm"
            disabled={!props.canDeriveNew || props.actionBusy}
            onClick={props.onCreateNew}
            className={cn(
              "flex-1",
              !props.canDeriveNew ? "text-muted" : "text-primary"
            )}
          >
            Create new
          </Button>

          <Button
            uiSize="sm"
            disabled={props.actionBusy}
            onClick={() => {
              props.onClose();
              props.goImport();
            }}
            className="flex-1"
          >
            Import
          </Button>
        </div>
      </div>
    </>
  );
}
