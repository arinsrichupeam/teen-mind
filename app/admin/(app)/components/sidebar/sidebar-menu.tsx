import React from "react";
import clsx from "clsx";

import { useSidebarContext } from "@/app/admin/(app)/layout-context";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const SidebarMenu = ({ title, children }: Props) => {
  const { collapsed } = useSidebarContext();

  return (
    <div
      className={clsx(
        "flex gap-2 flex-col",
        collapsed && "md:items-center md:w-full"
      )}
    >
      <span className={clsx("text-xs font-normal", collapsed && "md:sr-only")}>
        {title}
      </span>
      {children}
    </div>
  );
};
