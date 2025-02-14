import React from "react";
import { Button } from "@heroui/button";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { useSidebarContext } from "@/app/admin/(app)/layout-context";

export const BurguerButton = () => {
  const { setCollapsed } = useSidebarContext();

  return (
    <Button isIconOnly variant="light" onPress={() => setCollapsed()}>
      <Bars3Icon className="size-8" />
    </Button>
  );
};
