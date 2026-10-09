import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { StoreEditor } from "@/components/admin/StoreEditor";

export const metadata = { title: "Website content" };

export default async function StorePage() {
  await requirePermission("content");
  const d = await getAdminData();
  return <StoreEditor settings={d.settings} services={d.services} stripeReady={d.stripeReady} />;
}
