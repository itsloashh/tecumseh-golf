import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { ActivityLog } from "@/components/admin/ActivityLog";

export const metadata = { title: "Activity" };

export default async function ActivityPage() {
  await requirePermission("manager");
  const d = await getAdminData();
  return <ActivityLog entries={d.activity} />;
}
