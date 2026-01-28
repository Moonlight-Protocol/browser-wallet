import type { BackgroundError } from "@/background/types.ts";

export type ViewMode = "public" | "private";

export type SetViewModeRequest = {
  viewMode: ViewMode;
};

export type SetViewModeResponse =
  | {
    ok: true;
  }
  | {
    ok: false;
    error: BackgroundError;
  };
