import { requireAdmin } from "@/lib/admin/session";
import { MyAccount } from "@/components/admin/MyAccount";

export const metadata = { title: "My account" };

export default async function MePage() {
  const me = await requireAdmin();
  return <MyAccount me={me} />;
}
