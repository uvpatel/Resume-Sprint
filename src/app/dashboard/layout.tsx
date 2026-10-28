import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    const h = await headers();
    const currentPath = h.get("x-pathname") || "/dashboard";
    redirect(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  return (
    <div className="dashboard-theme min-h-screen bg-[#F8FAFC] text-[#252525] flex flex-col md:flex-row antialiased selection:bg-[#EAF4FF] selection:text-[#147DD8]">
      {/* Sidebar Navigation (Desktop) - 250px refined compact sidebar */}
      <div className="hidden md:block shrink-0">
        <DashboardSidebar userEmail={user.email} userName={user.name} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <DashboardHeader userEmail={user.email} userName={user.name} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
