import { useState } from "react";
import { cn } from "@/popup/utils/cn.ts";
import { Spinner } from "@/popup/atoms/spinner.tsx";
import { IconPlus, IconServer, IconTrash, IconX } from "@tabler/icons-react";
import type { PrivateChannel } from "@/persistence/stores/private-channels.types.ts";

export type PrivacyProvidersProps = {
  channel: PrivateChannel;
  accountId?: string;
  onAddProvider: (name: string, url: string) => Promise<void>;
  onRemoveProvider: (providerId: string) => Promise<void>;
  onSelectProvider: (providerId: string | undefined) => Promise<void>;
};

export function PrivacyProviders(props: PrivacyProvidersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [port, setPort] = useState("");
  const [busy, setBusy] = useState(false);
  const [processingProviderId, setProcessingProviderId] = useState<
    string | null
  >(null);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setBusy(true);
    try {
      let finalUrl = url.trim();
      if (port.trim()) {
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

  const handleToggleConnection = async (id: string, isSelected: boolean) => {
    if (processingProviderId) return;
    setProcessingProviderId(id);
    try {
      await props.onSelectProvider(isSelected ? undefined : id);
    } finally {
      setProcessingProviderId(null);
    }
  };

  if (isAdding) {
    return (
      <div
        className="p-4 rounded-xl space-y-4"
        style={{
          background: "oklch(0.18 0.03 265 / 0.6)",
          border: "1px solid oklch(0.55 0.20 300 / 0.2)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground/80">
            Add Provider
          </span>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-colors cursor-pointer"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="provider-name"
              className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5"
            >
              Provider Name
            </label>
            <input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Provider"
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label
                htmlFor="provider-url"
                className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5"
              >
                Provider URL
              </label>
              <input
                id="provider-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors"
              />
            </div>
            <div className="w-20">
              <label
                htmlFor="provider-port"
                className="block text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-1.5"
              >
                Port
              </label>
              <input
                id="provider-port"
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="8000"
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-background/50 border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-secondary/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={busy || !name.trim() || !url.trim()}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.20 300) 0%, oklch(0.45 0.18 280) 100%)",
            color: "white",
            boxShadow: "0 4px 12px oklch(0.55 0.20 300 / 0.3)",
          }}
        >
          {busy ? "Adding..." : "Add Provider"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {props.channel.providers.length === 0 && (
        <div
          className="p-4 rounded-xl text-center"
          style={{
            background: "oklch(0.18 0.03 265 / 0.3)",
            border: "1px dashed oklch(1 0 0 / 0.1)",
          }}
        >
          <IconServer className="h-8 w-8 text-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-foreground/50">No providers connected</p>
        </div>
      )}

      {props.channel.providers.map((p) => {
        const isSelectedProvider = p.id === props.channel.selectedProviderId;
        const session = props.accountId
          ? p.sessions?.[props.accountId]
          : undefined;
        const hasValidSession = session && session.expiresAt > Date.now();
        const connected = !!(isSelectedProvider && hasValidSession);

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{
              background: connected
                ? "linear-gradient(135deg, oklch(0.6 0.2 145 / 0.1) 0%, oklch(0.5 0.15 145 / 0.05) 100%)"
                : "oklch(0.18 0.03 265 / 0.4)",
              border: connected
                ? "1px solid oklch(0.6 0.2 145 / 0.3)"
                : "1px solid oklch(1 0 0 / 0.05)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: connected
                  ? "linear-gradient(135deg, oklch(0.6 0.2 145 / 0.2) 0%, oklch(0.5 0.15 145 / 0.1) 100%)"
                  : "oklch(0.2 0.03 265 / 0.5)",
                border: connected
                  ? "1px solid oklch(0.6 0.2 145 / 0.2)"
                  : "1px solid oklch(1 0 0 / 0.05)",
              }}
            >
              <IconServer
                className={cn(
                  "h-4 w-4",
                  connected ? "text-green-400" : "text-foreground/40",
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground/80 truncate">
                {p.name}
              </p>
              <p className="text-[10px] text-foreground/40 truncate">{p.url}</p>
            </div>

            <button
              type="button"
              disabled={!!processingProviderId}
              onClick={() => handleToggleConnection(p.id, connected)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50",
                connected
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20",
              )}
            >
              {processingProviderId === p.id
                ? <Spinner className="h-3 w-3" />
                : connected
                ? (
                  "Disconnect"
                )
                : (
                  "Connect"
                )}
            </button>

            <button
              type="button"
              onClick={() => props.onRemoveProvider(p.id)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-secondary transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: "oklch(0.55 0.20 300 / 0.1)",
          border: "1px dashed oklch(0.55 0.20 300 / 0.3)",
        }}
      >
        <IconPlus className="h-4 w-4" />
        Add Provider
      </button>
    </div>
  );
}
