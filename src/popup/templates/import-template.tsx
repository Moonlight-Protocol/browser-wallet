import { SubpageShell } from "@/popup/templates/subpage-shell.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { Input } from "@/popup/atoms/input.tsx";
import { Button } from "@/popup/atoms/button.tsx";
import { Textarea } from "@/popup/atoms/textarea.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/popup/atoms/tabs.tsx";

type ImportMode = "mnemonic" | "secret";

export type ImportTemplateProps = {
  mode: ImportMode;
  submitting: boolean;
  value: string;

  canSubmit: boolean;
  validationError?: string;
  submitError?: string;

  onBack: () => void;
  onSelectMode: (mode: ImportMode) => void;
  onChangeValue: (value: string) => void;
  onSubmit: () => void | Promise<void>;
};

export function ImportTemplate(props: ImportTemplateProps) {
  return (
    <SubpageShell title="Import" onBack={props.onBack}>
      <Text size="sm" className="mb-4">
        Import via mnemonic or secret key.
      </Text>

      <Tabs
        value={props.mode}
        onValueChange={(v) => props.onSelectMode(v as ImportMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mnemonic" disabled={props.submitting}>
            Mnemonic
          </TabsTrigger>
          <TabsTrigger value="secret" disabled={props.submitting}>
            Secret
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="mnemonic">
            <Textarea
              value={props.value}
              onChange={(e) => props.onChangeValue(e.target.value)}
              rows={4}
              placeholder="twelve words ..."
              className="resize-none"
              disabled={props.submitting}
            />
          </TabsContent>
          <TabsContent value="secret">
            <Input
              uiSize="md"
              value={props.value}
              onChange={(e) => props.onChangeValue(e.target.value)}
              placeholder="S..."
              autoComplete="off"
              spellCheck={false}
              disabled={props.submitting}
            />
          </TabsContent>
        </div>
      </Tabs>

      <div className="mt-2 min-h-[20px]">
        {props.validationError ? (
          <Text tone="error" size="sm">
            {props.validationError}
          </Text>
        ) : null}

        {props.submitError ? (
          <Text tone="error" size="sm">
            {props.submitError}
          </Text>
        ) : null}
      </div>

      <div className="mt-4">
        <Button
          uiSize="lg"
          className="w-full"
          disabled={!props.canSubmit}
          loading={props.submitting}
          onClick={props.onSubmit}
        >
          Import
        </Button>
      </div>
    </SubpageShell>
  );
}
