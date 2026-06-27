import { AdminNav } from "@/components/AdminNav";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  // The login page renders without the shell; middleware guards the rest.
  if (!admin) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col bg-ivory lg:flex-row">
      <AdminNav email={admin.email} />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
