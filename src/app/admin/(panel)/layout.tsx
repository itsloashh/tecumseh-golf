import { requireAdmin } from "@/lib/admin/session";
import { getAdminData } from "@/lib/admin/queries";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const data = await getAdminData();
  const counts = {
    orders: data.orders.filter((o) => o.status === "new").length,
    requests: data.requests.filter((r) => r.status === "new").length,
  };
  return <AdminShell email={admin.email} counts={counts} demo={data.demo}>{children}</AdminShell>;
}
