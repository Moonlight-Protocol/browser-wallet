import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { isUnlocked, meta } from "@/background/session.ts";
import browser from "webextension-polyfill";

type StoredMeta = {
  passwordSet?: boolean;
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
    if (typeof raw !== "string" || raw.length === 0) return undefined;

    const parsed = JSON.parse(raw) as StoredMeta;
    return parsed;
  } catch {
    return undefined;
  }
}

export const handleGetStatus = async (
  _message: MessageFor<MessageType.GetStatus>
): Promise<ResponseFor<MessageType.GetStatus>> => {
  const storedMeta = await readMetaFromStorage();
  const inMemoryMeta = meta.store.getValue();

  const passwordSet = storedMeta?.passwordSet ?? inMemoryMeta.passwordSet;

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
    lastSelectedNetwork,
    customNetworkName,
    mainKey,
    lastSelectedAccount,
  };
};
