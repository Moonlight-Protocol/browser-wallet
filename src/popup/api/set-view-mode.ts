import { MessageType } from "@/background/messages.ts";
import type { SetViewModeResponse } from "@/background/handlers/session/set-view-mode.types.ts";
import { ApiError, callBackground } from "@/popup/api/client.ts";

export async function setViewMode(params: { viewMode: "public" | "private" }) {
  const res = (await callBackground({
    type: MessageType.SetViewMode,
    viewMode: params.viewMode,
  })) as SetViewModeResponse;

  if ("ok" in res && res.ok === true) return res;

  if ("error" in res) {
    throw new ApiError(
      res.error.message ?? "Failed to set view mode",
      res.error.code,
    );
  }

  throw new ApiError("Failed to set view mode", "UNKNOWN");
}
