import React, { ReactNode } from "react";
import { Navbar, NavbarContent } from "@heroui/navbar";

import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";

interface Props {
  children: ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  return (
    <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <Navbar
        isBordered
        className="w-full"
        classNames={{
          wrapper: "w-full max-w-full",
        }}
      >
        <NavbarContent className="md:hidden">
          <BurguerButton />
        </NavbarContent>
        <NavbarContent className="w-full max-md:hidden" />
        <NavbarContent
          className="w-fit data-[justify=end]:flex-grow-0"
          justify="end"
        >
          <NavbarContent>
            <UserDropdown />
          </NavbarContent>
        </NavbarContent>
      </Navbar>
      {children}
    </div>
  );
};
