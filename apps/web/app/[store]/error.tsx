"use client";

import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@sellly/ui";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Something went wrong"
      description="We couldn't load this page right now. Your data is safe — try again in a moment."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
