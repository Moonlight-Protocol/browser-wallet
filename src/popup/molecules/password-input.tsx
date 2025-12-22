import { useMemo, useState } from "react";
import { Input } from "@/popup/atoms/input.tsx";
import { Text } from "@/popup/atoms/text.tsx";
import { cn } from "@/popup/utils/cn.ts";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  error?: string;
};

export function PasswordInput(props: Props) {
  const [visible, setVisible] = useState(false);

  const inputId = useMemo(
    () => `password-${Math.random().toString(16).slice(2)}`,
    []
  );

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm text-muted">
        {props.label}
      </label>

      <div className="mt-2 flex items-stretch gap-0">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          value={props.value}
          autoComplete={props.autoComplete}
          aria-invalid={props.error ? true : undefined}
          uiSize="sm"
          onChange={(e) => props.onChange(e.currentTarget.value)}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-muted",
            "bg-background px-2",
            "text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary"
          )}
        >
          {visible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M2 2l20 20" />
              <path d="M10.5 10.5a2 2 0 0 0 2.83 2.83" />
              <path d="M6.11 6.11C3.73 7.74 2 10.5 2 12c0 0 3.5 7 10 7 1.45 0 2.79-.27 4-.73" />
              <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.11 4.31" />
              <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {props.error ? (
        <Text size="sm" tone="error" className="mt-1">
          {props.error}
        </Text>
      ) : null}
    </div>
  );
}
