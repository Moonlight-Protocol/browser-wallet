import { useEffect, useMemo, useRef, useState } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { HomeTemplate } from "@/popup/templates/home-template.tsx";
import { setSelectedAccount } from "@/popup/api/set-selected-account.ts";
import { deriveAccount } from "@/popup/api/derive-account.ts";
import { renameAccount } from "@/popup/api/rename-account.ts";
import { lock } from "@/popup/api/lock.ts";
import { getChainState } from "@/popup/api/get-chain-state.ts";
import { syncChainState } from "@/popup/api/sync-chain-state.ts";
import { getAccountActivationStatus } from "@/popup/api/get-account-activation-status.ts";
import { fundWithFriendbot } from "@/popup/api/fund-with-friendbot.ts";
import { setViewMode } from "@/popup/api/set-view-mode.ts";
import { getPrivateChannels } from "@/popup/api/get-private-channels.ts";
import { setSelectedPrivateChannel } from "@/popup/api/set-selected-private-channel.ts";
import { ensurePrivateChannelTracking } from "@/popup/api/ensure-private-channel-tracking.ts";
import type { SafeAccount } from "@/background/handlers/accounts/get-accounts.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import type { PrivateChannelStats } from "@/persistence/stores/private-utxos.types.ts";
import type { Ed25519PublicKey } from "@colibri/core";

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

  const [selectedChain, setSelectedChain] = useState<
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
    | undefined
  >(undefined);

  const [activation, setActivation] = useState<
    | {
        status: "created" | "not_created" | "unknown";
        canUseFriendbot: boolean;
        checking: boolean;
        funding: boolean;
        error?: string;
      }
    | undefined
  >(undefined);

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

  const selectedNetwork = (status?.lastSelectedNetwork ??
    "mainnet") as ChainNetwork;

  const viewMode = status?.viewMode ?? "public";
  const [viewModeBusy, setViewModeBusy] = useState(false);

  const [privateChannels, setPrivateChannels] = useState<
    | {
        loading: boolean;
        error?: string;
        channels: PrivateChannel[];
        selectedChannelId?: string;
      }
    | undefined
  >(undefined);

  const [privateView, setPrivateView] = useState<"list" | "selected">("list");

  const [privateStats, setPrivateStats] = useState<
    | {
        loading: boolean;
        error?: string;
        stats?: PrivateChannelStats;
      }
    | undefined
  >(undefined);

  const lastPrivateStatsKeyRef = useRef<string | undefined>(undefined);

  const readSelectedChain = async (params: {
    network: ChainNetwork;
    publicKey: Ed25519PublicKey;
  }) => {
    const res = await getChainState(params);
    setSelectedChain({
      initialized: res.state.initialized,
      balanceXlm: res.state.balanceXlm,
      sequence: res.state.sequence,
      created: res.state.created,
      createdConfirmed: res.state.createdConfirmed,
      error: res.state.error,
      syncing: res.syncing,
      stale: res.stale,
    });
    return res;
  };

  const refreshActivation = async (params: {
    network: ChainNetwork;
    publicKey: Ed25519PublicKey;
  }) => {
    setActivation((prev) => ({
      status: "unknown",
      canUseFriendbot: prev?.canUseFriendbot ?? false,
      checking: true,
      funding: prev?.funding ?? false,
      error: undefined,
    }));

    try {
      const res = await getAccountActivationStatus(params);
      if ("error" in res) {
        setActivation((prev) => ({
          status: res.status,
          canUseFriendbot: res.canUseFriendbot,
          checking: false,
          funding: prev?.funding ?? false,
          error: res.error.message ?? "Failed to check account status",
        }));
        return;
      }

      setActivation((prev) => ({
        status: res.status,
        canUseFriendbot: res.canUseFriendbot,
        checking: false,
        funding: prev?.funding ?? false,
        error: undefined,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActivation((prev) => ({
        status: prev?.status ?? "unknown",
        canUseFriendbot: prev?.canUseFriendbot ?? false,
        checking: false,
        funding: prev?.funding ?? false,
        error: msg,
      }));
    }
  };

  useEffect(() => {
    let cancelled = false;

    const network = selectedNetwork as ChainNetwork;
    const selectedPk = selectedAccount?.publicKey;

    if (viewMode !== "public") {
      setSelectedChain(undefined);
      setActivation(undefined);
      return;
    }

    if (!selectedPk) {
      setSelectedChain(undefined);
      setActivation(undefined);
      return;
    }

    const items = accounts
      .map((a) => ({
        network,
        publicKey: a.publicKey,
        priority: a.publicKey === selectedPk,
      }))
      .filter((i) => Boolean(i.publicKey));

    const refreshSelected = async () => {
      const res = await readSelectedChain({ network, publicKey: selectedPk });
      if (cancelled) return;

      // While syncing/queued, poll to pick up the refreshed value.
      if (!res.syncing) return;

      const startedAt = Date.now();
      const timer = setInterval(async () => {
        try {
          const next = await getChainState({ network, publicKey: selectedPk });
          if (cancelled) return;
          setSelectedChain({
            initialized: next.state.initialized,
            balanceXlm: next.state.balanceXlm,
            sequence: next.state.sequence,
            created: next.state.created,
            createdConfirmed: next.state.createdConfirmed,
            error: next.state.error,
            syncing: next.syncing,
            stale: next.stale,
          });

          const done = !next.syncing;
          const timedOut = Date.now() - startedAt > 15_000;
          if (done || timedOut) {
            clearInterval(timer);
          }
        } catch {
          // Ignore polling errors.
        }
      }, 1500);
    };

    (async () => {
      try {
        // 1) Read cached selected state immediately.
        await refreshSelected();

        // 1b) Read activation status only if not already confirmed created.
        const cached = await getChainState({ network, publicKey: selectedPk });
        if (cached.state.createdConfirmed !== true) {
          try {
            await refreshActivation({ network, publicKey: selectedPk });
            // If the check confirmed creation, the background persisted it.
            // Re-read so UI can stop checking in the future.
            await refreshSelected();
          } catch {
            // Non-fatal.
          }
        }

        // 2) Enqueue a priority sync for selected + normal sync for other stale.
        await syncChainState({ items, onlyIfStale: true });

        // 3) Re-read to reflect queued/syncing flags right away.
        await refreshSelected();
      } catch {
        // Non-fatal; balances are best-effort.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewMode, selectedNetwork, selectedAccount?.publicKey, accounts]);

  useEffect(() => {
    let cancelled = false;

    const network = selectedNetwork as ChainNetwork;

    if (viewMode !== "private") {
      setPrivateChannels(undefined);
      setPrivateView("list");
      setPrivateStats(undefined);
      return;
    }

    setPrivateChannels((prev) => ({
      loading: true,
      channels: prev?.channels ?? [],
      selectedChannelId: prev?.selectedChannelId,
      error: undefined,
    }));

    // Reset view to default; we'll re-select after fetching.
    setPrivateView("list");

    (async () => {
      try {
        const res = await getPrivateChannels({ network });
        if (cancelled) return;

        if (!res.ok) {
          setPrivateChannels({
            loading: false,
            channels: [],
            selectedChannelId: undefined,
            error: res.error.message ?? "Failed to load channels",
          });
          return;
        }

        setPrivateChannels({
          loading: false,
          channels: res.channels,
          selectedChannelId: res.selectedChannelId,
          error: undefined,
        });

        const hasSelected = Boolean(
          res.selectedChannelId &&
            res.channels.some((c) => c.id === res.selectedChannelId),
        );
        setPrivateView(hasSelected ? "selected" : "list");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setPrivateChannels({
          loading: false,
          channels: [],
          selectedChannelId: undefined,
          error: message,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewMode, selectedNetwork]);

  // If we enter private mode and a channel is already selected, kick off the
  // tracking sync automatically so the stats spinner can complete.
  useEffect(() => {
    let cancelled = false;

    if (viewMode !== "private") return;

    const network = selectedNetwork as ChainNetwork;
    const channelId = privateChannels?.selectedChannelId;
    const accountId = selectedAccount?.accountId;
    if (!channelId || !accountId) return;

    const key = `${network}:${accountId}:${channelId}`;
    const alreadyHaveStats = Boolean(privateStats?.stats);
    const alreadyLoadingThis = privateStats?.loading && lastPrivateStatsKeyRef.current === key;

    // If we already loaded stats for this selection, don't re-run.
    if (alreadyHaveStats && lastPrivateStatsKeyRef.current === key) return;
    if (alreadyLoadingThis) return;

    lastPrivateStatsKeyRef.current = key;
    setPrivateStats({ loading: true, error: undefined, stats: undefined });

    (async () => {
      try {
        const ensured = await ensurePrivateChannelTracking({
          network,
          accountId,
          channelId,
          targetUtxos: 300,
        });
        if (cancelled) return;

        if (ensured.ok) {
          setPrivateStats({ loading: false, error: undefined, stats: ensured.stats });
        } else {
          setPrivateStats({
            loading: false,
            error:
              ensured.error.message ?? "Failed to prepare private tracking",
            stats: undefined,
          });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setPrivateStats({
          loading: false,
          error: message || "Failed to prepare private tracking",
          stats: undefined,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    viewMode,
    selectedNetwork,
    privateChannels?.selectedChannelId,
    selectedAccount?.accountId,
  ]);

  const onToggleViewMode = async () => {
    const next = viewMode === "public" ? "private" : "public";
    setViewModeBusy(true);
    try {
      await setViewMode({ viewMode: next });
      await actions.refreshStatus();
    } finally {
      setViewModeBusy(false);
    }
  };

  const onSelectPrivateChannel = async (channelId: string) => {
    const network = selectedNetwork as ChainNetwork;
    try {
      setAccountPickerOpen(false);

      // Ensure we have a tracking record for this (account, channel).
      const accountId = selectedAccount?.accountId;
      if (accountId) {
        setPrivateStats({ loading: true, error: undefined, stats: undefined });
        try {
          const ensured = await ensurePrivateChannelTracking({
            network,
            accountId,
            channelId,
            targetUtxos: 300,
          });

          if (ensured.ok) {
            setPrivateStats({
              loading: false,
              error: undefined,
              stats: ensured.stats,
            });
          } else {
            setPrivateStats({
              loading: false,
              error:
                ensured.error.message ?? "Failed to prepare private tracking",
              stats: undefined,
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setPrivateStats({
            loading: false,
            error: message || "Failed to prepare private tracking",
            stats: undefined,
          });
        }
      }

      const res = await setSelectedPrivateChannel({ network, channelId });
      if (!res.ok) return;
      const next = await getPrivateChannels({ network });
      if (!next.ok) return;
      setPrivateChannels({
        loading: false,
        channels: next.channels,
        selectedChannelId: next.selectedChannelId,
      });
      setPrivateView("selected");
    } catch (err) {
      // Keep UI responsive; don't leave spinners running forever.
      if (privateStats?.loading) {
        const message = err instanceof Error ? err.message : String(err);
        setPrivateStats({
          loading: false,
          error: message || "Failed to select private channel",
          stats: undefined,
        });
      }
    }
  };

  const onFundWithFriendbot = async () => {
    const network = selectedNetwork as ChainNetwork;
    const pk = selectedAccount?.publicKey as Ed25519PublicKey | undefined;
    if (!pk) return;

    setActivation((prev) =>
      prev
        ? { ...prev, funding: true, error: undefined }
        : {
            status: "unknown",
            canUseFriendbot: false,
            checking: false,
            funding: true,
            error: undefined,
          }
    );

    try {
      await fundWithFriendbot({ network, publicKey: pk });

      await syncChainState({
        items: [{ network, publicKey: pk, priority: true }],
        onlyIfStale: false,
      });

      // Re-read cached chain state immediately.
      try {
        await readSelectedChain({ network, publicKey: pk });
      } catch {
        // Ignore.
      }

      // Wait briefly for the background sync to produce a confirmed state.
      // This avoids holding an explicit "checking" message while still giving
      // the UI a reliable update.
      const startedAt = Date.now();
      const timeoutMs = 15_000;
      const pollMs = 750;

      while (Date.now() - startedAt < timeoutMs) {
        const res = await getChainState({ network, publicKey: pk });
        setSelectedChain({
          initialized: res.state.initialized,
          balanceXlm: res.state.balanceXlm,
          sequence: res.state.sequence,
          created: res.state.created,
          createdConfirmed: res.state.createdConfirmed,
          error: res.state.error,
          syncing: res.syncing,
          stale: res.stale,
        });

        const done =
          res.state.createdConfirmed === true || res.state.initialized === true;
        if (done) break;

        await new Promise((r) => setTimeout(r, pollMs));
      }

      // Final activation check to persist createdConfirmed in the background
      // if RPC is available; non-fatal if it fails.
      try {
        await refreshActivation({ network, publicKey: pk });
      } catch {
        // Ignore.
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActivation((prev) =>
        prev
          ? { ...prev, funding: false, error: msg }
          : {
              status: "unknown",
              canUseFriendbot: false,
              checking: false,
              funding: false,
              error: msg,
            }
      );
      return;
    }

    setActivation((prev) => (prev ? { ...prev, funding: false } : prev));
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

  const onLockFromMenu = async () => {
    setActionError(undefined);
    setActionBusy(true);
    try {
      await lock();
      await actions.refreshStatus();
      setMenuOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <HomeTemplate
      selectedAccount={selectedAccount}
      selectedNetwork={selectedNetwork}
      customNetworkName={status?.customNetworkName}
      selectedChain={selectedChain}
      viewMode={viewMode}
      onToggleViewMode={onToggleViewMode}
      viewModeToggleDisabled={viewModeBusy}
      privateChannels={privateChannels}
      privateView={privateView}
      setPrivateView={setPrivateView}
      privateStats={privateStats}
      onAddPrivateChannel={() => actions.goPrivateAddChannel()}
      onSelectPrivateChannel={onSelectPrivateChannel}
      activation={activation}
      onFundWithFriendbot={onFundWithFriendbot}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
      accountPickerOpen={accountPickerOpen}
      setAccountPickerOpen={setAccountPickerOpen}
      rowMenuOpenFor={rowMenuOpenFor}
      setRowMenuOpenFor={setRowMenuOpenFor}
      editingAccountId={editingAccountId}
      setEditingAccountId={setEditingAccountId}
      editingName={editingName}
      setEditingName={setEditingName}
      actionBusy={actionBusy}
      actionError={actionError}
      keyGroups={keyGroups}
      canDeriveNew={canDeriveNew}
      onSelectAccount={onSelectAccount}
      startRename={startRename}
      cancelRename={cancelRename}
      confirmRename={confirmRename}
      onCreateNew={onCreateNew}
      onLockFromMenu={onLockFromMenu}
      goImport={() => actions.goImport()}
      goSettings={() => actions.goSettings()}
    />
  );
}
