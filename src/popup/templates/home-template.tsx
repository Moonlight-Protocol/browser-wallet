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
  IconCashPlus,
  IconDownload,
  IconSettings,
  IconLock,
  IconWallet,
  IconShieldLock,
} from "@tabler/icons-react";
import { cn } from "@/popup/utils/cn.ts";
import { toDecimals } from "@colibri/core";
import { ChevronDownIcon } from "@/popup/icons/index.tsx";
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
    url: string
  ) => Promise<void>;
  onRemovePrivacyProvider?: (
    channelId: string,
    providerId: string
  ) => Promise<void>;
  onSelectPrivacyProvider?: (
    channelId: string,
    providerId: string | undefined
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
    props.viewMode === "private" && props.privateChannels?.selectedChannelId
      ? props.privateChannels.channels.find(
          (c) => c.id === props.privateChannels?.selectedChannelId
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
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconWallet className="h-5 w-5" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {props.selectedChain?.balanceXlm
                      ? toDecimals(BigInt(props.selectedChain.balanceXlm), 7)
                      : "0.00"}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    XLM
                  </span>
                  {props.selectedChain?.syncing && (
                    <Spinner className="ml-2 size-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {props.viewMode === "private" ? (
            <div className="mt-4 space-y-4">
              {/* Error state (only if no channels to show) */}
              {props.privateChannels?.error &&
              (props.privateChannels?.channels?.length ?? 0) === 0 &&
              !props.privateChannels?.initializing ? (
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
              ) : (props.privateChannels?.channels?.length ?? 0) === 0 &&
                !props.privateChannels?.initializing ? (
                // Only show "No channels" when we've finished loading and truly have none
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">No channels yet</CardTitle>
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
              ) : (props.privateChannels?.channels?.length ?? 0) > 0 ? (
                <>
                  {selectedPrivateChannel ? (
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
                        !props.privateStats?.stats ? (
                          <p className="text-sm text-destructive">
                            {props.privateStats.error}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm text-muted-foreground font-medium">
                                Confidential Balance
                              </span>
                              <span className="text-2xl font-black text-primary">
                                {props.privateStats?.stats
                                  ? toDecimals(
                                      BigInt(
                                        props.privateStats.stats.totalBalance ||
                                          "0"
                                      ),
                                      7
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
                                    ? props.privateStats.stats.nonZeroCount
                                    : "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          Select a channel from the header to view details.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          {props.viewMode === "public" &&
          props.selectedAccount &&
          props.activation &&
          !isInitialized &&
          props.activation.status !== "created" ? (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <IconCashPlus className="h-5 w-5" />
                  Initialize Account
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
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
                    <p className="text-sm text-muted-foreground">
                      This account isn&apos;t initialized yet.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      It needs funds to exist on-chain and hold public balances.
                    </p>
                    {props.activation.canUseFriendbot ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        You can create it with Friendbot.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Couldn&apos;t verify whether this account is initialized.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
              </CardContent>
              {props.activation.status === "not_created" &&
              props.activation.canUseFriendbot &&
              props.onFundWithFriendbot ? (
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
              ) : null}
            </Card>
          ) : null}

          {/* HomeMenuDrawer removed as it is replaced by NavigationMenu in HomeHeader */}
        </div>
      </Shell>
    </SidebarProvider>
  );
}
