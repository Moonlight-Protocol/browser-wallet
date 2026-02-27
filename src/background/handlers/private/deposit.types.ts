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
  // Optional: if provided, only submits (doesn't prepare)
  preparedOperationsMLXDR?: string[];
};

export type DepositResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
};

export type PrepareDepositRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  amount: string;
  entropyLevel: EntropyLevel;
};

export type PrepareDepositResponse = {
  ok: boolean;
  createOperations?: Array<{
    publicKey: string;
    amount: string;
  }>;
  operationsMLXDR?: string[];
  numUtxos?: number;
  depositAmount?: string;
  feeAmount?: string;
  depositOperation?: {
    destinationAddress: string;
    amount: string;
  };
  error?: { code: string; message: string };
};
