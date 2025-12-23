import { PersistedStore } from "@/persistence/store.ts";
import type {
  PrivateChannel,
  PrivateChannelsState,
  PrivateChannelAsset,
} from "@/persistence/stores/private-channels.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

type LegacyPrivateChannel = Omit<PrivateChannel, "quorumContractId"> & {
  authContractId?: string;
  quorumContractId?: string;
};

type LegacyPrivateChannelsState = {
  version?: number;
  channelsByNetwork?: Partial<Record<ChainNetwork, LegacyPrivateChannel[]>>;
  selectedChannelIdByNetwork?: Partial<Record<ChainNetwork, string>>;
};

const DEFAULT_PRIVATE_CHANNELS_STATE: PrivateChannelsState = {
  version: 2,
  channelsByNetwork: {},
  selectedChannelIdByNetwork: {},
};

export class PrivateChannelsStore extends PersistedStore<PrivateChannelsState> {
  constructor() {
    super("private-channels", DEFAULT_PRIVATE_CHANNELS_STATE, {
      storageKey: "private-channels@store",
      persist: true,
    });
  }

  protected override async safeDeserialize(
    value: string
  ): Promise<PrivateChannelsState> {
    // Migrate legacy persisted shapes.
    const parsed = (await super.safeDeserialize(value)) as unknown as
      | PrivateChannelsState
      | LegacyPrivateChannelsState;

    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_PRIVATE_CHANNELS_STATE;
    }

    const channelsByNetwork =
      (parsed as LegacyPrivateChannelsState).channelsByNetwork ?? {};

    const migratedChannelsByNetwork: PrivateChannelsState["channelsByNetwork"] =
      {};

    for (const [network, channels] of Object.entries(channelsByNetwork)) {
      const list = (channels ?? []) as LegacyPrivateChannel[];
      migratedChannelsByNetwork[network as ChainNetwork] = list.map((c) => {
        const quorumContractId =
          (c as LegacyPrivateChannel).quorumContractId ??
          (c as LegacyPrivateChannel).authContractId ??
          "";

        return {
          id: c.id,
          name: c.name,
          network: c.network,
          contractId: c.contractId,
          quorumContractId,
          asset: c.asset,
          createdAt: c.createdAt,
        } satisfies PrivateChannel;
      });
    }

    const selectedChannelIdByNetwork =
      (parsed as LegacyPrivateChannelsState).selectedChannelIdByNetwork ??
      DEFAULT_PRIVATE_CHANNELS_STATE.selectedChannelIdByNetwork;

    return {
      version: 2,
      channelsByNetwork: migratedChannelsByNetwork,
      selectedChannelIdByNetwork,
    };
  }

  getChannels(network: ChainNetwork): PrivateChannel[] {
    return this.store.getValue().channelsByNetwork[network] ?? [];
  }

  getSelectedChannelId(network: ChainNetwork): string | undefined {
    return this.store.getValue().selectedChannelIdByNetwork[network];
  }

  setSelectedChannelId(network: ChainNetwork, channelId: string | undefined) {
    this.store.update((prev) => ({
      ...prev,
      selectedChannelIdByNetwork: {
        ...prev.selectedChannelIdByNetwork,
        [network]: channelId,
      },
    }));
  }

  addChannel(params: {
    id: string;
    name: string;
    network: ChainNetwork;
    contractId: string;
    quorumContractId: string;
    asset: PrivateChannelAsset;
  }): PrivateChannel {
    const now = Date.now();
    const channel: PrivateChannel = {
      id: params.id,
      name: params.name,
      network: params.network,
      contractId: params.contractId,
      quorumContractId: params.quorumContractId,
      asset: params.asset,
      createdAt: now,
    };

    this.store.update((prev) => {
      const existing = prev.channelsByNetwork[params.network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [params.network]: [...existing, channel],
        },
      };
    });

    return channel;
  }
}
