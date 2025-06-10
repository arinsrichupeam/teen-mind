import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { Affiliation, Referent, Volunteer_Type } from "@prisma/client";
import Image from "next/image";

import { prefix } from "@/utils/data";
import { generateQRCode } from "@/utils/qrcode";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Referent;
  affiliation: Affiliation[];
  volunteerType: Volunteer_Type[];
}

const ReferentQRCodeModal = ({
  isOpen,
  onClose,
  data,
  affiliation,
  volunteerType,
}: ModalProps) => {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      const qrCodeUrl = await generateQRCode(
        "https://liff.line.me/1656886344-OopvvNmA"
      );

      setQrCode(qrCodeUrl);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาดในการสร้าง QR Code",
        color: "danger",
        description: error as string,
      });
    }
  };

  return (
    <Modal
      backdrop="blur"
      className="whitespace-nowrap sm:whitespace-normal"
      hideCloseButton={true}
      id="modal-content-4"
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
            ข้อมูล อสท.
          </ModalHeader>
          <ModalBody className="flex flex-col gap-2">
            <Divider />
            <div className="items-center flex justify-center box-border rounded-full bg-primary-100 font-semibold p-2 text-primary-600">
              <span className="">รหัสอ้างอิง {data?.id}</span>
            </div>
            <span>
              ชื่อ - นามสกุล : {prefix[data?.prefixId - 1]?.label}{" "}
              {data?.firstname} {data?.lastname}
            </span>
            <span>
              สังกัด :{" "}
              {affiliation.find((x) => x.id == data?.affiliation_id)?.name}
            </span>
            <span>หน่วยงาน : {data?.agency}</span>
            <span>
              ประเภทอาสาสมัคร :{" "}
              {volunteerType.find((x) => x.id == data?.volunteer_type_id)?.name}
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
                // formRef.current?.reset();
                //   setIsLoading(false);
              }}
            >
              ปิด
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default ReferentQRCodeModal;
