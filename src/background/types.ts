export type BackgroundError = {
  code:
    | "LOCKED"
    | "INVALID_PASSWORD"
    | "INVALID_MNEMONIC"
    | "INVALID_SECRET"
    | "UNKNOWN";
  message?: string;
};
