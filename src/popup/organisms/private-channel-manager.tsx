import { cn } from "@/popup/utils/cn.ts";
import { PrivacyProviders } from "@/popup/organisms/privacy-providers.tsx";
import { IconHash, IconPlus, IconShieldLock } from "@tabler/icons-react";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export type PrivateChannelManagerProps = {
  channels: PrivateChannel[];
  selectedChannelId?: string;
  accountId?: string;
  onSelectChannel: (channelId: string) => void | Promise<void>;
  onAddChannel: () => void | Promise<void>;

  onAddProvider: (
    channelId: string,
    name: string,
    url: string,
  ) => Promise<void>;
  onRemoveProvider: (channelId: string, providerId: string) => Promise<void>;
  onSelectProvider: (
    channelId: string,
    providerId: string | undefined,
  ) => Promise<void>;
};

export function PrivateChannelManager(props: PrivateChannelManagerProps) {
  const selectedChannel = props.channels.find(
    (c) => c.id === props.selectedChannelId,
  );

  return (
    <div className="flex flex-col h-full px-2">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <IconShieldLock className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-extrabold text-foreground/90">
            Private Channels
          </h2>
        </div>
        <p className="text-xs text-foreground/50">
          Manage your confidential transaction channels
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-secondary/30 via-secondary/10 to-transparent" />
      </div>

      {/* Channels Section */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
            Channels
          </span>
          <button
            type="button"
            onClick={props.onAddChannel}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-secondary transition-all duration-200 cursor-pointer hover:bg-secondary/10"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {props.channels.length === 0
          ? (
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "oklch(0.18 0.03 265 / 0.5)",
                border: "1px dashed oklch(0.55 0.20 300 / 0.3)",
              }}
            >
              <IconHash className="h-8 w-8 text-secondary/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground/60">
                No channels yet
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                Create a channel to start using private mode
              </p>
            </div>
          )
          : (
            <div className="space-y-2">
              {props.channels.map((c) => {
                const isSelected = c.id === props.selectedChannelId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => props.onSelectChannel(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-left",
                      isSelected
                        ? "scale-[1.02]"
                        : "hover:scale-[1.01] active:scale-[0.99]",
                    )}
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.2) 0%, oklch(0.45 0.18 280 / 0.1) 100%)"
                        : "oklch(0.18 0.03 265 / 0.5)",
                      border: isSelected
                        ? "1px solid oklch(0.55 0.20 300 / 0.4)"
                        : "1px solid oklch(1 0 0 / 0.06)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.3) 0%, oklch(0.45 0.18 280 / 0.2) 100%)"
                          : "linear-gradient(135deg, oklch(0.55 0.20 300 / 0.15) 0%, oklch(0.45 0.18 280 / 0.1) 100%)",
                        border: "1px solid oklch(0.55 0.20 300 / 0.2)",
                      }}
                    >
                      <IconHash className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground/90 truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-wider">
                        {c.asset.code}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent mb-6" />

      {/* Providers Section */}
      <div className="space-y-3 flex-1">
        <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
          Privacy Providers
        </span>

        {!selectedChannel
          ? (
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: "oklch(0.18 0.03 265 / 0.3)",
                border: "1px solid oklch(1 0 0 / 0.04)",
              }}
            >
              <p className="text-sm text-foreground/50">
                Select a channel to manage providers
              </p>
            </div>
          )
          : (
            <PrivacyProviders
              channel={selectedChannel}
              accountId={props.accountId}
              onAddProvider={(name, url) =>
                props.onAddProvider(selectedChannel.id, name, url)}
              onRemoveProvider={(pid) =>
                props.onRemoveProvider(selectedChannel.id, pid)}
              onSelectProvider={(pid) =>
                props.onSelectProvider(selectedChannel.id, pid)}
            />
          )}
      </div>
    </div>
  );
}
