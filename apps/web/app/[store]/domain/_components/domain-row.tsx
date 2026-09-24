"use client";

import { useState, useTransition } from "react";
import { Badge, Button, useToast } from "@sellly/ui";
import { ConfirmAction } from "../../_components/confirm-action";
import { verifyDomainAction, setPrimaryDomainAction, removeDomainAction } from "@/lib/actions/domains";
import type { Domain } from "@sellly/database";

const STATUS_VARIANT = { PENDING: "warning", VERIFIED: "success", FAILED: "error" } as const;

export function DomainRow({ storeSlug, domain }: { storeSlug: string; domain: Domain }) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(domain.status !== "VERIFIED");
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  function handleVerify() {
    setResult(null);
    startTransition(async () => {
      const res = await verifyDomainAction(storeSlug, domain.id);
      setResult(res.verified ? "Verified!" : "TXT record not found yet — DNS changes can take up to a few hours to propagate.");
      toast(res.verified ? { title: "Domain verified", description: domain.hostname } : { title: "Not verified yet", description: "We couldn't find the TXT record. DNS can take a few hours to propagate.", variant: "warning" });
    });
  }

  return (
    <li className="rounded-sm border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-small font-medium text-primary">{domain.hostname}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[domain.status]}>{domain.status}</Badge>
            {domain.isPrimary && <Badge variant="accent">Primary</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide setup" : "Show setup"}
          </Button>
          {domain.status === "VERIFIED" && !domain.isPrimary && (
            <Button size="sm" variant="secondary" onClick={() => startTransition(() => setPrimaryDomainAction(storeSlug, domain.id))} disabled={pending}>
              Make primary
            </Button>
          )}
          <ConfirmAction
            action={removeDomainAction.bind(null, storeSlug, domain.id)}
            triggerLabel="Remove"
            title={`Remove ${domain.hostname}?`}
            description="Your store stays available on its Sellly subdomain. You can reconnect this domain later."
            confirmLabel="Remove domain"
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 rounded-sm bg-secondary/60 p-3 text-caption text-muted">
          <p className="font-medium text-primary">1. Point your domain at Sellly</p>
          <p>Add a CNAME record: <code className="rounded bg-surface px-1">{domain.hostname}</code> → <code className="rounded bg-surface px-1">stores.sellly.app</code></p>
          <p className="font-medium text-primary">2. Verify ownership</p>
          <p>
            Add a TXT record: <code className="rounded bg-surface px-1">_sellly-verify.{domain.hostname}</code> with value{" "}
            <code className="rounded bg-surface px-1">{domain.verificationToken}</code>
          </p>
          <Button size="sm" onClick={handleVerify} disabled={pending} className="mt-1">
            {pending ? "Checking…" : "Verify now"}
          </Button>
          {result && <p className="text-caption text-primary">{result}</p>}
        </div>
      )}
    </li>
  );
}
