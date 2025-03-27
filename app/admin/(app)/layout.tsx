"use client";

import React, { ReactNode, useState } from "react";

import { SidebarContext } from "./layout-context";
import { SidebarWrapper } from "./components/sidebar/sidebar-wrapper";
import { NavbarWrapper } from "./components/navbar_admin";
import { ModalUserStatus } from "./components/modal/modal-User-status";

export const Layout = ({ children }: { children: ReactNode }) => {
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
      <section className="flex bg-gray-100">
        <ModalUserStatus />
        <SidebarWrapper />
        <NavbarWrapper>{children}</NavbarWrapper>
      </section>
    </SidebarContext.Provider>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
