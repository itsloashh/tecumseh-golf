import { getAdminData } from "@/lib/admin/queries";
import { CustomersList } from "@/components/admin/CustomersList";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const d = await getAdminData();
  return <CustomersList customers={d.customers} />;
}
