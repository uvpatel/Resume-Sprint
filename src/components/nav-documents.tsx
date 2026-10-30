"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FolderIcon, MoreHorizontalIcon } from "lucide-react";

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-zinc-500 uppercase text-[10px] tracking-wider font-bold">
        Documents & Inventory
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              render={<Link href={item.url} />}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            >
              {item.icon || <FolderIcon className="size-4" />}
              <span className="truncate">{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/dashboard/resumes" />}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <MoreHorizontalIcon className="size-4" />
            <span>All Documents</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
