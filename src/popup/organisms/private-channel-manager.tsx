import { Button } from "@/popup/atoms/button.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Separator } from "@/popup/atoms/separator.tsx";
import { PrivacyProviders } from "@/popup/organisms/privacy-providers.tsx";
import { PickerItem } from "@/popup/molecules/picker-item.tsx";
import { IconHash, IconPlus } from "@tabler/icons-react";
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
    url: string
  ) => Promise<void>;
  onRemoveProvider: (channelId: string, providerId: string) => Promise<void>;
  onSelectProvider: (
    channelId: string,
    providerId: string | undefined
  ) => Promise<void>;
};

export function PrivateChannelManager(props: PrivateChannelManagerProps) {
  const selectedChannel = props.channels.find(
    (c) => c.id === props.selectedChannelId
  );

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Moonlight Channels</Label>
            <Button
              variant="ghost"
              size="icon"
              onClick={props.onAddChannel}
              title="Add Channel"
              className="h-6 w-6"
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>

          {props.channels.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              No channels found. Add one to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {props.channels.map((c) => (
                <PickerItem
                  key={c.id}
                  isSelected={c.id === props.selectedChannelId}
                  icon={<IconHash className="h-4 w-4" />}
                  title={c.name}
                  subtitle={c.asset.code}
                  onClick={() => props.onSelectChannel(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-base font-medium">Privacy Providers</Label>

          {!selectedChannel ? (
            <div className="text-sm text-muted-foreground py-2">
              Select a channel to manage its connection.
            </div>
          ) : (
            <PrivacyProviders
              channel={selectedChannel}
              accountId={props.accountId}
              onAddProvider={(name, url) =>
                props.onAddProvider(selectedChannel.id, name, url)
              }
              onRemoveProvider={(pid) =>
                props.onRemoveProvider(selectedChannel.id, pid)
              }
              onSelectProvider={(pid) =>
                props.onSelectProvider(selectedChannel.id, pid)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
