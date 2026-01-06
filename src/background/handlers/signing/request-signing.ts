import { MessageType } from "@/background/messages.ts";
import type { Handler } from "@/background/messages.ts";
import { signingManager } from "@/background/session.ts";
import browser from "webextension-polyfill";

export const handleRequestSigning: Handler<MessageType.RequestSigning> = async (
  message
) => {
  const { type, xdr, accountId, network } = message.payload;

  // TODO: Validate XDR based on type (e.g. check if it's a valid auth challenge)

  const request = signingManager.createRequest({
    type,
    xdr,
    accountId,
    network,
  });

  // Open the signing popup
  // We use a specific route for signing: /sign-request/:requestId
  // Note: The main popup HTML file is typically popup.html in the dist folder
  const url = browser.runtime.getURL(`popup.html#/sign-request/${request.id}`);

  await browser.windows.create({
    url,
    type: "popup",
    width: 380,
    height: 640,
    focused: true,
  });

  // Wait for the user to approve or reject the request
  const signedXdr = await signingManager.waitForResult(request.id);

  return {
    type: MessageType.RequestSigning,
    payload: {
      requestId: request.id,
      signedXdr,
    },
  };
};
