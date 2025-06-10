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

import { ProfileAdminData } from "@/types";

export const UserDropdown = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileAdminData>(
    ProfileAdminDataInitData
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = useCallback(async () => {
    signOut();
    router.replace("/admin/login");
  }, [router]);

  const EditProfile = useCallback(
    async (e: any) => {
      await fetch("/api/profile/admin/" + e)
        .then((res) => res.json())
        .then((val) => {
          setProfile(val);
          onOpen();
        });
    },
    [profile]
  );

  const GetProfile = async () => {
    const data = sessionStorage.getItem("adminProfile");

    if (data) {
      setProfile(JSON.parse(data));
    }
  };

  const handleUserAction = useCallback(
    async (e: any) => {
      switch (e) {
        case "logout":
          handleLogout();
          break;
        case "profile":
          EditProfile(profile?.userId);
          break;
      }
    },
    [profile, router]
  );

  useEffect(() => {
    GetProfile();
  }, [sessionStorage]);

  return (
    <div>
      <ModalUserProfile
        Mode={"self"}
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
    </div>
  );
};
