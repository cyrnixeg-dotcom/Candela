import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin&error=admin_required");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0F0F0F", color: "#E0E0E0", fontFamily: "'Jost', sans-serif" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto ml-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
