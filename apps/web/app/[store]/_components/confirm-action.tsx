"use client";

import * as React from "react";
import { Button, Modal } from "@sellly/ui";

/** Destructive actions ask once, in a dialog, with the safe option on the left. */
export function ConfirmAction({
  action,
  triggerLabel,
  title,
  description,
  confirmLabel,
  triggerSize = "sm",
}: {
  action: () => void | Promise<void>;
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel: string;
  triggerSize?: "sm" | "default";
}) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" variant="secondary" size={triggerSize} onClick={() => setOpen(true)} className="text-error hover:text-error">
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={title}
        description={description}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={close}>
              Keep it
            </Button>
            <form action={action} onSubmit={close}>
              <Button type="submit" variant="destructive">
                {confirmLabel}
              </Button>
            </form>
          </>
        }
      />
    </>
  );
}
