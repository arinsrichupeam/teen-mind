"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { SidebarContext } from "./layout-context";
import { NavbarWrapper } from "./components/navbar_admin";
import { ModalUserStatus } from "./components/modal/modal-User-status";
import { SidebarWrapper } from "./components/sidebar/sidebar-wrapper";

const Layout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        router.replace("/admin/login");
      }
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

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
