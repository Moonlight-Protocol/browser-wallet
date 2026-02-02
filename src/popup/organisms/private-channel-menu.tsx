import { useState } from "react";
import { PrivateChannelPicker } from "@/popup/organisms/private-channel-picker.tsx";
import { PrivacyProviders } from "@/popup/organisms/privacy-providers.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { IconChevronLeft } from "@tabler/icons-react";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export type PrivateChannelMenuProps = {
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

export function PrivateChannelMenu(props: PrivateChannelMenuProps) {
  const [view, setView] = useState<"picker" | "providers">("picker");
  const [managedChannelId, setManagedChannelId] = useState<string | undefined>(
    undefined,
  );

  const managedChannel = props.channels.find((c) => c.id === managedChannelId);

  if (view === "providers" && managedChannel) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setView("picker")}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate">
            {managedChannel.name} Providers
          </span>
        </div>
        <PrivacyProviders
          channel={managedChannel}
          accountId={props.accountId}
          onAddProvider={(name, url) =>
            props.onAddProvider(managedChannel.id, name, url)}
          onRemoveProvider={(providerId) =>
            props.onRemoveProvider(managedChannel.id, providerId)}
          onSelectProvider={(providerId) =>
            props.onSelectProvider(managedChannel.id, providerId)}
        />
      </div>
    );
  }

  return (
    <PrivateChannelPicker
      channels={props.channels}
      selectedChannelId={props.selectedChannelId}
      onSelectChannel={props.onSelectChannel}
      onAddChannel={props.onAddChannel}
      onManageChannel={(id) => {
        setManagedChannelId(id);
        setView("providers");
      }}
    />
  );
}
