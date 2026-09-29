import React from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Button, Link, Tooltip } from "@heroui/react";

import { useSidebarContext } from "@/app/admin/(app)/layout-context";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const { toggleMobile, collapsed } = useSidebarContext();
  const route = useRouter();

  const handleClick = (e: string) => {
    route.push(e);
    if (window.innerWidth < 768) {
      toggleMobile();
    }
  };

  const button = (
    <Button
      aria-label={title}
      as={Link}
      className={clsx(
        isActive
          ? "bg-primary-100 [&_svg_path]:fill-primary-500"
          : "hover:bg-default-100",
        "flex gap-2 w-full min-h-[44px] h-full bg-transparent text-default-400 items-center px-3.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]",
        collapsed ? "md:justify-center md:px-0 md:min-w-11" : "justify-start"
      )}
      onPress={() => handleClick(href)}
    >
      {icon}
      <span
        className={clsx(
          "text-default-900 whitespace-nowrap",
          collapsed && "md:hidden"
        )}
      >
        {title}
      </span>
    </Button>
  );

  if (!collapsed) {
    return button;
  }

  return (
    <Tooltip content={title} placement="right">
      <div className="w-full max-md:contents md:flex md:justify-center">
        {button}
      </div>
    </Tooltip>
  );
};
