import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";
import { NetworkConfig } from "@colibri/core";
import { rpc as stellarRpc } from "@stellar/stellar-sdk";

// Build-time per-network Soroban RPC proxy URLs (network-dashboard-platform's
// public read-only `/api/v1/public/rpc`). Injected via esbuild `define` (see
// src/build.ts), which bakes the public proxy URLs as per-network defaults so
// a bare build is correct; an operator/iac can override via SOROBAN_RPC_PROXY_*
// env vars. The token stays server-side, so no raw RPC URL is ever contacted.
declare const __SOROBAN_RPC_PROXY_MAINNET__: string;
declare const __SOROBAN_RPC_PROXY_TESTNET__: string;
declare const __SOROBAN_RPC_PROXY_LOCAL__: string;

/**
 * Build an RPC server from a NetworkConfig, forwarding `allowHttp`.
 */
export function getRpcServer(networkConfig: NetworkConfig): stellarRpc.Server {
  return new stellarRpc.Server(
    String(networkConfig.rpcUrl),
    { allowHttp: networkConfig.allowHttp },
  );
}

// Mainnet/testnet are built directly (rather than via NetworkConfig.MainNet()/
// TestNet()) so the SDK's default RAW Soroban RPC hosts never get baked into
// the bundle — `rpcUrl` is ONLY ever the platform proxy. Passphrase + horizon +
// friendbot are the well-known public, token-free values.
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

export function getNetworkConfig(network: ChainNetwork): NetworkConfig {
  switch (network) {
    case "mainnet":
      return NetworkConfig.CustomNet({
        networkPassphrase: MAINNET_PASSPHRASE,
        rpcUrl: __SOROBAN_RPC_PROXY_MAINNET__,
        horizonUrl: "https://horizon.stellar.org",
        allowHttp: false,
      });
    case "testnet":
      return NetworkConfig.CustomNet({
        networkPassphrase: TESTNET_PASSPHRASE,
        rpcUrl: __SOROBAN_RPC_PROXY_TESTNET__,
        horizonUrl: "https://horizon-testnet.stellar.org",
        friendbotUrl: "https://friendbot.stellar.org",
        allowHttp: false,
      });
    case "futurenet":
      return NetworkConfig.FutureNet();
    case "custom":
      return NetworkConfig.CustomNet({
        networkPassphrase: "Standalone Network ; February 2017",
        rpcUrl: __SOROBAN_RPC_PROXY_LOCAL__ ||
          "http://localhost:8000/soroban/rpc",
        horizonUrl: "http://localhost:8000",
        friendbotUrl: "http://localhost:8000/friendbot",
        allowHttp: true,
      });
  }
}
