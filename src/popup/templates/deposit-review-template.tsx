import { useState } from "react";
import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Card, CardContent } from "@/popup/atoms/card.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Label } from "@/popup/atoms/label.tsx";
import {
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
} from "@tabler/icons-react";
import type {
  DepositMethod,
  EntropyLevel,
} from "@/background/handlers/private/deposit.types.ts";

export type DepositReviewTemplateProps = {
  channelName: string;
  accountName: string;
  method: DepositMethod;
  amount: string;
  entropyLevel: EntropyLevel;
  utxoCount: number;
  estimatedFee?: string;
  totalAmount?: string;
  busy: boolean;
  error?: string;
  onBack: () => void;
  onSubmit: () => void | Promise<void>;
};

const ENTROPY_LABELS: Record<EntropyLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  V_HIGH: "V.High",
};

export function DepositReviewTemplate(props: DepositReviewTemplateProps) {
  const [operationsExpanded, setOperationsExpanded] = useState(false);

  return (
    <SubpageShell title="Confirm Deposit" onBack={props.onBack}>
      <div className="space-y-4">
        <Text className="text-sm text-muted-foreground">Review carefully</Text>

        {/* Total Amount Card */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <Label className="text-xs uppercase text-muted-foreground mb-2 block">
              Total Amount
            </Label>
            <Text className="text-2xl font-bold mb-2">
              {props.totalAmount ?? props.amount} XLM
            </Text>
            {props.estimatedFee && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconInfoCircle className="h-3 w-3" />
                <span>
                  {props.amount} XLM + {props.estimatedFee} XLM fee
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-semibold mb-3 block">
              Transaction Details
            </Label>
            <div className="flex justify-between items-center">
              <Text className="text-sm text-muted-foreground">Direction</Text>
              <Text className="text-sm font-medium">Deposit</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-sm text-muted-foreground">Method</Text>
              <Text className="text-sm font-medium">{props.method}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-sm text-muted-foreground">
                Entropy Level
              </Text>
              <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                {ENTROPY_LABELS[props.entropyLevel]}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Operations */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">
                Transaction Operations
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOperationsExpanded(!operationsExpanded)}
                className="h-6 px-2"
              >
                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full mr-1">
                  {props.utxoCount} UTXOs
                </span>
                {operationsExpanded
                  ? <IconChevronUp className="h-3 w-3" />
                  : <IconChevronDown className="h-3 w-3" />}
              </Button>
            </div>
            <Text className="text-sm text-muted-foreground">
              Creating {props.utxoCount} UTXOs with{" "}
              {ENTROPY_LABELS[props.entropyLevel].toLowerCase()} privacy
            </Text>
            {operationsExpanded && (
              <div className="pt-2 space-y-1">
                <Text className="text-xs text-muted-foreground">
                  • 1 Deposit operation
                </Text>
                <Text className="text-xs text-muted-foreground">
                  • {props.utxoCount} Create operations
                </Text>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-semibold mb-3 block">
              Account Information
            </Label>
            <div className="flex justify-between items-center">
              <Text className="text-sm text-muted-foreground">Account</Text>
              <Text className="text-sm font-medium">{props.accountName}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-sm text-muted-foreground">Channel</Text>
              <Text className="text-sm font-medium">{props.channelName}</Text>
            </div>
          </CardContent>
        </Card>

        {/* Warning Box */}
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6">
            <Label className="text-sm font-semibold mb-2 block">
              Verify Before Proceeding
            </Label>
            <Text className="text-sm text-yellow-500">
              This action cannot be undone. Double-check all details before
              executing the transaction.
            </Text>
          </CardContent>
        </Card>

        {props.error
          ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {props.error}
            </div>
          )
          : null}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={props.busy}
            onClick={() => props.onSubmit()}
            loading={props.busy}
          >
            Execute Transaction
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={props.busy}
            onClick={() => props.onBack()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </SubpageShell>
  );
}
