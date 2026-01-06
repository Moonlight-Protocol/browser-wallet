import React, { useEffect, useState, useMemo } from "react";
import { usePopup } from "@/popup/hooks/state.tsx";
import { getSigningRequest } from "@/popup/api/get-signing-request.ts";
import { approveSigningRequest } from "@/popup/api/approve-signing-request.ts";
import { rejectSigningRequest } from "@/popup/api/reject-signing-request.ts";
import { Button } from "@/popup/atoms/button.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Container } from "@/popup/atoms/container.tsx";
import { LoadingSpinner } from "@/popup/atoms/loading-spinner.tsx";
import { MoonlightBackground } from "@/popup/atoms/moonlight-background.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/popup/atoms/card.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/popup/atoms/tooltip.tsx";
import type { GetSigningRequestResponse } from "@/background/handlers/signing/get-signing-request.types.ts";
import {
  TransactionBuilder,
  Networks,
  Transaction,
} from "@stellar/stellar-sdk";
import { shortenAddress } from "@/popup/utils/common.ts";
import { IconCopy, IconCheck } from "@tabler/icons-react";

// Helper to parse XDR safely
const parseTransaction = (xdr: string | undefined): Transaction | null => {
  if (!xdr) return null;
  try {
    return TransactionBuilder.fromXDR(xdr, Networks.TESTNET) as Transaction;
  } catch (e) {
    // Try PUBLIC
    try {
      return TransactionBuilder.fromXDR(xdr, Networks.PUBLIC) as Transaction;
    } catch (e2) {
      console.error("Failed to parse transaction XDR", e, e2);
      return null;
    }
  }
};

export function SignRequestPage() {
  const { state, actions } = usePopup();
  const { signingRequestId, inPopupSigningFlow } = state;
  const accounts = state.accounts || [];

  const [requestDetails, setRequestDetails] = useState<
    GetSigningRequestResponse["payload"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const transaction = useMemo(
    () => parseTransaction(requestDetails?.xdr),
    [requestDetails?.xdr]
  );

  const sep10Details = useMemo(() => {
    if (!transaction) return null;

    // Look for ManageData(type=web_auth_domain)
    const ops = transaction.operations;
    const authDomainOp = ops.find(
      (op) => op.type === "manageData" && op.name === "web_auth_domain"
    ) as any;

    const webAuthDomain = authDomainOp?.value
      ? new TextDecoder().decode(authDomainOp.value)
      : undefined;
    const serverKey = transaction.source;

    // Timebounds formatting
    let timeboundsString = "None";
    if (transaction.timeBounds) {
      const { minTime, maxTime } = transaction.timeBounds;
      const minDate = minTime === "0" ? null : new Date(Number(minTime) * 1000);
      const maxDate = maxTime === "0" ? null : new Date(Number(maxTime) * 1000);

      if (minDate && maxDate) {
        timeboundsString = `${minDate.toLocaleString()} - ${maxDate.toLocaleString()}`;
      } else if (maxDate) {
        timeboundsString = `Until ${maxDate.toLocaleString()}`;
      } else if (minDate) {
        timeboundsString = `From ${minDate.toLocaleString()}`;
      }
    }

    return {
      webAuthDomain,
      serverKey,
      operationCount: ops.length,
      operations: ops.map((op) => op.type),
      sequence: transaction.sequence,
      timeboundsString,
    };
  }, [transaction]);

  const signingAccount = accounts.find(
    (a) => a.accountId === requestDetails?.accountId
  );

  useEffect(() => {
    if (!signingRequestId) {
      setError("No request ID found.");
      setLoading(false);
      return;
    }

    getSigningRequest(signingRequestId)
      .then((res) => {
        setRequestDetails(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [signingRequestId]);

  const handleApprove = async () => {
    if (!signingRequestId) return;
    setSubmitting(true);
    try {
      await approveSigningRequest(signingRequestId, password);
      // If this was initiated from within the popup, navigate back to home
      if (inPopupSigningFlow) {
        // Small delay to allow background async completion (JWT save) to finish
        await new Promise((resolve) => setTimeout(resolve, 1500));
        actions.goHome();
        actions.refreshStatus();
      }
      // Otherwise, stay in submitting state - background will close the window
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!signingRequestId) return;
    try {
      await rejectSigningRequest(signingRequestId);
      // If this was initiated from within the popup, navigate back to home
      if (inPopupSigningFlow) {
        actions.goHome();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopyXdr = async () => {
    if (!requestDetails?.xdr) return;
    try {
      await navigator.clipboard.writeText(requestDetails.xdr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy XDR", err);
    }
  };

  if (loading) {
    return (
      <MoonlightBackground>
        <Container className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </Container>
      </MoonlightBackground>
    );
  }

  if (error) {
    return (
      <MoonlightBackground>
        <Container className="p-4 space-y-4">
          <Title>Error</Title>
          <Text className="text-red-500">{error}</Text>
          <Button onClick={() => window.close()}>Close</Button>
        </Container>
      </MoonlightBackground>
    );
  }

  return (
    <MoonlightBackground>
      <Container className="p-0 flex flex-col h-full overflow-hidden relative">
        {/* Scrollable Area: Header + Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide">
          <div className="pt-4 pb-2">
            <Title>Sign Request</Title>
          </div>

          <Card className="bg-black/20 border-none shadow-none backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Transaction Details</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyXdr}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "Copied!" : "Copy XDR"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent className="space-y-4">
              {sep10Details?.webAuthDomain && (
                <div className="bg-primary/10 p-2 rounded">
                  <Label className="text-primary font-bold">
                    Web Auth Domain
                  </Label>
                  <Text className="text-lg font-mono">
                    {sep10Details.webAuthDomain}
                  </Text>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Request Type</Label>
                  <Text>{requestDetails?.type}</Text>
                </div>
                <div>
                  <Label>Network</Label>
                  <Text>{requestDetails?.network}</Text>
                </div>
              </div>

              {sep10Details?.serverKey && (
                <div>
                  <Label>Server Key (Source)</Label>
                  <Text className="break-all text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                    {sep10Details.serverKey}
                  </Text>
                </div>
              )}

              {sep10Details?.timeboundsString && (
                <div>
                  <Label>Time Validity (TTL)</Label>
                  <Text className="text-sm text-foreground/80">
                    {sep10Details.timeboundsString}
                  </Text>
                </div>
              )}

              {sep10Details && (
                <div>
                  <Label>Operations ({sep10Details.operationCount})</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sep10Details.operations.map((op, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-medium uppercase tracking-wider"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Floating Footer */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 pt-4 backdrop-blur-xl rounded-t-3xl z-20 space-y-3 border-t border-blue-400/10"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(30,58,138,0.5) 100%)",
          }}
        >
          {/* Signing Account Info */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              Signing with:
            </Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {signingAccount?.name || "Account"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                (
                {signingAccount
                  ? shortenAddress(signingAccount.publicKey)
                  : "..."}
                )
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your wallet password"
              className="bg-black/20 border-white/10 focus:border-primary/50"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent border-white/10 hover:bg-white/5 hover:text-foreground"
              onClick={handleReject}
              disabled={submitting}
            >
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={handleApprove}
              disabled={!password || submitting}
            >
              {submitting ? <LoadingSpinner uiSize="sm" /> : "Approve"}
            </Button>
          </div>
        </div>
      </Container>
    </MoonlightBackground>
  );
}
