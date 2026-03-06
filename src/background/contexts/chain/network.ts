import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import { NetworkConfig } from "@colibri/core";
import { rpc as stellarRpc } from "@stellar/stellar-sdk";

/**
 * Build an RPC server from a NetworkConfig, forwarding `allowHttp`.
 */
export function getRpcServer(networkConfig: NetworkConfig): stellarRpc.Server {
  return new stellarRpc.Server(
    String(networkConfig.rpcUrl),
    { allowHttp: networkConfig.allowHttp },
  );
}

export function getNetworkConfig(network: ChainNetwork): NetworkConfig {
  switch (network) {
    case "mainnet":
      return NetworkConfig.MainNet();
    case "testnet":
      return NetworkConfig.TestNet();
    case "futurenet":
      return NetworkConfig.FutureNet();
    case "custom":
      return NetworkConfig.CustomNet({
        networkPassphrase: "Standalone Network ; February 2017",
        rpcUrl: "http://localhost:8000/soroban/rpc",
        horizonUrl: "http://localhost:8000",
        friendbotUrl: "http://localhost:8000/friendbot",
        allowHttp: true,
      });
  }
}
