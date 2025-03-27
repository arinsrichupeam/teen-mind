import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { NavbarItem } from "@heroui/navbar";
import { Avatar } from "@heroui/avatar";
import { signOut, useSession } from "next-auth/react";

import { ProfileAdminData } from "@/types";

export const UserDropdown = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileAdminData>();

  const handleLogout = useCallback(async () => {
    signOut();
    router.replace("/admin/login");
  }, [router]);

  const GetProfile = useCallback(async () => {
    await fetch(`/api/profile/admin/${session?.user?.id}`)
      .then((res) => res.json())
      .then((val) => {
        setProfile(val);
      });
  }, [session, router]);

  useEffect(() => {
    if (status !== "loading") {
      if (status === "authenticated") {
        GetProfile();
      }
    }
  }, [session]);

  return (
    <Dropdown>
      <NavbarItem>
        <DropdownTrigger>
          <Avatar
            as="button"
            color="secondary"
            size="md"
            src={profile?.image}
          />
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu
        aria-label="User menu actions"
        // onAction={(actionKey) => console.log({ actionKey })}
      >
        <DropdownItem
          key="name"
          className="flex flex-col justify-start w-full items-start"
        >
          <p>
            {profile?.firstname} {profile?.lastname}
          </p>
          <p>{profile?.agency}</p>
        </DropdownItem>
        {/* <DropdownItem key="profile">My Profile</DropdownItem>
        <DropdownItem key="team_settings">Team Settings</DropdownItem>
        <DropdownItem key="analytics">Analytics</DropdownItem>
        <DropdownItem key="system">System</DropdownItem>
        <DropdownItem key="configurations">Configurations</DropdownItem>
        <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem> */}
        <DropdownItem
          key="logout"
          className="text-danger"
          color="danger"
          onPress={handleLogout}
        >
          ออกจากระบบ
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
