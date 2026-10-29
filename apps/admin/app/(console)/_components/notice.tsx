/** Result banner for server actions, which redirect back with ?error= or ?done=. */
export function Notice({ error, done, messages }: { error?: string; done?: string; messages?: Record<string, string> }) {
  if (error) return <p className="rounded-lg border border-error/30 bg-error-soft px-4 py-2.5 text-small text-primary" role="alert">{error}</p>;
  if (done && messages?.[done]) return <p className="rounded-lg border border-success/30 bg-success-soft px-4 py-2.5 text-small text-primary" role="status">{messages[done]}</p>;
  return null;
}

/** Shown in place of protected data the staff member hasn't been approved to see. */
export function Restricted({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-small text-muted">{message}</div>;
}
