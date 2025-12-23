import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import { NetworkConfig } from "@colibri/core";

export function getNetworkConfig(network: ChainNetwork): NetworkConfig {
  switch (network) {
    case "mainnet":
      return NetworkConfig.MainNet();
    case "testnet":
      return NetworkConfig.TestNet();
    case "futurenet":
      return NetworkConfig.FutureNet();
    case "custom":
      // Custom is currently disabled in UI; keep explicit.
      throw new Error("Custom network not supported");
  }
}
