import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { CustomersList } from "@/components/admin/CustomersList";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  await requirePermission("customers");
  const d = await getAdminData();
  return <CustomersList customers={d.customers} />;
}
