import { getAdminData } from "@/lib/admin/queries";
import { StoreEditor } from "@/components/admin/StoreEditor";

export const metadata = { title: "Store" };

export default async function StorePage() {
  const d = await getAdminData();
  return <StoreEditor settings={d.settings} services={d.services} stripeReady={d.stripeReady} />;
}
