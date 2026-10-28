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
        className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity hover:opacity-90 cursor-pointer"
        aria-label="User account menu"
      >
        <Avatar className="h-7 w-7 border border-border">
          {user.image && <AvatarImage src={user.image} alt={displayName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border border-border bg-popover text-popover-foreground">
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-0.5">
            <p className="text-[13px] font-medium text-foreground truncate">{displayName}</p>
            {userEmail && (
              <p className="text-[11px] text-muted-foreground font-mono truncate">{userEmail}</p>
            )}
          </div>
        </DropdownMenuLabel>

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
