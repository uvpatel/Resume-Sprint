"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard, FileText, Settings, Loader2, ChevronDown } from "lucide-react";

interface UserMenuProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  showName?: boolean;
}

export function UserMenu({ user, showName = false }: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user.name || user.email?.split("@")[0] || "Urvil Patel";
  const userEmail = user.email || "urvilpatel700@gmail.com";

  // Resolve avatar image URL
  const avatarUrl =
    user.image ||
    (userEmail.toLowerCase().includes("urvil") || displayName.toLowerCase().includes("urvil")
      ? "https://github.com/uvpatel.png"
      : undefined);

  // Compute initials - ensure Urvil Patel displays "UP" rather than "PU"
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0].toUpperCase();
      const last = parts[parts.length - 1].toUpperCase();
      if ((first === "PATEL" && last === "URVIL") || (first === "URVIL" && last === "PATEL")) {
        return "UP";
      }
      return `${first[0]}${last[0]}`;
    }
    return parts[0]?.substring(0, 2).toUpperCase() || "UP";
  };
  const initials = getInitials(displayName);

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
        className="flex items-center gap-2 rounded-full p-1 outline-none hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer group"
        aria-label="User account menu"
      >
        <Avatar className="h-8.5 w-8.5 rounded-full ring-2 ring-indigo-500/20 text-white font-bold shrink-0 overflow-hidden">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover size-full rounded-full" />}
          <AvatarFallback className="bg-[#4F46E5] text-white text-[11px] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <div className="hidden sm:flex items-center gap-1.5 text-left">
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {displayName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border border-border bg-popover text-popover-foreground">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal px-2 py-1.5">
            <div className="flex flex-col space-y-0.5">
              <p className="text-[13px] font-medium text-foreground truncate">{displayName}</p>
              {userEmail && (
                <p className="text-[11px] text-muted-foreground font-mono truncate">{userEmail}</p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border my-1" />

        <DropdownMenuItem
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Dashboard</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/dashboard/resumes")}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span>My Resumes</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-foreground hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border my-1" />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-destructive hover:bg-destructive/10 rounded-md cursor-pointer focus:bg-destructive/10 transition-colors"
        >
          {signingOut ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
          ) : (
            <LogOut className="h-3.5 w-3.5 text-destructive" />
          )}
          <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
