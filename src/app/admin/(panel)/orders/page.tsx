import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  await requirePermission("orders");
  const d = await getAdminData();
  return <OrdersManager orders={d.orders} emailReady={d.emailReady && d.settings.notifications.customerReady} />;
}
