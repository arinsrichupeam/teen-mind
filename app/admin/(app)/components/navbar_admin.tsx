// import { Input, Link, Navbar, NavbarContent } from "@nextui-org/react";
import React from "react";
// import { FeedbackIcon } from "../icons/navbar/feedback-icon";
// import { GithubIcon } from "../icons/navbar/github-icon";
// import { SupportIcon } from "../icons/navbar/support-icon";
// import { SearchIcon } from "../icons/searchicon";
// import { BurguerButton } from "./burguer-button";
// import { NotificationsDropdown } from "./notifications-dropdown";
// import { UserDropdown } from "./user-dropdown";
import { Navbar, NavbarContent } from "@heroui/navbar";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";

import { GithubIcon, SearchIcon } from "../../../../components/icons";

import { NotificationsDropdown } from "./notifications-dropdown";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";

interface Props {
  children: React.ReactNode;
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
        <NavbarContent className="w-full max-md:hidden">
          <Input
            isClearable
            className="w-full"
            classNames={{
              input: "w-full",
              mainWrapper: "w-full",
            }}
            placeholder="Search..."
            startContent={<SearchIcon />}
          />
        </NavbarContent>
        <NavbarContent
          className="w-fit data-[justify=end]:flex-grow-0"
          justify="end"
        >
          {/* <div className="flex items-center gap-2 max-md:hidden">
            <FeedbackIcon />
            <span>Feedback?</span>
          </div> */}

          <NotificationsDropdown />

          {/* <div className="max-md:hidden"><SupportIcon /></div> */}

          <Link
            href="https://github.com/Siumauricio/nextui-dashboard-template"
            target={"_blank"}
          >
            <GithubIcon />
          </Link>
          <NavbarContent>
            <UserDropdown />
          </NavbarContent>
        </NavbarContent>
      </Navbar>
      {children}
    </div>
  );
};
