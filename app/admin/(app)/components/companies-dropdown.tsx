"use client";

import React, { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";

interface Company {
  name: string;
  location: string;
  logo: React.ReactNode;
}

export const CompaniesDropdown = () => {
  const [company, setCompany] = useState<Company>({
    name: "Acme Co.",
    location: "Palo Alto, CA",
    logo: <p />,
  });

  return (
    <Dropdown
      classNames={{
        base: "w-full min-w-[260px]",
      }}
    >
      <DropdownTrigger className="cursor-pointer">
        <div className="flex items-center gap-2">
          {company.logo}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-medium m-0 text-default-900 -mb-4 whitespace-nowrap">
              {company.name}
            </h3>
            <span className="text-xs font-medium text-default-500">
              {company.location}
            </span>
          </div>
          {/* <BottomIcon /> */}
        </div>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Avatar Actions"
        onAction={(e) => {
          if (e === "1") {
            setCompany({
              name: "Facebook",
              location: "San Fransico, CA",
              logo: <p />,
            });
          }
          if (e === "2") {
            setCompany({
              name: "Instagram",
              location: "Austin, Tx",
              logo: <p />,
            });
          }
          if (e === "3") {
            setCompany({
              name: "Twitter",
              location: "Brooklyn, NY",
              logo: <p />,
            });
          }
          if (e === "4") {
            setCompany({
              name: "Acme Co.",
              location: "Palo Alto, CA",
              logo: <p />,
            });
          }
        }}
      >
        <DropdownSection title="Companies">
          <DropdownItem
            key="1"
            classNames={{
              base: "py-4",
              title: "text-base font-semibold",
            }}
            description="San Fransico, CA"
            startContent={<p />}
          >
            Facebook
          </DropdownItem>
          <DropdownItem
            key="2"
            classNames={{
              base: "py-4",
              title: "text-base font-semibold",
            }}
            description="Austin, Tx"
            startContent={<p />}
          >
            Instagram
          </DropdownItem>
          <DropdownItem
            key="3"
            classNames={{
              base: "py-4",
              title: "text-base font-semibold",
            }}
            description="Brooklyn, NY"
            startContent={<p />}
          >
            Twitter
          </DropdownItem>
          <DropdownItem
            key="4"
            classNames={{
              base: "py-4",
              title: "text-base font-semibold",
            }}
            description="Palo Alto, CA"
            startContent={<p />}
          >
            Acme Co.
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};
