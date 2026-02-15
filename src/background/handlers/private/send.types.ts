import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type EntropyLevel = "LOW" | "MEDIUM" | "HIGH" | "V_HIGH";

export type SendRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  receiverOperationsMLXDR: string; // MLXDR string (can be multiline)
  amount: string;
  entropyLevel: EntropyLevel;
};

export type SendResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
};
