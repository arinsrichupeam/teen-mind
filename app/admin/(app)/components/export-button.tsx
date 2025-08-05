"use client";

import { addToast, Button } from "@heroui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useDisclosure } from "@heroui/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { ModalExportData } from "./modal/modal-export-data";

import { ProfileAdminData } from "@/types";

interface ExportButtonProps {
  data: any[];
  showForAllRoles?: boolean; // ถ้าเป็น true จะแสดงสำหรับทุก role
}

export const ExportButton = ({
  data,
  showForAllRoles = false,
}: ExportButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session } = useSession();
  const [adminProfile, setAdminProfile] = useState<ProfileAdminData | null>(
    null
  );

  // ดึงข้อมูล admin profile จาก sessionStorage หรือ API
  useEffect(() => {
    const getAdminProfile = () => {
      // ตรวจสอบจาก sessionStorage ก่อน
      const storedProfile = sessionStorage.getItem("adminProfile");

      if (storedProfile) {
        setAdminProfile(JSON.parse(storedProfile));

        return;
      }

      // ถ้าไม่มีใน sessionStorage ให้ดึงจาก API
      const fetchAdminProfile = async () => {
        if (session?.user?.id) {
          try {
            const response = await fetch(
              `/api/profile/admin/${session.user.id}`
            );

            if (response.ok) {
              const profileData = await response.json();

              setAdminProfile(profileData);
              // บันทึกลง sessionStorage
              sessionStorage.setItem(
                "adminProfile",
                JSON.stringify(profileData)
              );
            }
          } catch (error) {
            addToast({
              title: "เกิดข้อผิดพลาด",
              description: "ไม่สามารถดึงข้อมูลผู้ใช้งานได้" + error,
              color: "danger",
            });
          }
        }
      };

      fetchAdminProfile();
    };

    getAdminProfile();
  }, [session?.user?.id]);

  // ตรวจสอบว่าเป็น admin หรือไม่ (roleId === 4 หรือ roleId === 3)
  const isAdmin = adminProfile?.roleId === 4 || adminProfile?.roleId === 3;

  // แสดง loading state ขณะดึงข้อมูล profile
  if (!adminProfile && !showForAllRoles) {
    return null;
  }

  // ถ้าไม่ใช่ admin และไม่ได้ตั้งค่าให้แสดงสำหรับทุก role
  if (!isAdmin && !showForAllRoles) {
    return null;
  }

  return (
    <>
      <Button
        color="success"
        isDisabled={false}
        size="md"
        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
        variant="bordered"
        onPress={onOpen}
        // isDisabled={!isAdmin}
      >
        Excel
      </Button>

      <ModalExportData
        data={data}
        dataType="question"
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};
