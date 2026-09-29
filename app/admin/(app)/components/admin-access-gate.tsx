"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { isApprovedAdminStatus } from "@/lib/admin-access";
import Loading from "@/app/loading";

type AccessState = "loading" | "allowed" | "denied";

/**
 * Gate for /admin/(app): render children only when ProfileAdmin.status is APPROVED.
 * Pending/disabled users never see the admin shell (sidebar/dashboard).
 */
export function AdminAccessGate({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("loading");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.replace("/admin/login");

        return;
      }

      if (!session?.user?.id) {
        router.replace("/admin/login");

        return;
      }

      try {
        const res = await fetch(`/api/profile/admin/${session.user.id}`);
        const data = await res.json();

        if (cancelled) return;

        if (data == null) {
          router.replace("/admin/register");

          return;
        }

        if (!isApprovedAdminStatus(data.status)) {
          sessionStorage.removeItem("adminProfile");
          setAccess("denied");

          return;
        }

        const newProfile = JSON.stringify(data);
        const oldProfile = sessionStorage.getItem("adminProfile");

        if (oldProfile !== newProfile) {
          sessionStorage.setItem("adminProfile", newProfile);
        }

        setAccess("allowed");
      } catch {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [session, status, router]);

  if (status === "loading" || access === "loading") {
    return <Loading />;
  }

  if (access === "denied") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 px-4">
        <Modal
          backdrop="blur"
          hideCloseButton={true}
          isDismissable={false}
          isKeyboardDismissDisabled={true}
          isOpen={true}
          placement="center"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  เข้าใช้งานระบบ
                </ModalHeader>
                <ModalBody>
                  <p>
                    บัญชีของคุณยังไม่ได้รับอนุญาตให้เข้าใช้งานระบบแอดมิน
                    กรุณารอการอนุมัติจากผู้ดูแลระบบ
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    color="primary"
                    variant="solid"
                    onPress={() => signOut({ callbackUrl: "/admin/login" })}
                  >
                    ปิด
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    );
  }

  return <>{children}</>;
}
