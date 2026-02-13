import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type DepositMethod = "DIRECT" | "3RD-PARTY RAMP";
export type EntropyLevel = "LOW" | "MEDIUM" | "HIGH" | "V_HIGH";

export type DepositRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  method: DepositMethod;
  amount: string;
  entropyLevel: EntropyLevel;
};

export type DepositResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
};
