import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { TeamManager } from "@/components/admin/TeamManager";

export const metadata = { title: "Team & access" };

export default async function TeamPage() {
  const me = await requirePermission("manager");
  const d = await getAdminData();
  return <TeamManager team={d.team} myId={me.id} />;
}
