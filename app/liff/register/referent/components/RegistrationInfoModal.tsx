"use client";

import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import Image from "next/image";
import { Affiliation, Referent, Volunteer_Type } from "@prisma/client";

import { prefix } from "@/utils/data";

interface RegistrationInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReferent: Referent;
  affiliation: Affiliation[];
  volunteerType: Volunteer_Type[];
  qrCode: string;
  formRef: React.RefObject<HTMLFormElement>;
  setIsLoading: (loading: boolean) => void;
}

export default function RegistrationInfoModal({
  isOpen,
  onClose,
  selectedReferent,
  affiliation,
  volunteerType,
  qrCode,
  formRef,
  setIsLoading,
}: RegistrationInfoModalProps) {
  return (
    <Modal
      backdrop="blur"
      className="whitespace-nowrap sm:whitespace-normal"
      hideCloseButton={true}
      id="modal-content-1"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      placement="center"
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col items-center font-bold">
            ข้อมูลการลงทะเบียน อสท.
          </ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Divider />
            <div className="items-center flex justify-center box-border rounded-full bg-primary-100 font-semibold p-2 text-primary-600">
              <span className="">รหัสอ้างอิง {selectedReferent.id}</span>
            </div>
            <span>
              ชื่อ - นามสกุล : {prefix[selectedReferent.prefixId - 1]?.label}{" "}
              {selectedReferent?.firstname} {selectedReferent?.lastname}
            </span>
            <span>
              สังกัด :{" "}
              {
                affiliation.find((x) => x.id == selectedReferent.affiliation_id)
                  ?.name
              }
            </span>
            <span>หน่วยงาน : {selectedReferent?.agency}</span>
            <span>
              ประเภทอาสาสมัคร :{" "}
              {
                volunteerType.find(
                  (x) => x.id == selectedReferent.volunteer_type_id
                )?.name
              }
            </span>
            <Divider />
            <h1 className="text-center text-2xl font-bold text-red-500 ">
              กรุณาบันทึกหน้าจอนี้
            </h1>
            <Image
              alt="QR-Code"
              className="w-[200px] h-[200px] mx-auto"
              height={200}
              src={qrCode}
              width={200}
            />
            <Divider />
          </ModalBody>
          <ModalFooter className="flex justify-center">
            <Button
              color="primary"
              variant="solid"
              onPress={() => {
                onClose();
                formRef.current?.reset();
                setIsLoading(false);
              }}
            >
              ปิด
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
