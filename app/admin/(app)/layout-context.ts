"use client";

import { createContext, useContext } from "react";

interface SidebarContextValue {
  /** Mobile drawer open state */
  mobileOpen: boolean;
  toggleMobile: () => void;
  /** Desktop icon-rail collapsed state */
  collapsed: boolean;
  toggleCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  mobileOpen: false,
  toggleMobile: () => {},
  collapsed: false,
  toggleCollapsed: () => {},
});

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};
