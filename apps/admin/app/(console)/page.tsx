import { requireAdmin } from "@/lib/require-admin";
import { AdminOverview } from "@/components/admin-overview";
import { getAdminOverview } from "@/lib/admin-overview";

export default async function OverviewPage() {
  const staff = await requireAdmin();
  const overview = await getAdminOverview(staff);
  return <AdminOverview data={overview} />;
}
