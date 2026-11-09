import Link from "next/link";
import { EmptyState } from "@sellly/ui";

export default function DevPreviewNotBuilt({ params }: { params: { path: string[] } }) {
  return (
    <EmptyState
      title="Not in the UI preview yet"
      description={`“${params.path.join("/")}” isn't set up with sample data. Overview, Orders and Products are.`}
      action={
        <Link href="/dev-preview/overview" className="text-small font-medium text-brand">
          Back to Overview
        </Link>
      }
    />
  );
}
