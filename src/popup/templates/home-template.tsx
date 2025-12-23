import { Shell } from "@/popup/templates/shell.tsx";
import { networkLabel, shortenAddress } from "@/popup/utils/common.ts";
import { HomeHeader } from "@/popup/organisms/home-header.tsx";
import { HomeMenuDrawer } from "@/popup/organisms/home-menu-drawer.tsx";
import { HomeAccountPicker } from "@/popup/organisms/home-account-picker.tsx";
import { PrivateChannelPicker } from "@/popup/organisms/private-channel-picker.tsx";
import { Dropdown } from "@/popup/atoms/dropdown.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { LoadingSpinner } from "@/popup/atoms/loading-spinner.tsx";
import { cn } from "@/popup/utils/cn.ts";
import {
  ChevronDownIcon,
  HamburgerIcon,
  LockIcon,
} from "@/popup/icons/index.tsx";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import type { PrivateChannelStats } from "@/persistence/stores/private-utxos.types.ts";

type KeyGroups = {
  main?: SafeAccount;
  derived: SafeAccount[];
  imported: SafeAccount[];
};

type SelectedChain =
  | {
      initialized?: boolean;
      balanceXlm?: string;
      sequence?: string;
      created?: boolean;
      createdConfirmed?: boolean;
      syncing: boolean;
      stale: boolean;
      error?: string;
    }
  | undefined;

export type HomeTemplateProps = {
  selectedAccount?: SafeAccount;
  selectedNetwork: ChainNetwork;
  customNetworkName?: string;
  selectedChain: SelectedChain;

  viewMode: "public" | "private";
  onToggleViewMode: () => void | Promise<void>;
  viewModeToggleDisabled?: boolean;

  privateChannels?: {
    loading: boolean;
    error?: string;
    channels: PrivateChannel[];
    selectedChannelId?: string;
  };
  privateStats?: {
    loading: boolean;
    error?: string;
    stats?: PrivateChannelStats;
  };
  privateView?: "list" | "selected";
  setPrivateView?: (v: "list" | "selected") => void;
  onAddPrivateChannel?: () => void | Promise<void>;
  onSelectPrivateChannel?: (channelId: string) => void | Promise<void>;

  activation?: {
    status: "created" | "not_created" | "unknown";
    canUseFriendbot: boolean;
    checking: boolean;
    funding: boolean;
    error?: string;
  };
  onFundWithFriendbot?: () => void | Promise<void>;

  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;

  accountPickerOpen: boolean;
  setAccountPickerOpen: (v: boolean | ((v: boolean) => boolean)) => void;

  rowMenuOpenFor: string | undefined;
  setRowMenuOpenFor: (
    v: string | undefined | ((v: string | undefined) => string | undefined)
  ) => void;

  editingAccountId: string | undefined;
  setEditingAccountId: (v: string | undefined) => void;

  editingName: string;
  setEditingName: (v: string) => void;

  actionBusy: boolean;
  actionError: string | undefined;

  keyGroups: KeyGroups;
  canDeriveNew: boolean;

  onSelectAccount: (account: SafeAccount) => void | Promise<void>;
  startRename: (account: SafeAccount) => void;
  cancelRename: () => void;
  confirmRename: (account: SafeAccount) => void | Promise<void>;

  onCreateNew: () => void | Promise<void>;
  onLockFromMenu: () => void | Promise<void>;

  goImport: () => void;
  goSettings: () => void;
};

export function HomeTemplate(props: HomeTemplateProps) {
  const isInitialized =
    props.viewMode === "public" &&
    (props.selectedChain?.createdConfirmed === true ||
      props.selectedChain?.initialized === true ||
      props.activation?.status === "created");

  const selectedNetworkLabel = networkLabel({
    network: props.selectedNetwork,
    customNetworkName: props.customNetworkName,
  });

  const header = (() => {
    const selectedAccount = props.selectedAccount;

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
  })();

  const selectedPrivateChannel =
    props.viewMode === "private" &&
    props.privateView === "selected" &&
    props.privateChannels?.selectedChannelId
      ? props.privateChannels.channels.find(
          (c) => c.id === props.privateChannels?.selectedChannelId
        )
      : undefined;

  return (
    <Shell>
      <div className="relative">
        {props.viewMode === "private" && selectedPrivateChannel ? (
          <>
            <header className="h-12 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Menu"
                  onClick={() => {
                    props.setAccountPickerOpen(false);
                    props.setMenuOpen(true);
                  }}
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
                  aria-label="Select channel"
                  aria-expanded={props.privateView === "list"}
                  onClick={() =>
                    (() => {
                      props.setAccountPickerOpen(false);
                      props.setPrivateView?.(
                        props.privateView === "list" ? "selected" : "list"
                      );
                    })()
                  }
                  className={cn(
                    "inline-flex items-center justify-center gap-1",
                    "max-w-[240px]",
                    "text-primary"
                  )}
                >
                  <LockIcon className="h-4 w-4 text-muted" />
                  <div className="text-sm font-medium text-primary truncate max-w-[200px]">
                    {selectedPrivateChannel.name}
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-muted" />
                </button>
              </div>

              <div className="w-[76px] flex items-center justify-end">
                <div className="relative group">
                  <button
                    type="button"
                    aria-label="Private mode"
                    aria-pressed
                    disabled={props.viewModeToggleDisabled}
                    onClick={() => props.onToggleViewMode()}
                    className={cn(
                      "h-9 w-9 inline-flex items-center justify-center rounded-md",
                      "text-primary",
                      props.viewModeToggleDisabled ? "opacity-50" : undefined
                    )}
                  >
                    <LockIcon className="h-5 w-5" />
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
                    <div className="text-primary">Private mode: (WIP)</div>
                    <div className="mt-1 text-muted">
                      Network: {selectedNetworkLabel}
                    </div>
                    <div className="mt-1 text-muted">Click to switch.</div>
                  </div>
                </div>
              </div>
            </header>
          </>
        ) : (
          <HomeHeader
            selectedNetworkLabel={selectedNetworkLabel}
            viewMode={props.viewMode}
            onToggleViewMode={props.onToggleViewMode}
            viewModeToggleDisabled={props.viewModeToggleDisabled}
            accountPickerOpen={props.accountPickerOpen}
            onToggleAccountPicker={() => props.setAccountPickerOpen((v) => !v)}
            onOpenMenu={() => {
              props.setAccountPickerOpen(false);
              props.setMenuOpen(true);
            }}
            headerKeyName={header.keyName}
            headerAddressShort={header.addressShort}
            showBalance={Boolean(props.selectedAccount) && isInitialized}
            balanceXlm={props.selectedChain?.balanceXlm}
            syncing={Boolean(props.selectedChain?.syncing)}
          />
        )}

        {props.viewMode === "private" ? (
          <div className="mt-4 rounded-md border border-muted p-3">
            {props.privateChannels?.loading ? (
              <LoadingSpinner uiSize="md" className="py-6" />
            ) : props.privateChannels?.error ? (
              <>
                <p className="text-sm text-muted">Failed to load channels.</p>
                <p className="mt-1 text-sm text-error">
                  {props.privateChannels.error}
                </p>
                <div className="mt-3 flex justify-center">
                  <Button
                    uiSize="md"
                    className="w-full max-w-xs"
                    onClick={() => props.onAddPrivateChannel?.()}
                    disabled={!props.onAddPrivateChannel}
                  >
                    Add channel
                  </Button>
                </div>
              </>
            ) : (props.privateChannels?.channels?.length ?? 0) === 0 ? (
              <>
                <p className="text-sm text-muted">
                  No channels yet for this network.
                </p>
                <p className="mt-1 text-sm text-muted">
                  Add a channel to start using private mode.
                </p>
                <div className="mt-3 flex justify-center">
                  <Button
                    uiSize="md"
                    className="w-full max-w-xs"
                    onClick={() => props.onAddPrivateChannel?.()}
                    disabled={!props.onAddPrivateChannel}
                  >
                    Add channel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Dropdown
                  open={props.privateView === "list"}
                  onClose={() => props.setPrivateView?.("selected")}
                >
                  <PrivateChannelPicker
                    channels={props.privateChannels?.channels ?? []}
                    selectedChannelId={props.privateChannels?.selectedChannelId}
                    onSelectChannel={(id) => props.onSelectPrivateChannel?.(id)}
                    onAddChannel={() => props.onAddPrivateChannel?.()}
                  />
                </Dropdown>

                {props.privateView === "selected" && selectedPrivateChannel ? (
                  <>
                    <p className="text-sm text-muted">Private channel</p>
                    <p className="mt-1 text-sm text-muted">
                      Asset: {selectedPrivateChannel.asset.code}
                    </p>

                    <div className="mt-3 rounded-md border border-muted p-3">
                      {props.privateStats?.loading ? (
                        <LoadingSpinner uiSize="sm" className="py-2" />
                      ) : props.privateStats?.error ? (
                        <p className="text-sm text-error">
                          {props.privateStats.error}
                        </p>
                      ) : props.privateStats?.stats ? (
                        <>
                          <p className="text-sm text-muted">
                            Private balance:{" "}
                            {props.privateStats.stats.totalBalance}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            Derived UTXOs:{" "}
                            {props.privateStats.stats.derivedCount}/
                            {props.privateStats.stats.targetCount}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            Non-zero UTXOs:{" "}
                            {props.privateStats.stats.nonZeroCount}
                          </p>
                        </>
                      ) : (
                        <LoadingSpinner uiSize="sm" className="py-2" />
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted">Select a channel.</p>
                )}
              </>
            )}
          </div>
        ) : null}

        {props.viewMode === "public" &&
        props.selectedAccount &&
        props.activation &&
        !isInitialized &&
        props.activation.status !== "created" ? (
          <div className="mt-4 rounded-md border border-muted p-3">
            <div className="min-w-0">
              {props.activation.checking || props.activation.funding ? (
                <LoadingSpinner
                  uiSize="md"
                  message={
                    props.activation.funding ? "Initializing…" : undefined
                  }
                  className="py-6"
                />
              ) : props.activation.status === "not_created" ? (
                <>
                  <p className="text-sm text-muted">
                    This account isn&apos;t initialized yet.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    It needs funds to exist on-chain and hold public balances.
                  </p>
                  {props.activation.canUseFriendbot ? (
                    <p className="mt-1 text-sm text-muted">
                      You can create it with Friendbot.
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Couldn&apos;t verify whether this account is initialized.
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Public balances may be unavailable until this check
                    succeeds.
                  </p>
                </>
              )}
              {props.activation.error ? (
                <p className="mt-1 text-sm text-error">
                  {props.activation.error}
                </p>
              ) : null}

              {props.activation.status === "not_created" &&
              props.activation.canUseFriendbot &&
              props.onFundWithFriendbot ? (
                <div className="mt-3 flex justify-center">
                  <Button
                    uiSize="md"
                    className="w-full max-w-xs"
                    onClick={() => props.onFundWithFriendbot?.()}
                    disabled={
                      props.activation.checking || props.activation.funding
                    }
                  >
                    {props.activation.funding
                      ? "Initializing…"
                      : "Initialize with 10,000 XLM"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <HomeMenuDrawer
          open={props.menuOpen}
          selectedNetworkLabel={selectedNetworkLabel}
          actionBusy={props.actionBusy}
          actionError={props.actionError}
          onClose={() => props.setMenuOpen(false)}
          goImport={props.goImport}
          goSettings={props.goSettings}
          onLockFromMenu={props.onLockFromMenu}
        />

        <Dropdown
          open={props.accountPickerOpen}
          onClose={() => props.setAccountPickerOpen(false)}
        >
          <HomeAccountPicker
            actionError={props.actionError}
            keyGroups={props.keyGroups}
            selectedAccount={props.selectedAccount}
            rowMenuOpenFor={props.rowMenuOpenFor}
            setRowMenuOpenFor={props.setRowMenuOpenFor}
            editingAccountId={props.editingAccountId}
            editingName={props.editingName}
            setEditingName={props.setEditingName}
            actionBusy={props.actionBusy}
            canDeriveNew={props.canDeriveNew}
            onSelectAccount={props.onSelectAccount}
            startRename={props.startRename}
            cancelRename={props.cancelRename}
            confirmRename={props.confirmRename}
            onCreateNew={props.onCreateNew}
            goImport={props.goImport}
            onClose={() => props.setAccountPickerOpen(false)}
          />
        </Dropdown>
      </div>
    </Shell>
  );
}
