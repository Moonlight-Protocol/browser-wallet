import { Shell } from "@/popup/templates/shell.tsx";
import { Title } from "@/popup/atoms/title.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { LoadingSpinner } from "@/popup/atoms/loading-spinner.tsx";
import { MasterWalletIcon } from "@/popup/icons/master-wallet-icon.tsx";

export function LoadingTemplate(props: { error?: string }) {
  return (
    <Shell>
      <div className="min-h-full flex flex-col items-center">
        <div className="w-full pt-6 flex flex-col items-center">
          <div className="text-center">
            <Title>Moonlight Wallet</Title>
          </div>

          <Text className="mt-2 text-center">
            {props.error ? "Something went wrong." : "Loading…"}
          </Text>
        </div>

        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <LoadingSpinner uiSize="md" />

          {props.error ? (
            <Text tone="error" size="sm" className="mt-4 text-center">
              {props.error}
            </Text>
          ) : null}
        </div>

        <div className="w-full flex items-center justify-center pb-2">
          <MasterWalletIcon className="h-16 w-16 text-muted" />
        </div>
      </div>
    </Shell>
  );
}
