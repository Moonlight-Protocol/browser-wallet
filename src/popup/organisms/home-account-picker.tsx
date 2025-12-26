import { cn } from "@/popup/utils/cn.ts";
import { shortenAddress } from "@/popup/utils/common.ts";
import { Button } from "@/popup/atoms/button.tsx";
import { AccountRenameInline } from "@/popup/molecules/account-rename-inline.tsx";
import { PickerItem } from "@/popup/molecules/picker-item.tsx";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/popup/atoms/dropdown-menu.tsx";
import {
  IconWallet,
  IconDownload,
  IconPlus,
  IconArrowRampRight2,
  IconArrowDownToArc,
} from "@tabler/icons-react";

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
        <>
          <DropdownMenuLabel>Main Wallet</DropdownMenuLabel>
          <PickerItem
            isSelected={
              props.selectedAccount?.walletId ===
                props.keyGroups.main!.walletId &&
              props.selectedAccount?.accountId ===
                props.keyGroups.main!.accountId
            }
            icon={<IconWallet className="h-4 w-4" />}
            title={
              props.keyGroups.main.name?.trim() ||
              shortenAddress(props.keyGroups.main.publicKey)
            }
            subtitle={shortenAddress(props.keyGroups.main.publicKey)}
            onClick={() => props.onSelectAccount(props.keyGroups.main!)}
            onActionClick={(e) => {
              e.stopPropagation();
              props.setRowMenuOpenFor((prev) =>
                prev === props.keyGroups.main!.accountId
                  ? undefined
                  : props.keyGroups.main!.accountId
              );
            }}
            actionOpen={props.rowMenuOpenFor === props.keyGroups.main.accountId}
            actionContent={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  props.startRename(props.keyGroups.main!);
                }}
                className="px-2 py-1 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm w-full text-left whitespace-nowrap"
              >
                Rename
              </button>
            }
            editing={props.editingAccountId === props.keyGroups.main.accountId}
            editingContent={
              <AccountRenameInline
                value={props.editingName}
                setValue={props.setEditingName}
                busy={props.actionBusy}
                onConfirm={() => props.confirmRename(props.keyGroups.main!)}
                onCancel={props.cancelRename}
              />
            }
          />
        </>
      ) : null}

      {props.keyGroups.derived.length > 0 ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Derived Accounts</DropdownMenuLabel>
          <div className="flex flex-col">
            {props.keyGroups.derived.map((account) => (
              <PickerItem
                key={account.accountId}
                isSelected={
                  props.selectedAccount?.walletId === account.walletId &&
                  props.selectedAccount?.accountId === account.accountId
                }
                icon={<IconArrowRampRight2 className="h-4 w-4 scale-y-[-1]" />}
                title={
                  account.name?.trim() || shortenAddress(account.publicKey)
                }
                subtitle={shortenAddress(account.publicKey)}
                onClick={() => props.onSelectAccount(account)}
                onActionClick={(e) => {
                  e.stopPropagation();
                  props.setRowMenuOpenFor((prev) =>
                    prev === account.accountId ? undefined : account.accountId
                  );
                }}
                actionOpen={props.rowMenuOpenFor === account.accountId}
                actionContent={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.startRename(account);
                    }}
                    className="px-2 py-1 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm w-full text-left whitespace-nowrap"
                  >
                    Rename
                  </button>
                }
                editing={props.editingAccountId === account.accountId}
                editingContent={
                  <AccountRenameInline
                    value={props.editingName}
                    setValue={props.setEditingName}
                    busy={props.actionBusy}
                    onConfirm={() => props.confirmRename(account)}
                    onCancel={props.cancelRename}
                  />
                }
              />
            ))}
          </div>
        </>
      ) : null}

      {props.keyGroups.imported.length > 0 ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Imported Accounts</DropdownMenuLabel>
          <div className="flex flex-col">
            {props.keyGroups.imported.map((account) => (
              <PickerItem
                key={account.accountId}
                isSelected={
                  props.selectedAccount?.walletId === account.walletId &&
                  props.selectedAccount?.accountId === account.accountId
                }
                icon={<IconArrowDownToArc className="h-4 w-4" />}
                title={
                  account.name?.trim() || shortenAddress(account.publicKey)
                }
                subtitle={shortenAddress(account.publicKey)}
                onClick={() => props.onSelectAccount(account)}
                onActionClick={(e) => {
                  e.stopPropagation();
                  props.setRowMenuOpenFor((prev) =>
                    prev === account.accountId ? undefined : account.accountId
                  );
                }}
                actionOpen={props.rowMenuOpenFor === account.accountId}
                actionContent={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.startRename(account);
                    }}
                    className="px-2 py-1 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm w-full text-left whitespace-nowrap"
                  >
                    Rename
                  </button>
                }
                editing={props.editingAccountId === account.accountId}
                editingContent={
                  <AccountRenameInline
                    value={props.editingName}
                    setValue={props.setEditingName}
                    busy={props.actionBusy}
                    onConfirm={() => props.confirmRename(account)}
                    onCancel={props.cancelRename}
                  />
                }
              />
            ))}
          </div>
        </>
      ) : null}

      <DropdownMenuSeparator />
      <div className="p-2 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          disabled={!props.canDeriveNew || props.actionBusy}
          onClick={props.onCreateNew}
        >
          <IconPlus className="h-4 w-4" /> Create
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2"
          disabled={props.actionBusy}
          onClick={() => {
            props.onClose();
            props.goImport();
          }}
        >
          <IconDownload className="h-4 w-4" /> Import
        </Button>
      </div>
    </>
  );
}
