import { chain } from "@/background/session.ts";
import { chainKey } from "@/persistence/stores/chain.ts";
import type {
  ChainAccountState,
  ChainNetwork,
} from "@/persistence/stores/chain.types.ts";
import { PrioritySyncQueue } from "@/background/chain/queue.ts";
import { fetchStellarAssetBalance } from "../contexts/chain/fetch-balance.ts";
import { getNetworkConfig } from "../contexts/chain/network.ts";
import { StrKey, type Ed25519PublicKey } from "@colibri/core";

type SyncItem = {
  network: ChainNetwork;
  publicKey: string;
  priority: boolean;
};

const CONCURRENCY_LIMIT = 2;
const STALE_TTL_MS = 60_000;

const queue = new PrioritySyncQueue({ concurrencyLimit: CONCURRENCY_LIMIT });

function isStale(state?: ChainAccountState): boolean {
  if (!state?.updatedAt) return true;
  return Date.now() - state.updatedAt > STALE_TTL_MS;
}

function parseKey(key: string): { network: ChainNetwork; publicKey: string } {
  const idx = key.indexOf(":");
  if (idx === -1) {
    throw new Error("Invalid chain key");
  }
  return {
    network: key.slice(0, idx) as ChainNetwork,
    publicKey: key.slice(idx + 1),
  };
}

async function runOne(params: { network: ChainNetwork; publicKey: string }) {
  const now = Date.now();
  const key = chainKey(params);
  const existing = chain.store.getValue().accounts[key];

  chain.setAccountPartial(params, {
    error: undefined,
    initialized: existing?.initialized ?? false,
    assets: existing?.assets ?? [{ code: "XLM" }],
  });

  try {
    const networkConfig = getNetworkConfig(params.network);
    if (!StrKey.isValidEd25519PublicKey(params.publicKey)) {
      throw new Error("Invalid public key");
    }

    const balance = await fetchStellarAssetBalance(
      networkConfig,
      { code: "XLM", issuer: undefined as never },
      params.publicKey as Ed25519PublicKey
    );

    // NOTE: Previously sourced from Horizon. We intentionally avoid Horizon now.
    const sequence = undefined;
    chain.setAccountPartial(params, {
      initialized: true,
      created: true,
      createdConfirmed: true,
      balanceXlm: balance.toString(),
      sequence,
      updatedAt: now,
      error: undefined,
    });
    await chain.flush();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Keep last good value; just mark error.
    chain.setAccountPartial(params, { error: message, updatedAt: now });
    await chain.flush();
  }
}

export function getChainState(params: {
  network: ChainNetwork;
  publicKey: string;
}): {
  state: ChainAccountState;
  stale: boolean;
  syncing: boolean;
} {
  const key = chainKey(params);
  const all = chain.store.getValue();
  const existing = all.accounts[key];

  const state: ChainAccountState =
    existing ??
    ({
      network: params.network,
      publicKey: params.publicKey,
    } satisfies ChainAccountState);

  return {
    state,
    stale: isStale(state),
    syncing: queue.isSyncing(key),
  };
}

export function enqueueSync(
  items: SyncItem[],
  options?: { onlyIfStale?: boolean }
) {
  const onlyIfStale = options?.onlyIfStale ?? true;

  for (const item of items) {
    const key = chainKey(item);
    const { state } = getChainState(item);

    if (onlyIfStale && !isStale(state)) continue;

    // If custom, mark error and skip.
    if (item.network === "custom") {
      chain.setAccountPartial(item, { error: "Custom network not supported" });
      continue;
    }

    queue.enqueue(key, item.priority);
  }

  queue.drain(async (key) => {
    const params = parseKey(key);
    await runOne(params);
  });
}
