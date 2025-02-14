import { BellIcon } from "@heroicons/react/24/outline";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import { NavbarItem } from "@heroui/navbar";
import React from "react";

export const NotificationsDropdown = () => {
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <NavbarItem>
          <BellIcon className="size-6" />
        </NavbarItem>
      </DropdownTrigger>
      <DropdownMenu aria-label="Avatar Actions" className="w-80">
        <DropdownSection title="Notificacions">
          <DropdownItem
            key="1"
            classNames={{
              base: "py-2",
              title: "text-base font-semibold",
            }}
            description="Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim."
          >
            📣 Edit your information
          </DropdownItem>
          <DropdownItem
            key="2"
            classNames={{
              base: "py-2",
              title: "text-base font-semibold",
            }}
            description="Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim."
          >
            🚀 Say goodbye to paper receipts!
          </DropdownItem>
          <DropdownItem
            key="3"
            classNames={{
              base: "py-2",
              title: "text-base font-semibold",
            }}
            description="Sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim."
          >
            📣 Edit your information
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};
