import { requireAdmin } from "@/lib/admin/session";
import { getAdminData } from "@/lib/admin/queries";
import { can } from "@/lib/admin/permissions";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const data = await getAdminData();
  const counts = {
    orders: can(me, "orders") ? data.orders.filter((o) => o.status === "new").length : 0,
    requests: can(me, "bookings") ? data.requests.filter((r) => r.status === "new").length : 0,
  };
  return <AdminShell me={me} counts={counts} demo={data.demo}>{children}</AdminShell>;
}
