"use client";

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

interface ReferentQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Referent;
  affiliation: Affiliation[];
  volunteerType: Volunteer_Type[];
}

export default function ReferentQRCodeModal({
  isOpen,
  onClose,
  data,
  affiliation,
  volunteerType,
}: ReferentQRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && data?.id !== undefined && data?.id !== null) {
      generateQR();
    }
  }, [isOpen, data?.id]);

  const generateQR = async () => {
    if (data?.id === undefined || data?.id === null) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        color: "danger",
        description: "ไม่พบข้อมูล referent ที่ถูกต้อง",
      });

      return;
    }

    setIsLoading(true);
    try {
      const qrCodeUrl = await generateQRCode(
        `https://liff.line.me/1656886344-OopvvNmA/liff/register?ref=${data.id}`
      );

      setQrCode(qrCodeUrl);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาดในการสร้าง QR Code",
        color: "danger",
        description: error as string,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidData = data?.id !== undefined && data?.id !== null;

  const shouldOpenModal = isOpen && isValidData;

  return (
    <Modal
      backdrop="blur"
      className="whitespace-nowrap sm:whitespace-normal"
      hideCloseButton={true}
      id="modal-content-4"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={shouldOpenModal}
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
            {!isValidData ? (
              <div className="text-center text-red-500">กำลังโหลดข้อมูล...</div>
            ) : (
              <>
                <div className="items-center flex justify-center box-border rounded-full bg-primary-100 font-semibold p-2 text-primary-600">
                  <span className="">รหัสอ้างอิง {data.id}</span>
                </div>
                <span>
                  ชื่อ - นามสกุล : {prefix[data.prefixId - 1]?.label}{" "}
                  {data.firstname} {data.lastname}
                </span>
                <span>
                  สังกัด :{" "}
                  {affiliation.find((x) => x.id == data.affiliation_id)?.name}
                </span>
                <span>หน่วยงาน : {data.agency}</span>
                <span>
                  ประเภทอาสาสมัคร :{" "}
                  {
                    volunteerType.find((x) => x.id == data.volunteer_type_id)
                      ?.name
                  }
                </span>
                <Divider />
                <h1 className="text-center text-2xl font-bold text-red-500 ">
                  กรุณาบันทึกหน้าจอนี้
                </h1>
                {isLoading ? (
                  <div className="flex justify-center items-center h-[200px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                      <p>กำลังสร้าง QR Code...</p>
                    </div>
                  </div>
                ) : qrCode ? (
                  <Image
                    alt="QR-Code"
                    className="w-[200px] h-[200px] mx-auto"
                    height={200}
                    src={qrCode}
                    width={200}
                  />
                ) : (
                  <div className="text-center text-red-500">
                    ไม่สามารถสร้าง QR Code ได้
                  </div>
                )}
                <Divider />
              </>
            )}
          </ModalBody>
          <ModalFooter className="flex justify-center">
            <Button
              color="primary"
              variant="solid"
              onPress={() => {
                onClose();
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
