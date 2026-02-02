import { useMemo, useState } from "react";
import { Input } from "@/popup/atoms/input.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { IconEye, IconEyeClosed } from "@tabler/icons-react";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
};

export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);

  const inputId = useMemo(
    () => `password-${Math.random().toString(16).slice(2)}`,
    [],
  );

  return (
    <div className="space-y-2">
      {props.label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {props.label}
        </label>
      )}

      <div className="relative">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          value={props.value}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          aria-invalid={props.error ? true : undefined}
          uiSize="lg"
          className="pr-10"
          onChange={(e) => props.onChange(e.currentTarget.value)}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
        >
          {visible
            ? <IconEyeClosed className="h-4 w-4" />
            : <IconEye className="h-4 w-4" />}
        </button>
      </div>

      {props.error
        ? (
          <Text size="sm" tone="error" className="mt-1">
            {props.error}
          </Text>
        )
        : null}
    </div>
  );
}
