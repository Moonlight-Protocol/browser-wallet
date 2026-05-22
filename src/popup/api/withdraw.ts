import { callBackground } from "@/popup/api/client.ts";
import { MessageType } from "@/background/messages.ts";
import type {
  PrepareWithdrawRequest,
  PrepareWithdrawResponse,
  WithdrawRequest,
  WithdrawResponse,
} from "@/background/handlers/private/withdraw.types.ts";

export const withdraw = async (
  params: WithdrawRequest,
): Promise<WithdrawResponse> => {
  return await callBackground<MessageType.Withdraw>({
    type: MessageType.Withdraw,
    ...params,
  }, { timeoutMs: 240_000 });
};

export const prepareWithdraw = async (
  params: PrepareWithdrawRequest,
): Promise<PrepareWithdrawResponse> => {
  return await callBackground<MessageType.PrepareWithdraw>({
    type: MessageType.PrepareWithdraw,
    ...params,
  }, { timeoutMs: 240_000 });
};
