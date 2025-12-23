import { Input } from "@/popup/atoms/input.tsx";
import { CheckIcon, XIcon } from "@/popup/icons/index.tsx";

export type AccountRenameInlineProps = {
  value: string;
  setValue: (next: string) => void;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AccountRenameInline(props: AccountRenameInlineProps) {
  const canConfirm = !props.busy && Boolean(props.value.trim());

  return (
    <div className="flex items-center gap-2">
      <Input
        uiSize="sm"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            props.onConfirm();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            props.onCancel();
          }
        }}
      />
      <button
        type="button"
        aria-label="Confirm"
        disabled={!canConfirm}
        onClick={(e) => {
          e.stopPropagation();
          props.onConfirm();
        }}
        className="text-primary disabled:opacity-50"
      >
        <CheckIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Cancel"
        disabled={props.busy}
        onClick={(e) => {
          e.stopPropagation();
          props.onCancel();
        }}
        className="text-muted disabled:opacity-50"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
