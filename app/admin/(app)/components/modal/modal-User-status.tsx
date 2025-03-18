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
import { useCallback, useEffect } from "react";

export const ModalUserStatus = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session, status } = useSession();
  const router = useRouter();

  const GetProfile = useCallback(async () => {
    await fetch(`/api/profile/admin/${session?.user?.id}`)
      .then((res) => res.json())
      .then((val) => {
        if (val == null) {
          router.push("/admin/register");
        } else if (val.status != 1) {
          onOpen();
        }
      });
  }, [session, router, isOpen]);

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      GetProfile();
    }
  }, [session]);

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
