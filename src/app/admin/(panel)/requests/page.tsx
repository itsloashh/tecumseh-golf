import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { RequestsManager } from "@/components/admin/RequestsManager";

export const metadata = { title: "Bookings" };

export default async function RequestsPage() {
  await requirePermission("bookings");
  const d = await getAdminData();
  return <RequestsManager requests={d.requests} />;
}
