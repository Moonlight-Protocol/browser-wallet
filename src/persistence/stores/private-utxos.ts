import { PersistedStore } from "@/persistence/store.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import type {
  PrivateChannelStats,
  PrivateChannelTracking,
  PrivateUtxosState,
} from "@/persistence/stores/private-utxos.types.ts";

const DEFAULT_PRIVATE_UTXOS_STATE: PrivateUtxosState = {
  version: 1,
  byKey: {},
};

export function privateUtxosKey(params: {
  network: ChainNetwork;
  accountId: string;
  channelId: string;
}): string {
  return `${params.network}:${params.accountId}:${params.channelId}`;
}

function toStats(tracking: PrivateChannelTracking): PrivateChannelStats {
  const derived = tracking.utxos.filter((u) => u.status !== "empty");
  const derivedCount = derived.length;
  const nonZeroCount =
    tracking.nonZeroCount ??
    derived.filter((u) => {
      const v = u.balance;
      if (!v) return false;
      try {
        return BigInt(v) > 0n;
      } catch {
        return v !== "0";
      }
    }).length;

  return {
    targetCount: tracking.targetCount,
    derivedCount,
    nonZeroCount,
    totalBalance: tracking.totalBalance ?? "0",
    updatedAt: tracking.updatedAt,
  };
}

function ensureUtxoSlots(
  utxos: PrivateChannelTracking["utxos"],
  target: number
) {
  if (utxos.length >= target) return utxos;
  const next = [...utxos];
  for (let i = next.length; i < target; i++) {
    next.push({ index: i, status: "empty" });
  }
  return next;
}

function computeTotals(utxos: PrivateChannelTracking["utxos"]) {
  let nonZeroCount = 0;
  let total = 0n;
  for (const u of utxos) {
    if (!u.balance) continue;
    let v: bigint;
    try {
      v = BigInt(u.balance);
    } catch {
      continue;
    }
    if (v > 0n) {
      nonZeroCount++;
      total += v;
    }
  }
  return { nonZeroCount, totalBalance: total.toString() };
}

export class PrivateUtxosStore extends PersistedStore<PrivateUtxosState> {
  constructor() {
    super("private-utxos", DEFAULT_PRIVATE_UTXOS_STATE, {
      storageKey: "private-utxos@store",
      persist: true,
    });
  }

  ensureTracking(params: {
    network: ChainNetwork;
    accountId: string;
    channelId: string;
    contractId: string;
    quorumContractId: string;
    asset: { code: string; issuer?: string };
    targetCount: number;
  }): PrivateChannelTracking {
    const key = privateUtxosKey(params);
    const now = Date.now();

    const existing = this.store.getValue().byKey[key];
    if (existing) {
      // Keep it up to date if channel metadata changed.
      const targetCount = Math.max(existing.targetCount, params.targetCount);
      const next: PrivateChannelTracking = {
        ...existing,
        contractId: params.contractId,
        quorumContractId: params.quorumContractId,
        asset: params.asset,
        targetCount,
        utxos: ensureUtxoSlots(existing.utxos, targetCount),
        updatedAt: now,
      };
      this.store.update((prev) => ({
        ...prev,
        byKey: { ...prev.byKey, [key]: next },
      }));
      return next;
    }

    const next: PrivateChannelTracking = {
      network: params.network,
      accountId: params.accountId,
      channelId: params.channelId,
      contractId: params.contractId,
      quorumContractId: params.quorumContractId,
      asset: params.asset,
      targetCount: params.targetCount,
      nextIndex: 0,
      utxos: ensureUtxoSlots([], params.targetCount),
      createdAt: now,
      updatedAt: now,
      totalBalance: "0",
      nonZeroCount: 0,
    };

    this.store.update((prev) => ({
      ...prev,
      byKey: { ...prev.byKey, [key]: next },
    }));

    return next;
  }

  getTracking(params: {
    network: ChainNetwork;
    accountId: string;
    channelId: string;
  }): PrivateChannelTracking | undefined {
    const key = privateUtxosKey(params);
    return this.store.getValue().byKey[key];
  }

  applyMoonlightSnapshot(params: {
    network: ChainNetwork;
    accountId: string;
    channelId: string;
    targetCount: number;
    utxos: Array<{
      index: number;
      utxoPublicKey: string;
      balance: string;
    }>;
    nextIndex: number;
  }): PrivateChannelTracking {
    const key = privateUtxosKey(params);
    const existing = this.store.getValue().byKey[key];
    if (!existing) {
      throw new Error("Tracking record does not exist");
    }

    const now = Date.now();
    const targetCount = Math.max(existing.targetCount, params.targetCount);

    const nextUtxos = ensureUtxoSlots([], targetCount);
    for (const u of params.utxos) {
      if (u.index < 0 || u.index >= targetCount) continue;
      const balanceBigInt = (() => {
        try {
          return BigInt(u.balance);
        } catch {
          return 0n;
        }
      })();

      nextUtxos[u.index] = {
        index: u.index,
        utxoPublicKey: u.utxoPublicKey,
        balance: u.balance,
        status: balanceBigInt === 0n ? "spent" : "derived",
        updatedAt: now,
      };
    }

    const totals = computeTotals(nextUtxos);
    const next: PrivateChannelTracking = {
      ...existing,
      targetCount,
      nextIndex: Math.max(existing.nextIndex, params.nextIndex),
      utxos: nextUtxos,
      totalBalance: totals.totalBalance,
      nonZeroCount: totals.nonZeroCount,
      updatedAt: now,
    };

    this.store.update((prev) => ({
      ...prev,
      byKey: { ...prev.byKey, [key]: next },
    }));

    return next;
  }

  getStats(params: {
    network: ChainNetwork;
    accountId: string;
    channelId: string;
  }): PrivateChannelStats | undefined {
    const key = privateUtxosKey(params);
    const tracking = this.store.getValue().byKey[key];
    if (!tracking) return undefined;
    return toStats(tracking);
  }
}
