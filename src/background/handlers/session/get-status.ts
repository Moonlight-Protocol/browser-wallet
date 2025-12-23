import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { isUnlocked, meta } from "@/background/session.ts";
import browser from "webextension-polyfill";

const SALT_STORAGE_KEY = "vault.crypto.salt";
const VAULT_STORAGE_KEY = "vault@store";

type StoredMeta = {
  passwordSet?: boolean;
  viewMode?: "public" | "private";
  lastSelectedNetwork?: "mainnet" | "testnet" | "futurenet" | "custom";
  customNetworkName?: string;
  mainKey?: {
    walletId: string;
    accountId: string;
  };
  lastSelectedAccount?: {
    walletId: string;
    accountId: string;
  };
};

async function readMetaFromStorage(): Promise<StoredMeta | undefined> {
  try {
    const result = await browser.storage.local.get("meta@store");
    const raw = result["meta@store"];
    if (!raw) return undefined;

    // Be resilient to older persisted shapes (object) or wrapped state.
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return undefined;

    const maybeWrapped = parsed as { state?: unknown };
    const unwrapped =
      maybeWrapped.state && typeof maybeWrapped.state === "object"
        ? maybeWrapped.state
        : parsed;

    return unwrapped as StoredMeta;
  } catch {
    return undefined;
  }
}

export const handleGetStatus = async (
  _message: MessageFor<MessageType.GetStatus>
): Promise<ResponseFor<MessageType.GetStatus>> => {
  const storedMeta = await readMetaFromStorage();
  const inMemoryMeta = meta.store.getValue();

  // If meta can't be read reliably (e.g. older persisted formats), infer
  // whether a password exists from the presence of vault material.
  const passwordEvidence = await browser.storage.local.get([
    SALT_STORAGE_KEY,
    VAULT_STORAGE_KEY,
  ]);
  const hasSalt = (() => {
    const v = passwordEvidence[SALT_STORAGE_KEY];
    if (typeof v === "string") return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return false;
  })();
  const hasVault = (() => {
    const v = passwordEvidence[VAULT_STORAGE_KEY];
    if (typeof v === "string") return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return false;
  })();

  const passwordSet =
    storedMeta?.passwordSet === true ||
    inMemoryMeta.passwordSet === true ||
    hasSalt ||
    hasVault;

  const viewMode = storedMeta?.viewMode ?? inMemoryMeta.viewMode ?? "public";

  const lastSelectedNetwork =
    storedMeta?.lastSelectedNetwork ?? inMemoryMeta.lastSelectedNetwork;

  const customNetworkName =
    storedMeta?.customNetworkName ?? inMemoryMeta.customNetworkName;

  const mainKey = storedMeta?.mainKey ?? inMemoryMeta.mainKey;

  const lastSelectedAccount =
    storedMeta?.lastSelectedAccount ?? inMemoryMeta.lastSelectedAccount;

  return {
    type: MessageType.GetStatus,
    unlocked: isUnlocked(),
    passwordSet,
    viewMode,
    lastSelectedNetwork,
    customNetworkName,
    mainKey,
    lastSelectedAccount,
  };
};
