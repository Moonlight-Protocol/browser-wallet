import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

type NetworkLabelArgs = {
  network: ChainNetwork;
  customNetworkName?: string;
};

export function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-6)}`;
}

export function networkLabel(args: NetworkLabelArgs): string {
  switch (args.network) {
    case "mainnet":
      return "Mainnet";
    case "testnet":
      return "Testnet";
    case "futurenet":
      return "Futurenet";
    case "custom":
      return args.customNetworkName?.trim() || "Custom";
  }
}
