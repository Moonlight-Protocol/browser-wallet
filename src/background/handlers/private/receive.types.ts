import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

export type ReceiveRequest = {
  network: ChainNetwork;
  channelId: string;
  providerId: string;
  accountId: string;
  amount: string;
};

export type ReceiveResponse = {
  ok: boolean;
  operationsMLXDR?: string[];
  utxos?: Array<{
    publicKey: string;
    amount: string; // BigInt as string
  }>;
  requestedAmount?: string;
  numUtxos?: number;
  error?: { code: string; message: string };
};
