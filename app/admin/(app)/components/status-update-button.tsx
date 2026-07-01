"use client";

import { addToast, Button } from "@heroui/react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useDisclosure } from "@heroui/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { ModalStatusUpdate } from "./modal/modal-status-update";

import { ProfileAdminData } from "@/types";

interface StatusUpdateButtonProps {
  showForAllRoles?: boolean;
  onDataUpdate?: () => void;
}

export const StatusUpdateButton = ({
  showForAllRoles = false,
  onDataUpdate,
}: StatusUpdateButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();
  const [adminProfile, setAdminProfile] = useState<ProfileAdminData | null>(
    null
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // ดึงข้อมูล admin profile จาก sessionStorage หรือ API
  useEffect(() => {
    const getAdminProfile = async () => {
      const storedProfile = sessionStorage.getItem("adminProfile");

      if (storedProfile) {
        setAdminProfile(JSON.parse(storedProfile));
        setIsLoadingProfile(false);

        return;
      }

      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/profile/admin/${session.user.id}`);

          if (response.ok) {
            const profileData = await response.json();

            setAdminProfile(profileData);
            sessionStorage.setItem("adminProfile", JSON.stringify(profileData));
          }
        } catch (error) {
          addToast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้" + error,
            color: "danger",
          });
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    getAdminProfile();
  }, [session?.user?.id]);

  const isAdmin = adminProfile?.roleId === 4 || adminProfile?.roleId === 3;

  if (!isLoadingProfile && !isAdmin && !showForAllRoles) {
    return null;
  }

  return (
    <>
      <Button
        className="w-full sm:w-auto min-h-8 h-8 px-3 text-small shadow-sm"
        color="primary"
        isDisabled={isLoadingProfile}
        isLoading={isLoadingProfile}
        size="sm"
        startContent={
          !isLoadingProfile ? (
            <Cog6ToothIcon className="size-3.5 shrink-0" />
          ) : undefined
        }
        variant="bordered"
        onPress={onOpen}
      >
        ปรับสถานะ
      </Button>

      <ModalStatusUpdate
        isOpen={isOpen}
        onClose={onClose}
        onDataUpdate={onDataUpdate}
      />
    </>
  );
};
