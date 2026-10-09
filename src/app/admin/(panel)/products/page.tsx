import { redirect } from "next/navigation";
import { getAdminData } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const me = await requireAdmin();
  const access = { edit: can(me, "products"), prices: can(me, "prices"), stock: can(me, "stock") };
  if (!access.edit && !access.prices && !access.stock) redirect("/admin?denied=1");
  const d = await getAdminData();
  return <ProductsManager products={d.products} categories={d.categories} access={access} lowAt={d.settings.notifications.lowStockAt} />;
}
