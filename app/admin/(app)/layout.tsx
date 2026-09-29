"use client";

import React, { ReactNode, useEffect, useState } from "react";

import { SidebarContext } from "./layout-context";
import { NavbarWrapper } from "./components/navbar-admin";
import { AdminAccessGate } from "./components/admin-access-gate";
import { SidebarWrapper } from "./components/sidebar/sidebar-wrapper";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

const Layout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);

      if (stored === "true") {
        setCollapsed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleMobile = () => {
    setMobileOpen((open) => !open);
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;

      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore storage errors
      }

      return next;
    });
  };

  return (
    <AdminAccessGate>
      <SidebarContext.Provider
        value={{
          mobileOpen,
          toggleMobile,
          collapsed,
          toggleCollapsed,
        }}
      >
        <section className="flex bg-gray-100">
          <SidebarWrapper />
          <NavbarWrapper>{children}</NavbarWrapper>
        </section>
      </SidebarContext.Provider>
    </AdminAccessGate>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
