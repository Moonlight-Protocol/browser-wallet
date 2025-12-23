export type MetaState = {
  version: 1;
  passwordSet: boolean;
  viewMode?: "public" | "private";
  lastSelectedNetwork: "mainnet" | "testnet" | "futurenet" | "custom";
  customNetworkName?: string;
  lastSelectedAccount?: {
    walletId: string;
    accountId: string;
  };
  /**
   * The "main" key reference.
   * - Set to the first generated key, or first imported key.
   * - Derived keys are derived from the main key (same walletId + derived index > 0).
   * - Imported keys are any other keys.
   */
  mainKey?: {
    walletId: string;
    accountId: string;
  };
};
