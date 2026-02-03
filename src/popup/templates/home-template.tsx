import { Shell } from "@/popup/templates/shell.tsx";
import { networkLabel, shortenAddress } from "@/popup/utils/common.ts";
import { HomeHeader } from "@/popup/organisms/home-header.tsx";
import { HomeAccountPicker } from "@/popup/organisms/home-account-picker.tsx";
import { PrivateChannelManager } from "@/popup/organisms/private-channel-manager.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Spinner } from "@/popup/atoms/spinner.tsx";
import { LoadingSpinner } from "@/popup/atoms/loading-spinner.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconCashPlus,
  IconCoinFilled,
  IconDownload,
  IconLock,
  IconSettings,
  IconShieldLock,
  IconWallet,
} from "@tabler/icons-react";
import { toDecimals } from "@colibri/core";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/popup/atoms/sidebar.tsx";
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
    initializing?: boolean;
    loading: boolean;
    refreshing?: boolean;
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
  onAddPrivacyProvider?: (
    channelId: string,
    name: string,
    url: string,
  ) => Promise<void>;
  onRemovePrivacyProvider?: (
    channelId: string,
    providerId: string,
  ) => Promise<void>;
  onSelectPrivacyProvider?: (
    channelId: string,
    providerId: string | undefined,
  ) => Promise<void>;

  activation?: {
    status: "created" | "not_created" | "unknown";
    canUseFriendbot: boolean;
    checking: boolean;
    funding: boolean;
    error?: string;
  };
  onFundWithFriendbot?: () => void | Promise<void>;

  accountPickerOpen: boolean;
  setAccountPickerOpen: (v: boolean | ((v: boolean) => boolean)) => void;

  channelPickerOpen?: boolean;
  setChannelPickerOpen?: (v: boolean | ((v: boolean) => boolean)) => void;
  isConnected?: boolean;

  rowMenuOpenFor: string | undefined;
  setRowMenuOpenFor: (
    v: string | undefined | ((v: string | undefined) => string | undefined),
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
  const isInitialized = props.viewMode === "public" &&
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
    props.viewMode === "private" && props.privateChannels?.selectedChannelId
      ? props.privateChannels.channels.find(
        (c) => c.id === props.privateChannels?.selectedChannelId,
      )
      : undefined;

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="offcanvas" variant="floating">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={props.goImport} tooltip="Import">
                    <IconDownload />
                    <span>Import</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={props.goSettings}
                    tooltip="Settings"
                  >
                    <IconSettings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={props.onLockFromMenu}
                    tooltip="Lock wallet"
                    className="text-destructive hover:text-destructive"
                  >
                    <IconLock />
                    <span>Lock wallet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <Shell>
        <div className="relative">
          <HomeHeader
            selectedNetworkLabel={selectedNetworkLabel}
            viewMode={props.viewMode}
            onToggleViewMode={props.onToggleViewMode}
            viewModeToggleDisabled={props.viewModeToggleDisabled}
            headerKeyName={header.keyName}
            headerAddressShort={header.addressShort}
            accountPicker={
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
            }
            accountPickerOpen={props.accountPickerOpen}
            onToggleAccountPicker={(open) => props.setAccountPickerOpen(open)}
            channelName={selectedPrivateChannel?.name}
            isConnected={props.isConnected}
            channelPickerOpen={props.channelPickerOpen}
            onToggleChannelPicker={(open) => props.setChannelPickerOpen?.(open)}
            channelPicker={
              <PrivateChannelManager
                channels={props.privateChannels?.channels ?? []}
                selectedChannelId={props.privateChannels?.selectedChannelId}
                accountId={props.selectedAccount?.accountId}
                onSelectChannel={(id) => {
                  props.onSelectPrivateChannel?.(id);
                }}
                onAddChannel={() => {
                  props.onAddPrivateChannel?.();
                  props.setChannelPickerOpen?.(false);
                }}
                onAddProvider={async (channelId, name, url) => {
                  await props.onAddPrivacyProvider?.(channelId, name, url);
                }}
                onRemoveProvider={async (channelId, providerId) => {
                  await props.onRemovePrivacyProvider?.(channelId, providerId);
                }}
                onSelectProvider={async (channelId, providerId) => {
                  await props.onSelectPrivacyProvider?.(channelId, providerId);
                }}
              />
            }
          />

          {props.viewMode === "public" && isInitialized && (
            <div className="mt-6 flex flex-col h-full">
              {/* Hero Private Balance Section - Main Focus */}
              <div className="text-center animate-fade-in-up mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <IconShieldLock className="h-4 w-4 text-secondary" />
                  <p className="text-xs font-semibold text-secondary uppercase tracking-widest">
                    Private Balance
                  </p>
                </div>
                <div className="flex items-baseline justify-center gap-2">
                  <span
                    className="text-5xl font-extrabold tracking-tight"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.70 0.22 300) 0%, oklch(0.55 0.20 300) 50%, oklch(0.75 0.18 45) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    0.00
                  </span>
                  <span className="text-lg font-bold text-foreground/40 uppercase">
                    XLM
                  </span>
                </div>
                {/* Decorative line */}
                <div className="mt-4 mx-auto w-24 h-0.5 rounded-full bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
              </div>

              {/* Public Balance - Secondary Display */}
              <div
                className="animate-fade-in-up mb-6"
                style={{ animationDelay: "0.1s" }}
              >
                <div
                  className="p-4 rounded-2xl"
                  style={{
                    background: "oklch(0.15 0.03 265 / 0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid oklch(1 0 0 / 0.06)",
                    boxShadow: "0 4px 24px oklch(0 0 0 / 0.2)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.75 0.18 45 / 0.2) 0%, oklch(0.65 0.16 40 / 0.1) 100%)",
                          border: "1px solid oklch(0.75 0.18 45 / 0.15)",
                        }}
                      >
                        <IconWallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground/90">
                          Public Balance
                        </p>
                        <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">
                          On-chain
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xl font-extrabold text-gradient-moonlight">
                        {props.selectedChain?.balanceXlm
                          ? toDecimals(
                            BigInt(props.selectedChain.balanceXlm),
                            7,
                          )
                          : "0.00"}
                      </p>
                      <p className="text-xs font-medium text-foreground/40">
                        XLM
                      </p>
                      {props.selectedChain?.syncing && (
                        <Spinner className="ml-1 size-3" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div
                className="grid grid-cols-3 gap-2 animate-fade-in-up mb-4"
                style={{ animationDelay: "0.15s" }}
              >
                {[
                  { icon: IconArrowDownLeft, label: "Receive" },
                  { icon: IconArrowUpRight, label: "Send" },
                  { icon: IconCoinFilled, label: "Ramp" },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="group flex flex-col items-center gap-2 py-4 px-2 rounded-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "oklch(0.18 0.03 265 / 0.6)",
                      border: "1px solid oklch(1 0 0 / 0.06)",
                    }}
                    onClick={() => {}}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.75 0.18 45) 0%, oklch(0.65 0.16 40) 100%)",
                        boxShadow: "0 4px 12px oklch(0.75 0.18 45 / 0.3)",
                      }}
                    >
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-foreground/70 group-hover:text-foreground/90 transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Deposit Button - Distinct CTA */}
              <div
                className="animate-fade-in-up mt-auto"
                style={{ animationDelay: "0.2s" }}
              >
                <button
                  type="button"
                  className="w-full py-3.5 px-5 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.15) 0%, oklch(0.45 0.18 280 / 0.08) 100%)",
                    border: "1px solid oklch(0.55 0.20 300 / 0.25)",
                  }}
                  onClick={() => {}}
                >
                  <IconDownload className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-bold text-secondary">
                    Deposit to Private
                  </span>
                </button>
              </div>
            </div>
          )}

          {props.viewMode === "private"
            ? (
              <div className="mt-4 space-y-4">
                {/* Error state (only if no channels to show) */}
                {props.privateChannels?.error &&
                    (props.privateChannels?.channels?.length ?? 0) === 0 &&
                    !props.privateChannels?.initializing
                  ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-destructive">
                          Failed to load channels
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {props.privateChannels.error}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          uiSize="sm"
                          className="w-full"
                          onClick={() => props.onAddPrivateChannel?.()}
                          disabled={!props.onAddPrivateChannel}
                        >
                          Add channel
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                  : (props.privateChannels?.channels?.length ?? 0) === 0 &&
                      !props.privateChannels?.initializing
                  ? (
                    // Only show "No channels" when we've finished loading and truly have none
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          No channels yet
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Add a channel to start using private mode.
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          uiSize="sm"
                          className="w-full"
                          onClick={() => props.onAddPrivateChannel?.()}
                          disabled={!props.onAddPrivateChannel}
                        >
                          Add channel
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                  : (props.privateChannels?.channels?.length ?? 0) > 0
                  ? (
                    <>
                      {selectedPrivateChannel
                        ? (
                          <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-2">
                              <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2">
                                  <IconShieldLock className="h-5 w-5 text-primary" />
                                  Private Channel
                                  {/* Small spinner in header when loading */}
                                  {props.privateStats?.loading && (
                                    <Spinner className="size-3 text-muted-foreground" />
                                  )}
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {selectedPrivateChannel.asset.code}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {props.privateStats?.error &&
                                  !props.privateStats?.stats
                                ? (
                                  <p className="text-sm text-destructive">
                                    {props.privateStats.error}
                                  </p>
                                )
                                : (
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-sm text-muted-foreground font-medium">
                                        Confidential Balance
                                      </span>
                                      <span className="text-2xl font-black text-primary">
                                        {props.privateStats?.stats
                                          ? toDecimals(
                                            BigInt(
                                              props.privateStats.stats
                                                .totalBalance ||
                                                "0",
                                            ),
                                            7,
                                          )
                                          : "-"}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-primary/10">
                                      <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                          Derived UTXOs
                                        </p>
                                        <p className="text-sm font-bold">
                                          {props.privateStats?.stats
                                            ? `${props.privateStats.stats.derivedCount} / ${props.privateStats.stats.targetCount}`
                                            : "-"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                                          Non-zero UTXOs
                                        </p>
                                        <p className="text-sm font-bold">
                                          {props.privateStats?.stats
                                            ? props.privateStats.stats
                                              .nonZeroCount
                                            : "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </CardContent>
                          </Card>
                        )
                        : (
                          <Card>
                            <CardContent className="pt-6 text-center">
                              <p className="text-sm text-muted-foreground">
                                Select a channel from the header to view
                                details.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                    </>
                  )
                  : null}
              </div>
            )
            : null}

          {props.viewMode === "public" &&
              props.selectedAccount &&
              props.activation &&
              !isInitialized &&
              props.activation.status !== "created"
            ? (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <IconCashPlus className="h-5 w-5" />
                    Initialize Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  {props.activation.checking || props.activation.funding
                    ? (
                      <LoadingSpinner
                        uiSize="md"
                        message={props.activation.funding
                          ? "Initializing…"
                          : undefined}
                        className="py-6"
                      />
                    )
                    : props.activation.status === "not_created"
                    ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          This account isn&apos;t initialized yet.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          It needs funds to exist on-chain and hold public
                          balances.
                        </p>
                        {props.activation.canUseFriendbot
                          ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              You can create it with Friendbot.
                            </p>
                          )
                          : null}
                      </>
                    )
                    : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Couldn&apos;t verify whether this account is
                          initialized.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Public balances may be unavailable until this check
                          succeeds.
                        </p>
                      </>
                    )}
                  {props.activation.error
                    ? (
                      <p className="mt-1 text-sm text-error">
                        {props.activation.error}
                      </p>
                    )
                    : null}
                </CardContent>
                {props.activation.status === "not_created" &&
                    props.activation.canUseFriendbot &&
                    props.onFundWithFriendbot
                  ? (
                    <CardFooter>
                      <Button
                        uiSize="lg"
                        className="w-full"
                        onClick={() => props.onFundWithFriendbot?.()}
                        loading={props.activation.funding}
                        disabled={props.activation.checking}
                      >
                        {props.activation.funding
                          ? "Initializing…"
                          : "Initialize with 10,000 XLM"}
                      </Button>
                    </CardFooter>
                  )
                  : null}
              </Card>
            )
            : null}

          {/* HomeMenuDrawer removed as it is replaced by NavigationMenu in HomeHeader */}
        </div>
      </Shell>
    </SidebarProvider>
  );
}
