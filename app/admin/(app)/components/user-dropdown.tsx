"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { NavbarItem } from "@heroui/navbar";
import { signOut } from "next-auth/react";
import { CameraIcon } from "@heroicons/react/24/solid";
import { useDisclosure, User } from "@heroui/react";

import { ProfileAdminDataInitData } from "../../../../types/initData";

import { ModalUserProfile } from "./modal/modal-user-profile";

import {
  getAdminRoleLabel,
  readStoredAdminProfile,
} from "@/lib/admin-profile-client";
import { ProfileAdminData } from "@/types";

export const UserDropdown = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileAdminData>(
    () => readStoredAdminProfile() ?? ProfileAdminDataInitData
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = useCallback(async () => {
    sessionStorage.clear();
    signOut();
    router.replace("/admin/login");
  }, [router]);

  const EditProfile = useCallback(
    async (userId: string) => {
      await fetch("/api/profile/admin/" + userId)
        .then((res) => res.json())
        .then((val) => {
          setProfile(val);
          onOpen();
        });
    },
    [onOpen]
  );

  const GetProfile = async () => {
    const data = readStoredAdminProfile();

    if (data) {
      setProfile(data);
    }
  };

  const handleUserAction = useCallback(
    async (action: "logout" | "profile") => {
      switch (action) {
        case "logout":
          handleLogout();
          break;
        case "profile":
          EditProfile(profile?.userId);
          break;
      }
    },
    [profile, handleLogout, EditProfile]
  );

  useEffect(() => {
    GetProfile();
  }, []);

  const roleLabel = getAdminRoleLabel(profile);
  const facilityLabel = profile?.agency?.trim() || "";
  const description = [roleLabel, facilityLabel].filter(Boolean).join(" · ");

  return (
    <div>
      <ModalUserProfile
        Mode={"self"}
        Profile={profile}
        isOpen={isOpen}
        onClose={onClose}
        onReLoad={() => {
          void GetProfile();
        }}
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
              description={description || undefined}
              name={
                (profile ? profile.firstName : "") +
                " " +
                (profile ? profile.lastName : "")
              }
            />
          </DropdownTrigger>
        </NavbarItem>
        <DropdownMenu
          aria-label="User menu actions"
          onAction={(actionKey) =>
            handleUserAction(actionKey as "logout" | "profile")
          }
        >
          <DropdownItem key="profile">ข้อมูลส่วนตัว</DropdownItem>
          <DropdownItem key="logout" className="text-danger" color="danger">
            ออกจากระบบ
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
