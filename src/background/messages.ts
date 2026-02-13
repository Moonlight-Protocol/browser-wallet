import type {
  GetAccountsRequest,
  GetAccountsResponse,
} from "@/background/handlers/accounts/get-accounts.types.ts";
import type {
  UnlockRequest,
  UnlockResponse,
} from "@/background/handlers/session/unlock.types.ts";
import type {
  LockRequest,
  LockResponse,
} from "@/background/handlers/session/lock.types.ts";
import type {
  GetStatusRequest,
  GetStatusResponse,
} from "@/background/handlers/session/get-status.types.ts";
import type {
  CreateWalletRequest,
  CreateWalletResponse,
} from "@/background/handlers/wallet/create-wallet.types.ts";
import type {
  ImportWalletRequest,
  ImportWalletResponse,
} from "@/background/handlers/wallet/import-wallet.types.ts";
import type {
  TouchRequest,
  TouchResponse,
} from "@/background/handlers/session/touch.types.ts";
import type {
  SetNetworkRequest,
  SetNetworkResponse,
} from "@/background/handlers/session/set-network.types.ts";
import type {
  SetSelectedAccountRequest,
  SetSelectedAccountResponse,
} from "@/background/handlers/accounts/set-selected-account.types.ts";
import type {
  SetViewModeRequest,
  SetViewModeResponse,
} from "@/background/handlers/session/set-view-mode.types.ts";
import type {
  DeriveAccountRequest,
  DeriveAccountResponse,
} from "@/background/handlers/accounts/derive-account.types.ts";
import type {
  ImportSecretRequest,
  ImportSecretResponse,
} from "@/background/handlers/accounts/import-secret.types.ts";
import type {
  RenameAccountRequest,
  RenameAccountResponse,
} from "@/background/handlers/accounts/rename-account.types.ts";
import type {
  GetChainStateRequest,
  GetChainStateResponse,
} from "@/background/handlers/chain/get-chain-state.types.ts";
import type {
  SyncChainStateRequest,
  SyncChainStateResponse,
} from "@/background/handlers/chain/sync-chain-state.types.ts";
import type {
  GetAccountActivationStatusRequest,
  GetAccountActivationStatusResponse,
} from "@/background/handlers/chain/get-account-activation-status.types.ts";
import type {
  FundWithFriendbotRequest,
  FundWithFriendbotResponse,
} from "@/background/handlers/chain/fund-with-friendbot.types.ts";
import type {
  GetPrivateChannelsRequest,
  GetPrivateChannelsResponse,
} from "@/background/handlers/private/get-private-channels.types.ts";
import type {
  AddPrivateChannelRequest,
  AddPrivateChannelResponse,
} from "@/background/handlers/private/add-private-channel.types.ts";
import type {
  SetSelectedPrivateChannelRequest,
  SetSelectedPrivateChannelResponse,
} from "@/background/handlers/private/set-selected-private-channel.types.ts";
import type {
  EnsurePrivateChannelTrackingRequest,
  EnsurePrivateChannelTrackingResponse,
} from "@/background/handlers/private/ensure-private-channel-tracking.types.ts";
import type {
  GetPrivateStatsRequest,
  GetPrivateStatsResponse,
} from "@/background/handlers/private/get-private-stats.types.ts";
import type {
  AddPrivacyProviderRequest,
  AddPrivacyProviderResponse,
} from "@/background/handlers/private/add-privacy-provider.types.ts";
import type {
  RemovePrivacyProviderRequest,
  RemovePrivacyProviderResponse,
} from "@/background/handlers/private/remove-privacy-provider.types.ts";
import type {
  SetSelectedPrivacyProviderRequest,
  SetSelectedPrivacyProviderResponse,
} from "@/background/handlers/private/set-selected-privacy-provider.types.ts";
import type {
  ConnectPrivacyProviderRequest,
  ConnectPrivacyProviderResponse,
} from "@/background/handlers/private/connect-privacy-provider.types.ts";
import type {
  DisconnectPrivacyProviderRequest,
  DisconnectPrivacyProviderResponse,
} from "@/background/handlers/private/disconnect-privacy-provider.types.ts";

import type {
  GetPrivacyProviderAuthChallengeRequest,
  GetPrivacyProviderAuthChallengeResponse,
} from "@/background/handlers/private/get-privacy-provider-auth-challenge.types.ts";
import type {
  RequestSigningRequest,
  RequestSigningResponse,
} from "@/background/handlers/signing/request-signing.types.ts";
import type {
  GetSigningRequestRequest,
  GetSigningRequestResponse,
} from "@/background/handlers/signing/get-signing-request.types.ts";
import type {
  ApproveSigningRequestRequest,
  ApproveSigningRequestResponse,
} from "@/background/handlers/signing/approve-signing-request.types.ts";
import type {
  RejectSigningRequestRequest,
  RejectSigningRequestResponse,
} from "@/background/handlers/signing/reject-signing-request.types.ts";
import type {
  DepositRequest,
  DepositResponse,
} from "@/background/handlers/private/deposit.types.ts";

// Helper types and mapped types for messages and responses
// ==============================================================================
export type MessageFor<T extends MessageType> = {
  type: T;
} & MessagePayloadMap[T];

export type ResponseFor<T extends MessageType> = {
  type: T;
} & ResponsePayloadMap[T];

export type Message = MessageFor<MessageType>;
export type Response = ResponseFor<MessageType>;

export type Handler<K extends MessageType> = (
  message: MessageFor<K>,
) => ResponseFor<K> | Promise<ResponseFor<K>>;

export type HandlerMap = {
  [K in MessageType]: Handler<K>;
};

// Message Types
// ==============================================================================

export enum MessageType {
  GetAccounts = "GET_ACCOUNTS",
  GetStatus = "GET_STATUS",
  GetChainState = "GET_CHAIN_STATE",
  SyncChainState = "SYNC_CHAIN_STATE",
  GetAccountActivationStatus = "GET_ACCOUNT_ACTIVATION_STATUS",
  FundWithFriendbot = "FUND_WITH_FRIENDBOT",
  Unlock = "UNLOCK",
  Lock = "LOCK",
  CreateWallet = "CREATE_WALLET",
  ImportWallet = "IMPORT_WALLET",
  ImportSecret = "IMPORT_SECRET",
  DeriveAccount = "DERIVE_ACCOUNT",
  RenameAccount = "RENAME_ACCOUNT",
  Touch = "TOUCH",
  SetNetwork = "SET_NETWORK",
  SetViewMode = "SET_VIEW_MODE",
  SetSelectedAccount = "SET_SELECTED_ACCOUNT",
  GetPrivateChannels = "GET_PRIVATE_CHANNELS",
  AddPrivateChannel = "ADD_PRIVATE_CHANNEL",
  SetSelectedPrivateChannel = "SET_SELECTED_PRIVATE_CHANNEL",
  EnsurePrivateChannelTracking = "ENSURE_PRIVATE_CHANNEL_TRACKING",
  GetPrivateStats = "GET_PRIVATE_STATS",
  AddPrivacyProvider = "ADD_PRIVACY_PROVIDER",
  RemovePrivacyProvider = "REMOVE_PRIVACY_PROVIDER",
  SetSelectedPrivacyProvider = "SET_SELECTED_PRIVACY_PROVIDER",
  ConnectPrivacyProvider = "CONNECT_PRIVACY_PROVIDER",
  DisconnectPrivacyProvider = "DISCONNECT_PRIVACY_PROVIDER",
  GetPrivacyProviderAuthChallenge = "GET_PRIVACY_PROVIDER_AUTH_CHALLENGE",
  RequestSigning = "REQUEST_SIGNING",
  GetSigningRequest = "GET_SIGNING_REQUEST",
  ApproveSigningRequest = "APPROVE_SIGNING_REQUEST",
  RejectSigningRequest = "REJECT_SIGNING_REQUEST",
  Deposit = "DEPOSIT",
}

export type MessagePayloadMap = {
  [MessageType.GetAccounts]: GetAccountsRequest;
  [MessageType.GetStatus]: GetStatusRequest;
  [MessageType.GetChainState]: GetChainStateRequest;
  [MessageType.SyncChainState]: SyncChainStateRequest;
  [MessageType.GetAccountActivationStatus]: GetAccountActivationStatusRequest;
  [MessageType.FundWithFriendbot]: FundWithFriendbotRequest;
  [MessageType.Unlock]: UnlockRequest;
  [MessageType.Lock]: LockRequest;
  [MessageType.CreateWallet]: CreateWalletRequest;
  [MessageType.ImportWallet]: ImportWalletRequest;
  [MessageType.ImportSecret]: ImportSecretRequest;
  [MessageType.DeriveAccount]: DeriveAccountRequest;
  [MessageType.RenameAccount]: RenameAccountRequest;
  [MessageType.Touch]: TouchRequest;
  [MessageType.SetNetwork]: SetNetworkRequest;
  [MessageType.SetViewMode]: SetViewModeRequest;
  [MessageType.SetSelectedAccount]: SetSelectedAccountRequest;
  [MessageType.GetPrivateChannels]: GetPrivateChannelsRequest;
  [MessageType.AddPrivateChannel]: AddPrivateChannelRequest;
  [MessageType.SetSelectedPrivateChannel]: SetSelectedPrivateChannelRequest;
  [MessageType.EnsurePrivateChannelTracking]:
    EnsurePrivateChannelTrackingRequest;
  [MessageType.GetPrivateStats]: GetPrivateStatsRequest;
  [MessageType.AddPrivacyProvider]: AddPrivacyProviderRequest;
  [MessageType.RemovePrivacyProvider]: RemovePrivacyProviderRequest;
  [MessageType.SetSelectedPrivacyProvider]: SetSelectedPrivacyProviderRequest;
  [MessageType.ConnectPrivacyProvider]: ConnectPrivacyProviderRequest;
  [MessageType.DisconnectPrivacyProvider]: DisconnectPrivacyProviderRequest;
  [MessageType.GetPrivacyProviderAuthChallenge]:
    GetPrivacyProviderAuthChallengeRequest;
  [MessageType.RequestSigning]: RequestSigningRequest;
  [MessageType.GetSigningRequest]: GetSigningRequestRequest;
  [MessageType.ApproveSigningRequest]: ApproveSigningRequestRequest;
  [MessageType.RejectSigningRequest]: RejectSigningRequestRequest;
  [MessageType.Deposit]: DepositRequest;
};

export type ResponsePayloadMap = {
  [MessageType.GetAccounts]: GetAccountsResponse;
  [MessageType.GetStatus]: GetStatusResponse;
  [MessageType.GetChainState]: GetChainStateResponse;
  [MessageType.SyncChainState]: SyncChainStateResponse;
  [MessageType.GetAccountActivationStatus]: GetAccountActivationStatusResponse;
  [MessageType.FundWithFriendbot]: FundWithFriendbotResponse;
  [MessageType.Unlock]: UnlockResponse;
  [MessageType.Lock]: LockResponse;
  [MessageType.CreateWallet]: CreateWalletResponse;
  [MessageType.ImportWallet]: ImportWalletResponse;
  [MessageType.ImportSecret]: ImportSecretResponse;
  [MessageType.DeriveAccount]: DeriveAccountResponse;
  [MessageType.RenameAccount]: RenameAccountResponse;
  [MessageType.Touch]: TouchResponse;
  [MessageType.SetNetwork]: SetNetworkResponse;
  [MessageType.SetViewMode]: SetViewModeResponse;
  [MessageType.SetSelectedAccount]: SetSelectedAccountResponse;
  [MessageType.GetPrivateChannels]: GetPrivateChannelsResponse;
  [MessageType.AddPrivateChannel]: AddPrivateChannelResponse;
  [MessageType.SetSelectedPrivateChannel]: SetSelectedPrivateChannelResponse;
  [MessageType.EnsurePrivateChannelTracking]:
    EnsurePrivateChannelTrackingResponse;
  [MessageType.GetPrivateStats]: GetPrivateStatsResponse;
  [MessageType.AddPrivacyProvider]: AddPrivacyProviderResponse;
  [MessageType.RemovePrivacyProvider]: RemovePrivacyProviderResponse;
  [MessageType.SetSelectedPrivacyProvider]: SetSelectedPrivacyProviderResponse;
  [MessageType.ConnectPrivacyProvider]: ConnectPrivacyProviderResponse;
  [MessageType.DisconnectPrivacyProvider]: DisconnectPrivacyProviderResponse;
  [MessageType.GetPrivacyProviderAuthChallenge]:
    GetPrivacyProviderAuthChallengeResponse;
  [MessageType.RequestSigning]: RequestSigningResponse;
  [MessageType.GetSigningRequest]: GetSigningRequestResponse;
  [MessageType.ApproveSigningRequest]: ApproveSigningRequestResponse;
  [MessageType.RejectSigningRequest]: RejectSigningRequestResponse;
  [MessageType.Deposit]: DepositResponse;
};
