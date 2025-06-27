"use client";

import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: () => void;
  onSubmit: (e: any) => void;
  request: boolean;
  mode?: "register" | "edit";
}

export default function VerificationModal({
  isOpen,
  onClose,
  onOpenChange,
  onSubmit,
  request,
  mode = "register",
}: VerificationModalProps) {
  return (
    <Modal
      backdrop="blur"
      id="modal-content-3"
      isOpen={isOpen}
      placement="center"
      size="sm"
      onClose={onClose}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 text-center">
              {mode === "register" ? "ตรวจสอบการลงทะเบียน" : "ค้นหาข้อมูลเพื่อแก้ไข"}
            </ModalHeader>
            <ModalBody>
              <Form
                className="flex flex-col gap-4 w-full p-5"
                onSubmit={onSubmit}
              >
                <Input
                  className="max-w-xl"
                  isRequired={request}
                  label="เลขบัตรประชาชน"
                  labelPlacement="inside"
                  name="citizenId"
                  placeholder="เลขบัตรประชาชน"
                  radius="md"
                  size="sm"
                  type="number"
                  variant="faded"
                />
                <Input
                  className="max-w-xl"
                  errorMessage="กรุณากรอกเบอร์โทรศัพท์"
                  isRequired={request}
                  label="เบอร์โทรศัพท์"
                  labelPlacement="inside"
                  name="tel"
                  placeholder="เบอร์โทรศัพท์"
                  radius="md"
                  size="sm"
                  type="number"
                  variant="faded"
                />
                <Button className="w-full" color="primary" type="submit">
                  {mode === "register" ? "ตรวจสอบ" : "ค้นหา"}
                </Button>
                <Button
                  className="w-full"
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  ปิด
                </Button>
              </Form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 