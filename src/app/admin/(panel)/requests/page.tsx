import { getAdminData } from "@/lib/admin/queries";
import { RequestsManager } from "@/components/admin/RequestsManager";

export const metadata = { title: "Bookings" };

export default async function RequestsPage() {
  const d = await getAdminData();
  return <RequestsManager requests={d.requests} />;
}
