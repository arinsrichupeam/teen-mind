import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { NavbarItem } from "@heroui/navbar";
import { signOut, useSession } from "next-auth/react";
import { CameraIcon } from "@heroicons/react/24/solid";
import { useDisclosure, User } from "@heroui/react";

import { ModalUserProfile } from "./modal/modal-user-profile";

import { ProfileAdminData } from "@/types";

const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  tel: "",
  affiliationId: 0,
  agency: "",
  employeeTypeId: 0,
  professional: "",
  license: "",
  status: 0,
  createdAt: "",
  updatedAt: "",
  roleId: 0,
};

export const UserDropdown = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileAdminData>(
    ProfileAdminDataInitData
  );
  const [mode, setMode] = useState("View");
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const handleLogout = useCallback(async () => {
    signOut();
    router.replace("/admin/login");
  }, [router]);

  const getProfile = useCallback(
    async (e: any) => {
      await fetch("/api/profile/admin/" + e)
        .then((res) => res.json())
        .then((val) => {
          setProfile(val);
          setMode("View");
          onOpen();
        });
    },
    [profile]
  );

  const handleUserAction = useCallback(
    async (e: any) => {
      switch (e) {
        case "logout":
          handleLogout();
          break;
        case "profile":
          getProfile(profile?.userId);
          break;
      }
    },
    [profile, router]
  );

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
    <>
      <ModalUserProfile
        Mode={"Edit"}
        Profile={profile}
        isOpen={isOpen}
        onClose={onClose}
        onReLoad={null}
      />
      <Dropdown>
        <NavbarItem>
          <DropdownTrigger>
            <User
              avatarProps={{
                src: profile?.image,
                fallback: (
                  <CameraIcon
                    className="animate-pulse w-6 h-6 text-default-500"
                    fill="currentColor"
                  />
                ),
              }}
              className="cursor-pointer"
              description={profile?.agency}
              name={
                (profile ? profile.firstname : "") +
                " " +
                (profile ? profile.lastname : "")
              }
            />
          </DropdownTrigger>
        </NavbarItem>
        <DropdownMenu
          aria-label="User menu actions"
          onAction={(actionKey) => handleUserAction(actionKey)}
        >
          <DropdownItem key="profile">ข้อมูลส่วนตัว</DropdownItem>
          <DropdownItem key="logout" className="text-danger" color="danger">
            ออกจากระบบ
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </>
  );
};
