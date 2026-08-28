"use client";

import { Button } from "@/components/ui/button";

export function ConfirmSubmit({
  message,
  label,
  variant = "danger",
}: {
  message: string;
  label: string;
  variant?: "danger" | "secondary";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size="sm"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </Button>
  );
}
