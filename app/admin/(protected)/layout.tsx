import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Middleware already guards this, but a direct server-side check keeps
  // this layout safe even if middleware config ever drifts.
  if (!session) redirect("/admin/login");

  return <AdminShell adminName={session.email}>{children}</AdminShell>;
}
