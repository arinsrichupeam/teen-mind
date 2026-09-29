import React from "react";
import { Button } from "@heroui/button";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { useSidebarContext } from "@/app/admin/(app)/layout-context";

export const BurguerButton = () => {
  const { toggleMobile } = useSidebarContext();

  return (
    <Button
      isIconOnly
      aria-label="เปิดเมนู"
      className="md:hidden"
      variant="light"
      onPress={toggleMobile}
    >
      <Bars3Icon className="size-8" />
    </Button>
  );
};
