import { getAdminData } from "@/lib/admin/queries";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const d = await getAdminData();
  return <ProductsManager products={d.products} categories={d.categories} />;
}
