"use client";

import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@sellly/ui";

export default function ConsoleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Something went wrong"
      description="This page could not load. If it keeps happening, check System health and the deployment logs."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
