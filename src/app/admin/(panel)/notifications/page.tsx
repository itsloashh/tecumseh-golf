import { getAdminData } from "@/lib/admin/queries";
import { requirePermission } from "@/lib/admin/session";
import { NotificationsEditor } from "@/components/admin/NotificationsEditor";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requirePermission("notifications");
  const d = await getAdminData();
  return <NotificationsEditor settings={d.settings.notifications} team={d.team} emailReady={d.emailReady} envFallback={process.env.NOTIFY_TO ?? ""} />;
}
