import React, { useMemo, useState } from "react";
import { Shell } from "@/popup/templates/shell.tsx";
import { usePopup } from "@/popup/hooks/state.tsx";
import { cn } from "@/popup/utils/cn.ts";
import { setNetwork } from "@/popup/api/set-network.ts";
import { setSelectedAccount } from "@/popup/api/set-selected-account.ts";
import { deriveAccount } from "@/popup/api/derive-account.ts";
import { renameAccount } from "@/popup/api/rename-account.ts";
import { Input } from "@/popup/atoms/input.tsx";
import { Badge } from "@/popup/atoms/badge.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import type { SafeAccount } from "@/background/handlers/get-accounts.types.ts";

function shortenAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-6)}`;
}

function networkLabel(
  network: "mainnet" | "testnet" | "futurenet" | "custom",
  customNetworkName?: string
) {
  switch (network) {
    case "mainnet":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "futurenet":
      return "Futurenet";
    case "custom":
      return customNetworkName?.trim() || "Custom";
  }
}

function HamburgerIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function GlobeIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.5 3 14.5 0 18" />
      <path d="M12 3c-3 3.5-3 14.5 0 18" />
    </svg>
  );
}

function ChevronDownIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DotsIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

function CheckIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function MasterWalletIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 7H9a2 2 0 0 0-2 2v10" />
      <path d="M16 3H7a2 2 0 0 0-2 2v14" />
      <path d="M12 12h8" />
      <path d="M16 8v8" />
    </svg>
  );
}

function ImportedWalletIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function HomePage() {
  const { state, actions } = usePopup();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [rowMenuOpenFor, setRowMenuOpenFor] = useState<string | undefined>(
    undefined
  );
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>(
    undefined
  );
  const [editingName, setEditingName] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const status = state.status;
  const accounts = state.accounts ?? [];

  const mainKeyRef = status?.mainKey;

  const selectedAccount = useMemo(() => {
    const pick = (ref?: { walletId: string; accountId: string }) => {
      if (!ref) return undefined;
      return accounts.find(
        (a) => a.walletId === ref.walletId && a.accountId === ref.accountId
      );
    };

    return pick(status?.lastSelectedAccount) ?? pick(mainKeyRef) ?? accounts[0];
  }, [accounts, status?.lastSelectedAccount, mainKeyRef]);

  const header = useMemo(() => {
    if (!selectedAccount) {
      return {
        keyName: undefined as string | undefined,
        addressShort: "",
      };
    }

    const keyName = selectedAccount.name?.trim();
    const addressShort = shortenAddress(selectedAccount.publicKey);

    return {
      keyName: keyName || undefined,
      addressShort,
    };
  }, [selectedAccount]);

  const keyGroups = useMemo(() => {
    const main = mainKeyRef
      ? accounts.find(
          (a) =>
            a.walletId === mainKeyRef.walletId &&
            a.accountId === mainKeyRef.accountId
        )
      : accounts[0];

    const mainWalletId = main?.walletId;

    const isMain = (a: SafeAccount) =>
      Boolean(main) &&
      a.walletId === main!.walletId &&
      a.accountId === main!.accountId;

    const isDerivedFromMain = (a: SafeAccount) => {
      if (!mainWalletId) return false;
      if (a.walletId !== mainWalletId) return false;
      if (a.accountType !== "derived") return false;
      const index = a.index ?? 0;
      // index 0 is the main key (by convention)
      return index > 0;
    };

    const derived = accounts.filter(isDerivedFromMain);
    const imported = accounts.filter(
      (a) => !isMain(a) && !isDerivedFromMain(a)
    );

    return {
      main,
      derived,
      imported,
    };
  }, [accounts, mainKeyRef]);

  const selectedNetwork = status?.lastSelectedNetwork ?? "mainnet";
  const selectedNetworkLabel = networkLabel(
    selectedNetwork,
    status?.customNetworkName
  );

  const onSelectNetwork = async (
    network: "mainnet" | "testnet" | "futurenet"
  ) => {
    await setNetwork(network);
    await actions.refreshStatus();
    setMenuOpen(false);
  };

  const onSelectAccount = async (account: SafeAccount) => {
    await setSelectedAccount({
      walletId: account.walletId,
      accountId: account.accountId,
    });
    await actions.refreshStatus();
    setAccountPickerOpen(false);
  };

  const startRename = (account: SafeAccount) => {
    setRowMenuOpenFor(undefined);
    setEditingAccountId(account.accountId);
    setEditingName(account.name?.trim() || "");
  };

  const cancelRename = () => {
    setEditingAccountId(undefined);
    setEditingName("");
  };

  const confirmRename = async (account: SafeAccount) => {
    const next = editingName.trim();
    if (!next) return;

    setActionError(undefined);
    setActionBusy(true);
    try {
      await renameAccount({
        walletId: account.walletId,
        accountId: account.accountId,
        name: next,
      });
      await actions.refreshStatus();
      cancelRename();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const canDeriveNew =
    Boolean(keyGroups.main) && keyGroups.main?.walletType === "mnemonic";

  const onCreateNew = async () => {
    if (!canDeriveNew) return;

    setActionError(undefined);
    setActionBusy(true);
    try {
      await deriveAccount();
      await actions.refreshStatus();
      setAccountPickerOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <Shell>
      <div className="relative">
        <header className="h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "h-9 w-9 inline-flex items-center justify-center rounded-md",
                "text-primary"
              )}
            >
              <HamburgerIcon className="h-5 w-5" />
            </button>

            <div className="relative group">
              <button
                type="button"
                aria-label="Network"
                className={cn(
                  "h-9 w-9 inline-flex items-center justify-center rounded-md",
                  "text-primary"
                )}
              >
                <GlobeIcon className="h-5 w-5" />
              </button>

              <div
                className={cn(
                  "pointer-events-none opacity-0 group-hover:opacity-100",
                  "absolute left-1/2 -translate-x-1/2 top-full mt-2",
                  "px-2 py-1 rounded-md border border-primary bg-background",
                  "text-xs text-primary whitespace-nowrap"
                )}
              >
                {selectedNetworkLabel}
              </div>
            </div>
          </div>

          <div className="flex-1 text-center">
            <button
              type="button"
              aria-label="Select account"
              aria-expanded={accountPickerOpen}
              onClick={() => setAccountPickerOpen((v) => !v)}
              className={cn(
                "inline-flex items-center justify-center gap-1",
                "max-w-[240px]",
                "text-primary"
              )}
            >
              {header.keyName ? (
                <div className="flex flex-col items-center leading-tight">
                  <div className="text-sm font-medium text-primary truncate max-w-[220px]">
                    {header.keyName}
                  </div>
                  <div className="text-[10px] text-muted truncate max-w-[220px]">
                    {header.addressShort}
                  </div>
                </div>
              ) : (
                <h1 className="text-sm font-medium text-primary truncate">
                  {header.addressShort}
                </h1>
              )}

              <ChevronDownIcon className="h-4 w-4 text-muted" />
            </button>
          </div>

          <div className="w-[76px]" />
        </header>

        {menuOpen ? (
          <div className="absolute left-0 top-12 w-full rounded-md border border-primary bg-background p-3">
            <div className="text-xs text-muted">Settings</div>

            <div className="mt-3">
              <div className="text-sm text-primary">Network</div>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onSelectNetwork("mainnet")}
                  className={cn(
                    "text-left rounded-md border border-primary px-3 py-2 text-sm",
                    selectedNetwork === "mainnet"
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  Mainnet
                </button>
                <button
                  type="button"
                  onClick={() => onSelectNetwork("testnet")}
                  className={cn(
                    "text-left rounded-md border border-primary px-3 py-2 text-sm",
                    selectedNetwork === "testnet"
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  Testnet
                </button>
                <button
                  type="button"
                  onClick={() => onSelectNetwork("futurenet")}
                  className={cn(
                    "text-left rounded-md border border-primary px-3 py-2 text-sm",
                    selectedNetwork === "futurenet"
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  Futurenet
                </button>

                <button
                  type="button"
                  disabled
                  className={cn(
                    "text-left rounded-md border border-primary px-3 py-2 text-sm",
                    "text-muted opacity-50"
                  )}
                >
                  Custom (disabled)
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {accountPickerOpen ? (
          <div className="absolute left-0 top-12 w-full rounded-md border border-primary bg-background p-2">
            {actionError ? (
              <div className="px-2 pt-2 text-[11px] text-error">
                {actionError}
              </div>
            ) : null}

            {keyGroups.main ? (
              <div className="py-1">
                <div
                  className={cn(
                    "mt-1 flex items-center justify-between gap-2 px-2 py-1 rounded-md",
                    selectedAccount?.walletId === keyGroups.main!.walletId &&
                      selectedAccount?.accountId === keyGroups.main!.accountId
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectAccount(keyGroups.main!)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <MasterWalletIcon className="h-4 w-4" />
                      <div className="min-w-0">
                        {editingAccountId === keyGroups.main.accountId ? (
                          <div className="flex items-center gap-2">
                            <Input
                              uiSize="sm"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  confirmRename(keyGroups.main!);
                                }
                                if (e.key === "Escape") {
                                  e.preventDefault();
                                  cancelRename();
                                }
                              }}
                            />
                            <button
                              type="button"
                              aria-label="Confirm"
                              disabled={actionBusy || !editingName.trim()}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmRename(keyGroups.main!);
                              }}
                              className="text-primary disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label="Cancel"
                              disabled={actionBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-muted disabled:opacity-50"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0 text-xs truncate">
                              {keyGroups.main.name?.trim() ||
                                shortenAddress(keyGroups.main.publicKey)}
                            </div>
                            <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                              {shortenAddress(keyGroups.main.publicKey)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </button>

                  {editingAccountId !== keyGroups.main.accountId ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="shrink-0">Main</Badge>

                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Key menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRowMenuOpenFor((prev) =>
                              prev === keyGroups.main!.accountId
                                ? undefined
                                : keyGroups.main!.accountId
                            );
                          }}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                        >
                          <DotsIcon className="h-4 w-4" />
                        </button>

                        {rowMenuOpenFor === keyGroups.main.accountId ? (
                          <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startRename(keyGroups.main!);
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

            {keyGroups.derived.length > 0 ? (
              <div className="py-1">
                <div className="mt-1 flex flex-col">
                  {keyGroups.derived.map((account) => {
                    const isSelected =
                      selectedAccount?.walletId === account.walletId &&
                      selectedAccount?.accountId === account.accountId;

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
                        <button
                          type="button"
                          onClick={() => onSelectAccount(account)}
                          className="flex-1 text-left"
                        >
                          {editingAccountId === account.accountId ? (
                            <div className="flex items-center gap-2">
                              <Input
                                uiSize="sm"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    confirmRename(account);
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelRename();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                aria-label="Confirm"
                                disabled={actionBusy || !editingName.trim()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmRename(account);
                                }}
                                className="text-primary disabled:opacity-50"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Cancel"
                                disabled={actionBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelRename();
                                }}
                                className="text-muted disabled:opacity-50"
                              >
                                <XIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="min-w-0 text-xs truncate">
                                {label}
                              </div>
                              <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                                {shortenAddress(account.publicKey)}
                              </div>
                            </>
                          )}
                        </button>

                        {editingAccountId !== account.accountId ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="shrink-0">Derived</Badge>

                            <div className="relative">
                              <button
                                type="button"
                                aria-label="Key menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowMenuOpenFor((prev) =>
                                    prev === account.accountId
                                      ? undefined
                                      : account.accountId
                                  );
                                }}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                              >
                                <DotsIcon className="h-4 w-4" />
                              </button>

                              {rowMenuOpenFor === account.accountId ? (
                                <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRename(account);
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

            {keyGroups.imported.length > 0 ? (
              <div className="py-1">
                <div className="mt-1 flex flex-col">
                  {keyGroups.imported.map((account) => {
                    const isSelected =
                      selectedAccount?.walletId === account.walletId &&
                      selectedAccount?.accountId === account.accountId;

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
                        <button
                          type="button"
                          onClick={() => onSelectAccount(account)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <ImportedWalletIcon className="h-4 w-4" />
                            <div className="min-w-0">
                              {editingAccountId === account.accountId ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    uiSize="sm"
                                    value={editingName}
                                    onChange={(e) =>
                                      setEditingName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        confirmRename(account);
                                      }
                                      if (e.key === "Escape") {
                                        e.preventDefault();
                                        cancelRename();
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    aria-label="Confirm"
                                    disabled={actionBusy || !editingName.trim()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmRename(account);
                                    }}
                                    className="text-primary disabled:opacity-50"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Cancel"
                                    disabled={actionBusy}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelRename();
                                    }}
                                    className="text-muted disabled:opacity-50"
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="min-w-0 text-xs truncate">
                                    {label}
                                  </div>
                                  <div className="text-[9px] leading-tight truncate text-muted opacity-80">
                                    {shortenAddress(account.publicKey)}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        {editingAccountId !== account.accountId ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="shrink-0">Imported</Badge>

                            <div className="relative">
                              <button
                                type="button"
                                aria-label="Key menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRowMenuOpenFor((prev) =>
                                    prev === account.accountId
                                      ? undefined
                                      : account.accountId
                                  );
                                }}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted"
                              >
                                <DotsIcon className="h-4 w-4" />
                              </button>

                              {rowMenuOpenFor === account.accountId ? (
                                <div className="absolute right-0 top-full mt-1 rounded-md border border-primary bg-background p-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startRename(account);
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
                  disabled={!canDeriveNew || actionBusy}
                  onClick={onCreateNew}
                  className={cn(
                    "flex-1",
                    !canDeriveNew ? "text-muted" : "text-primary"
                  )}
                >
                  Create new
                </Button>

                <Button
                  uiSize="sm"
                  disabled={actionBusy}
                  onClick={() => {
                    setAccountPickerOpen(false);
                    actions.goImport();
                  }}
                  className="flex-1"
                >
                  Import
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
