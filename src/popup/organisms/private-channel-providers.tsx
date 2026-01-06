import { useState } from "react";
import { cn } from "@/popup/utils/cn.ts";
import { Button } from "@/popup/atoms/button.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
import { PickerItem } from "@/popup/molecules/picker-item.tsx";
import { IconServer, IconTrash, IconPlus, IconX } from "@tabler/icons-react";
import type {
  PrivateChannel,
  PrivateChannelProvider,
} from "@/persistence/stores/private-channels.types.ts";

export type PrivateChannelProvidersProps = {
  channel: PrivateChannel;
  accountId?: string;
  onAddProvider: (name: string, url: string) => Promise<void>;
  onRemoveProvider: (providerId: string) => Promise<void>;
  onSelectProvider: (providerId: string | undefined) => Promise<void>;
};

export function PrivateChannelProviders(props: PrivateChannelProvidersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [port, setPort] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setBusy(true);
    try {
      let finalUrl = url.trim();
      if (port.trim()) {
        // Strip trailing slash if present before appending port
        finalUrl = finalUrl.replace(/\/$/, "");
        finalUrl = `${finalUrl}:${port.trim()}`;
      }
      await props.onAddProvider(name, finalUrl);
      setIsAdding(false);
      setName("");
      setUrl("");
      setPort("");
    } finally {
      setBusy(false);
    }
  };

  if (isAdding) {
    return (
      <div className="space-y-4 p-1">
        <div className="space-y-2">
          <Label htmlFor="provider-name">Provider Name</Label>
          <Input
            id="provider-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Provider"
          />
        </div>
        <div className="flex gap-2">
          <div className="space-y-2 flex-1">
            <Label htmlFor="provider-url">Provider URL</Label>
            <Input
              id="provider-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2 w-24">
            <Label htmlFor="provider-port">Port</Label>
            <Input
              id="provider-port"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8000"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsAdding(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleAdd} disabled={busy}>
            {busy ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {props.channel.providers.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-4">
          No providers connected.
        </div>
      )}

      {props.channel.providers.map((p) => {
        // Check if this provider is selected AND the current account has a valid session
        const isSelectedProvider = p.id === props.channel.selectedProviderId;
        const session = props.accountId
          ? p.sessions?.[props.accountId]
          : undefined;
        const hasValidSession = session && session.expiresAt > Date.now();
        const selected = isSelectedProvider && hasValidSession;

        return (
          <div key={p.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <PickerItem
                isSelected={selected}
                className="hover:bg-transparent cursor-default"
                icon={<IconServer className="h-4 w-4" />}
                title={p.name}
                subtitle={p.url}
                onClick={() => {}}
              />
            </div>
            <Button
              size="sm"
              variant={selected ? "outline" : "outline"}
              className={cn(
                "h-8 text-xs",
                selected
                  ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                  : ""
              )}
              onClick={() =>
                props.onSelectProvider(selected ? undefined : p.id)
              }
            >
              {selected ? "Disconnect" : "Connect"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => props.onRemoveProvider(p.id)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setIsAdding(true)}
        >
          <IconPlus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>
    </div>
  );
}
