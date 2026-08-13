import { AdminShell } from "@/components/admin/admin-shell";
import { requireCurrentActor } from "@/server/auth";
import { requireRole } from "@/server/authorization";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireCurrentActor();
  requireRole(actor, ["EDITOR", "REVIEWER", "ADMIN"]);
  return <AdminShell>{children}</AdminShell>;
}
