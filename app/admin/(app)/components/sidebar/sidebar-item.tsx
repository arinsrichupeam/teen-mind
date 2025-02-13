import NextLink from "next/link";
import React from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";

import { useSidebarContext } from "@/app/admin/(app)/layout/layout-context";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const { setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };

  return (
    <NextLink
      className="text-default-400 active:bg-none max-w-full"
      href={href}
    >
      <Button
        className={clsx(
          isActive
            ? "bg-primary-100 [&_svg_path]:fill-primary-500"
            : "hover:bg-default-100",
          "flex gap-2 w-full min-h-[44px] h-full bg-transparent text-default-400 items-center justify-start px-3.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]"
        )}
        onPress={handleClick}
      >
        {icon}
        <span className="text-default-900">{title}</span>
      </Button>
    </NextLink>
  );
};
