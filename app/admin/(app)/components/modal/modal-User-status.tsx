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
import { useCallback, useEffect } from "react";

export const ModalUserStatus = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { data: session, status } = useSession();

  const GetProfile = useCallback(async () => {
    await fetch(`/api/profile/admin/${session?.user?.id}`)
      .then((res) => res.json())
      .then((val) => {
        if (val.status != 1) {
          onOpen();
        }
      });
  }, [session]);

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
