"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, FileText, Settings, Loader2 } from "lucide-react";

interface UserMenuProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user.name || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Sign-out failed:", err);
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3] transition-opacity hover:opacity-90 cursor-pointer"
        aria-label="User account menu"
      >
        <Avatar className="h-8 w-8 border border-[#E8E8E8]">
          {user.image && <AvatarImage src={user.image} alt={displayName} />}
          <AvatarFallback className="bg-[#EAF4FF] text-[#2996F3] text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg border border-[#E8E8E8] bg-white">
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold text-[#252525] truncate">{displayName}</p>
            {userEmail && (
              <p className="text-xs text-[#626262] font-mono truncate">{userEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-[#E8E8E8] my-1" />

        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#252525] hover:bg-[#F8FAFC] rounded cursor-pointer"
        >
          <LayoutDashboard className="h-4 w-4 text-[#626262]" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/dashboard/resumes")}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#252525] hover:bg-[#F8FAFC] rounded cursor-pointer"
        >
          <FileText className="h-4 w-4 text-[#626262]" />
          <span>My Resumes</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#252525] hover:bg-[#F8FAFC] rounded cursor-pointer"
        >
          <Settings className="h-4 w-4 text-[#626262]" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#E8E8E8] my-1" />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded cursor-pointer focus:bg-red-50 focus:text-red-700"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
          ) : (
            <LogOut className="h-4 w-4 text-red-600" />
          )}
          <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
