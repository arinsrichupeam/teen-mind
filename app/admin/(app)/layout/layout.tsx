"use client";

import { useState } from "react";

import { SidebarWrapper } from "../components/sidebar/sidebar";

import { SidebarContext } from "@/app/admin/(app)/layout/layout-context";
import { NavbarWrapper } from "@/app/admin/(app)/components/navbar_admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SidebarContext.Provider
      value={{
        collapsed: sidebarOpen,
        setCollapsed: handleToggleSidebar,
      }}
    >
      <section className="flex">
        <SidebarWrapper />
        <NavbarWrapper>{children}</NavbarWrapper>
      </section>
    </SidebarContext.Provider>
  );
}
