import { MessageFor, MessageType, ResponseFor } from "@/background/messages.ts";
import { meta } from "@/background/session.ts";

export const handleSetViewMode = async (
  message: MessageFor<MessageType.SetViewMode>,
): Promise<ResponseFor<MessageType.SetViewMode>> => {
  const viewMode = message.viewMode;

  if (viewMode !== "public" && viewMode !== "private") {
    return {
      type: MessageType.SetViewMode,
      ok: false,
      error: { code: "UNKNOWN", message: "Invalid view mode" },
    };
  }

  meta.setViewMode(viewMode);
  await meta.flush();

  return { type: MessageType.SetViewMode, ok: true };
};
