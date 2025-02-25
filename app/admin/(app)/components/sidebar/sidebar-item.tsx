import React from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Button, Link } from "@heroui/react";

import { useSidebarContext } from "@/app/admin/(app)/layout-context";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const { setCollapsed } = useSidebarContext();
  const route = useRouter();

  const handleClick = (e: string) => {
    route.push(e);
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };

  return (
    <Button
      as={Link}
      className={clsx(
        isActive
          ? "bg-primary-100 [&_svg_path]:fill-primary-500"
          : "hover:bg-default-100",
        "flex gap-2 w-full min-h-[44px] h-full bg-transparent text-default-400 items-center justify-start px-3.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.98]"
      )}
      onPress={() => handleClick(href)}
    >
      {icon}
      <span className="text-default-900">{title}</span>
    </Button>
  );
};
