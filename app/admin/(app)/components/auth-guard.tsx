"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addToast } from "@heroui/react";

import { ProfileAdminData } from "@/types";
import Loading from "@/app/loading";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: number[];
  redirectTo?: string;
}

export const AuthGuard = ({
  children,
  allowedRoles = [],
  redirectTo = "/admin",
}: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminProfile, setAdminProfile] = useState<ProfileAdminData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.replace("/admin/login");

        return;
      }

      if (status === "authenticated" && session?.user?.id) {
        try {
          // ตรวจสอบจาก sessionStorage ก่อน
          const storedProfile = sessionStorage.getItem("adminProfile");

          if (storedProfile) {
            const profile = JSON.parse(storedProfile);

            setAdminProfile(profile);

            // ตรวจสอบสิทธิ์
            if (
              allowedRoles.length > 0 &&
              !allowedRoles.includes(profile.roleId)
            ) {
              router.replace(redirectTo);

              return;
            }
          } else {
            // ดึงข้อมูลจาก API
            const response = await fetch(
              `/api/profile/admin/${session.user.id}`
            );

            if (response.ok) {
              const profile = await response.json();

              setAdminProfile(profile);

              // บันทึกลง sessionStorage
              sessionStorage.setItem("adminProfile", JSON.stringify(profile));

              // ตรวจสอบสิทธิ์
              if (
                allowedRoles.length > 0 &&
                !allowedRoles.includes(profile.roleId)
              ) {
                router.replace(redirectTo);

                return;
              }
            } else {
              router.replace("/admin/register");

              return;
            }
          }
        } catch (error) {
          addToast({
            title: "เกิดข้อผิดพลาด",
            description: "กรุณาลองใหม่อีกครั้ง" + error,
            color: "danger",
          });

          router.replace("/admin/login");
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [status, session, router, allowedRoles, redirectTo]);

  if (status === "loading" || isLoading) {
    return <Loading />;
  }

  if (!adminProfile) {
    return <Loading />;
  }

  return <>{children}</>;
};
