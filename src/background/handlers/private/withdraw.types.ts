import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type EntropyLevel = "LOW" | "MEDIUM" | "HIGH" | "V_HIGH";

export type WithdrawRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  destinationAddress: string; // G account (Stellar public key)
  amount: string;
  entropyLevel: EntropyLevel;
  // Optional: if provided, only submits (doesn't prepare)
  preparedOperationsMLXDR?: string[];
};

export type WithdrawResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
};

export type PrepareWithdrawRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  destinationAddress: string; // G account (Stellar public key)
  amount: string;
  entropyLevel: EntropyLevel;
};

export type PrepareWithdrawResponse = {
  ok: boolean;
  // WITHDRAW operation
  withdrawOperation?: {
    destinationAddress: string; // G account
    amount: string; // BigInt as string
  };
  // CREATE operations (change only)
  changeOperations?: Array<{
    publicKey: string; // base64
    amount: string; // BigInt as string
    type: "change";
  }>;
  // SPEND operations (UTXOs that will be spent)
  spendOperations?: Array<{
    utxoPublicKey: string; // base64
    conditionsCount: number; // number of conditions (WITHDRAW + change CREATEs)
  }>;
  // MLXDR of operations (for later submission)
  operationsMLXDR?: string[];
  // Summary information
  totalSpendAmount?: string; // total of selected UTXOs
  changeAmount?: string; // change that will be created
  withdrawAmount?: string; // amount being withdrawn
  numSpends?: number;
  numCreates?: number;
  error?: { code: string; message: string };
};
