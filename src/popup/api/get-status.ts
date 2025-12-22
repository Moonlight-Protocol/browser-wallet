import { MessageType } from "@/background/messages.ts";
import { callBackground } from "@/popup/api/client.ts";

export type PopupStatus = {
  unlocked: boolean;
  passwordSet: boolean;
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
  const res = await callBackground({ type: MessageType.GetStatus });

  return {
    unlocked: res.unlocked,
    passwordSet: res.passwordSet,
    lastSelectedNetwork: res.lastSelectedNetwork,
    customNetworkName: res.customNetworkName,
    mainKey: res.mainKey,
    lastSelectedAccount: res.lastSelectedAccount,
  };
}
