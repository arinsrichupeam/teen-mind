"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const ModalUserStatus = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session, status } = useSession();
  const router = useRouter();

  const GetProfile = async () => {
    const res = await fetch(`/api/profile/admin/${session?.user?.id}`);
    const data = await res.json();

    if (data == null) {
      router.push("/admin/register");
    } else if (data.status != 1) {
      onOpen();
    } else {
      // บันทึกข้อมูล profile ลงใน sessionStorage เฉพาะเมื่อข้อมูลเปลี่ยนแปลง
      const oldProfile = sessionStorage.getItem("adminProfile");
      const newProfile = JSON.stringify(data);
      if (oldProfile !== newProfile) {
        sessionStorage.setItem("adminProfile", newProfile);
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    if (status !== "loading") {
      if (status === "authenticated") {
        GetProfile();
      } else {
        router.push("/admin/login");
      }
    }
  }, [session, router]);

  return (
    <Modal
      backdrop={"blur"}
      hideCloseButton={true}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      placement={"center"}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              เข้าใช้งานระบบ
            </ModalHeader>
            <ModalBody>
              <p>User ของคุณ ไม่ได้รับอนุณาติเข้าใช้งาน</p>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" variant="solid" onPress={() => signOut()}>
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
