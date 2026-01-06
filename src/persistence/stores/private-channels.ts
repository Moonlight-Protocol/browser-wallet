import { PersistedStore } from "@/persistence/store.ts";
import type {
  PrivateChannel,
  PrivateChannelsState,
  PrivateChannelAsset,
  PrivacyProvider,
  PrivacyProviderSession,
} from "@/persistence/stores/private-channels.types.ts";
import type { ChainNetwork } from "@/persistence/stores/chain.types.ts";

type LegacyPrivacyProvider = Omit<PrivacyProvider, "sessions"> & {
  session?: PrivacyProviderSession;
  sessions?: Record<string, PrivacyProviderSession>;
};

type LegacyPrivateChannel = Omit<
  PrivateChannel,
  "quorumContractId" | "providers"
> & {
  authContractId?: string;
  quorumContractId?: string;
  providers?: LegacyPrivacyProvider[];
};

type LegacyPrivateChannelsState = {
  version?: number;
  channelsByNetwork?: Partial<Record<ChainNetwork, LegacyPrivateChannel[]>>;
  selectedChannelIdByNetwork?: Partial<Record<ChainNetwork, string>>;
};

const DEFAULT_PRIVATE_CHANNELS_STATE: PrivateChannelsState = {
  version: 3,
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

    // Ensure channelsByNetwork is an object before iterating
    if (channelsByNetwork && typeof channelsByNetwork === "object") {
      for (const [network, channels] of Object.entries(channelsByNetwork)) {
        const list = (channels ?? []) as LegacyPrivateChannel[];
        migratedChannelsByNetwork[network as ChainNetwork] = list.map((c) => {
          const quorumContractId =
            (c as LegacyPrivateChannel).quorumContractId ??
            (c as LegacyPrivateChannel).authContractId ??
            "";

          // Check if it already has providers (if it was already v3 but maybe partial)
          const existingProviders = (c as unknown as PrivateChannel).providers;
          const existingSelectedProviderId = (c as unknown as PrivateChannel)
            .selectedProviderId;

          return {
            id: c.id,
            name: c.name,
            network: c.network,
            contractId: c.contractId,
            quorumContractId,
            asset: c.asset,
            createdAt: c.createdAt,
            providers: Array.isArray(existingProviders)
              ? (existingProviders as unknown as LegacyPrivacyProvider[]).map(
                  (p) => ({
                    id: p.id,
                    name: p.name,
                    url: p.url,
                    sessions: p.session
                      ? { default: p.session }
                      : p.sessions || {},
                  })
                )
              : [],
            selectedProviderId: existingSelectedProviderId,
          } satisfies PrivateChannel;
        });
      }
    }

    const selectedChannelIdByNetwork =
      (parsed as LegacyPrivateChannelsState).selectedChannelIdByNetwork ??
      DEFAULT_PRIVATE_CHANNELS_STATE.selectedChannelIdByNetwork;

    return {
      version: 3,
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
      providers: [],
      selectedProviderId: undefined,
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

  addProvider(
    network: ChainNetwork,
    channelId: string,
    provider: { id: string; name: string; url: string }
  ) {
    this.store.update((prev) => {
      const channels = prev.channelsByNetwork[network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [network]: channels.map((c) => {
            if (c.id !== channelId) return c;
            return {
              ...c,
              providers: [
                ...c.providers,
                { ...provider, sessions: {} } as PrivacyProvider,
              ],
              // Do not auto-select
              selectedProviderId: c.selectedProviderId,
            };
          }),
        },
      };
    });
  }

  removeProvider(network: ChainNetwork, channelId: string, providerId: string) {
    this.store.update((prev) => {
      const channels = prev.channelsByNetwork[network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [network]: channels.map((c) => {
            if (c.id !== channelId) return c;
            const nextProviders = c.providers.filter(
              (p) => p.id !== providerId
            );
            let nextSelected = c.selectedProviderId;
            if (c.selectedProviderId === providerId) {
              nextSelected =
                nextProviders.length > 0 ? nextProviders[0].id : undefined;
            }
            return {
              ...c,
              providers: nextProviders,
              selectedProviderId: nextSelected,
            };
          }),
        },
      };
    });
  }

  setSelectedProvider(
    network: ChainNetwork,
    channelId: string,
    providerId: string | undefined
  ) {
    this.store.update((prev) => {
      const channels = prev.channelsByNetwork[network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [network]: channels.map((c) => {
            if (c.id !== channelId) return c;
            return {
              ...c,
              selectedProviderId: providerId,
            };
          }),
        },
      };
    });
  }

  setProviderSession(
    network: ChainNetwork,
    channelId: string,
    providerId: string,
    accountId: string,
    session: { token: string; expiresAt: number }
  ) {
    this.store.update((prev) => {
      const channels = prev.channelsByNetwork[network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [network]: channels.map((c) => {
            if (c.id !== channelId) return c;
            return {
              ...c,
              providers: c.providers.map((p) => {
                if (p.id !== providerId) return p;
                return {
                  ...p,
                  sessions: {
                    ...(p.sessions || {}),
                    [accountId]: session,
                  },
                };
              }),
            };
          }),
        },
      };
    });
  }

  clearProviderSession(
    network: ChainNetwork,
    channelId: string,
    providerId: string,
    accountId: string
  ) {
    this.store.update((prev) => {
      const channels = prev.channelsByNetwork[network] ?? [];
      return {
        ...prev,
        channelsByNetwork: {
          ...prev.channelsByNetwork,
          [network]: channels.map((c) => {
            if (c.id !== channelId) return c;
            return {
              ...c,
              providers: c.providers.map((p) => {
                if (p.id !== providerId) return p;
                const sessions = { ...(p.sessions || {}) };
                delete sessions[accountId];
                return { ...p, sessions };
              }),
            };
          }),
        },
      };
    });
  }
}
