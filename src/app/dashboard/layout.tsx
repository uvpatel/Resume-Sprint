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
    <div className="dashboard-theme dark min-h-screen bg-[#08090a] text-[#f7f8f8] flex antialiased selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block">
        <DashboardSidebar userEmail={user.email} userName={user.name} />
      </div>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#08090a]">
        <DashboardHeader userEmail={user.email} userName={user.name} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
