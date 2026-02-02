import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { privateChannels } from "@/background/session.ts";
import { Contract, type ContractId } from "@colibri/core";
import { ChannelReadMethods, ChannelSpec } from "@moonlight/moonlight-sdk";
import { getNetworkConfig } from "@/background/contexts/chain/network.ts";

export const handleAddPrivateChannel = async (
  message: MessageFor<MessageType.AddPrivateChannel>,
): Promise<ResponseFor<MessageType.AddPrivateChannel>> => {
  try {
    const name = message.name.trim();
    if (!name) {
      return {
        type: MessageType.AddPrivateChannel,
        ok: false,
        error: { code: "UNKNOWN", message: "Name is required" },
      };
    }

    const contractId = message.contractId.trim();
    let quorumContractId = message.quorumContractId.trim();
    if (!contractId) {
      return {
        type: MessageType.AddPrivateChannel,
        ok: false,
        error: { code: "UNKNOWN", message: "Contract ID is required" },
      };
    }

    if (!quorumContractId) {
      try {
        const networkConfig = getNetworkConfig(message.network);
        const channelContract = new Contract({
          networkConfig,
          contractConfig: {
            contractId: contractId as ContractId,
            spec: ChannelSpec,
          },
        });

        const authContractId = await channelContract.read({
          method: ChannelReadMethods.auth,
          methodArgs: {},
        });

        quorumContractId = authContractId as string;
      } catch (e) {
        console.error("Failed to fetch quorum contract ID", e);
        return {
          type: MessageType.AddPrivateChannel,
          ok: false,
          error: {
            code: "UNKNOWN",
            message:
              "Failed to fetch Quorum Contract ID. Please check the Channel Contract ID.",
          },
        };
      }
    }

    if (!quorumContractId) {
      return {
        type: MessageType.AddPrivateChannel,
        ok: false,
        error: { code: "UNKNOWN", message: "Quorum Contract ID is required" },
      };
    }

    const assetCode = message.asset.code.trim();
    if (!assetCode) {
      return {
        type: MessageType.AddPrivateChannel,
        ok: false,
        error: { code: "UNKNOWN", message: "Asset code is required" },
      };
    }

    const id = crypto.randomUUID();
    const channel = privateChannels.addChannel({
      id,
      name,
      network: message.network,
      contractId,
      quorumContractId,
      asset: {
        code: assetCode,
        issuer: message.asset.issuer?.trim() || undefined,
      },
    });

    privateChannels.setSelectedChannelId(message.network, channel.id);
    await privateChannels.flush();

    return {
      type: MessageType.AddPrivateChannel,
      ok: true,
      channel,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      type: MessageType.AddPrivateChannel,
      ok: false,
      error: { code: "UNKNOWN", message: msg },
    };
  }
};
