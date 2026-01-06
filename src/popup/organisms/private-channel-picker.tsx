import { Button } from "@/popup/atoms/button.tsx";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";
import { PickerItem } from "@/popup/molecules/picker-item.tsx";
import { IconHash } from "@tabler/icons-react";

export type PrivateChannelPickerProps = {
  channels: PrivateChannel[];
  selectedChannelId?: string;

  onSelectChannel: (channelId: string) => void | Promise<void>;
  onAddChannel: () => void | Promise<void>;
  onManageChannel?: (channelId: string) => void | Promise<void>;
};

export function PrivateChannelPicker(props: PrivateChannelPickerProps) {
  return (
    <div className="flex flex-col">
      {props.channels.map((c) => {
        const selected = c.id === props.selectedChannelId;

        return (
          <PickerItem
            key={c.id}
            isSelected={selected}
            icon={<IconHash className="h-4 w-4" />}
            title={c.name}
            subtitle={c.asset.code}
            onClick={() => props.onSelectChannel(c.id)}
            onActionClick={
              selected && props.onManageChannel
                ? () => props.onManageChannel!(c.id)
                : undefined
            }
          />
        );
      })}

      <div className="mt-2 border-t border-border pt-2 px-2">
        <div className="flex gap-2">
          <Button
            uiSize="sm"
            className="flex-1"
            onClick={() => props.onAddChannel()}
          >
            Add channel
          </Button>
        </div>
      </div>
    </div>
  );
}
