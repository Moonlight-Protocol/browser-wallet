import { cn } from "@/popup/utils/cn.ts";
import { Button } from "@/popup/atoms/button.tsx";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export type PrivateChannelPickerProps = {
  channels: PrivateChannel[];
  selectedChannelId?: string;

  onSelectChannel: (channelId: string) => void | Promise<void>;
  onAddChannel: () => void | Promise<void>;
};

export function PrivateChannelPicker(props: PrivateChannelPickerProps) {
  const selectedFirst = (() => {
    if (!props.selectedChannelId) return props.channels;
    const selected = props.channels.find(
      (c) => c.id === props.selectedChannelId
    );
    if (!selected) return props.channels;
    return [
      selected,
      ...props.channels.filter((c) => c.id !== props.selectedChannelId),
    ];
  })();

  return (
    <div className="flex flex-col gap-2">
      {selectedFirst.map((c) => {
        const selected = c.id === props.selectedChannelId;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => props.onSelectChannel(c.id)}
            className={cn(
              "text-left rounded-md border border-primary px-3 py-2 text-sm",
              selected ? "text-primary" : "text-muted"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="truncate">{c.name}</div>
              <div className="text-xs text-muted shrink-0">{c.asset.code}</div>
            </div>
          </button>
        );
      })}

      <div className="mt-2 border-t border-muted pt-2 px-2">
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
