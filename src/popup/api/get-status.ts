import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";
import { ApiError } from "@/popup/api/client.ts";

export type PopupStatus = {
  unlocked: boolean;
  passwordSet: boolean;
  viewMode: "public" | "private";
  lastSelectedNetwork: "mainnet" | "testnet" | "futurenet" | "custom";
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

export async function getStatus(): Promise<PopupStatus> {
  const attempt = async () =>
    await callBackground(
      { type: MessageType.GetStatus },
      { timeoutMs: 30_000 }
    );

  let res: Awaited<ReturnType<typeof attempt>>;
  try {
    res = await attempt();
  } catch (err) {
    // MV3 service worker can be slow to cold-start; retry once on timeout.
    if (err instanceof ApiError && err.code === "BACKGROUND_TIMEOUT") {
      await new Promise((r) => setTimeout(r, 250));
      res = await attempt();
    } else {
      throw err;
    }
  }

  return {
    unlocked: res.unlocked,
    passwordSet: res.passwordSet,
    viewMode: res.viewMode,
    lastSelectedNetwork: res.lastSelectedNetwork,
    customNetworkName: res.customNetworkName,
    mainKey: res.mainKey,
    lastSelectedAccount: res.lastSelectedAccount,
  };
}
