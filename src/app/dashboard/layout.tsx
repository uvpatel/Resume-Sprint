import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getResumesByUserId } from "@/lib/db/repository";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

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

  const resumes = await getResumesByUserId(user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-600">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar
          user={{
            name: user.name,
            email: user.email,
            image: user.image || "https://github.com/uvpatel.png",
          }}
          resumes={resumes.map((r) => ({
            id: r.id,
            originalFileName: r.originalFileName,
            fileType: r.fileType,
          }))}
        />
        <SidebarInset className="bg-[#F8FAFC] dark:bg-zinc-950 flex flex-col min-w-0">
          <SiteHeader
            user={{
              name: user.name,
              email: user.email,
              image: user.image || "https://github.com/uvpatel.png",
            }}
          />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-[1440px] mx-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
