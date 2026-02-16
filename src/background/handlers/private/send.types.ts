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
  // Optional: if provided, only submits (doesn't prepare)
  preparedOperationsMLXDR?: string[];
};

export type SendResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  error?: { code: string; message: string };
};

export type PrepareSendRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  receiverOperationsMLXDR: string; // MLXDR string (can be multiline)
  amount: string;
  entropyLevel: EntropyLevel;
};

export type PrepareSendResponse = {
  ok: boolean;
  // CREATE operations (receiver + change)
  createOperations?: Array<{
    publicKey: string; // base64
    amount: string; // BigInt as string
    type: "receiver" | "change";
  }>;
  // SPEND operations (UTXOs that will be spent)
  spendOperations?: Array<{
    utxoPublicKey: string; // base64
    conditionsCount: number; // number of conditions (CREATE operations)
  }>;
  // MLXDR of operations (for later submission)
  operationsMLXDR?: string[];
  // Summary information
  totalSpendAmount?: string; // total of selected UTXOs
  changeAmount?: string; // change that will be created
  receiverAmount?: string; // amount sent to receiver
  numSpends?: number;
  numCreates?: number;
  error?: { code: string; message: string };
};
