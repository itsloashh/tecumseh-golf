import { getAdminData } from "@/lib/admin/queries";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const d = await getAdminData();
  return <OrdersManager orders={d.orders} emailReady={d.emailReady} />;
}
