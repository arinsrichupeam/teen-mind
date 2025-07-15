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

interface RegistrationDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationDescriptionModal({
  isOpen,
  onClose,
}: RegistrationDescriptionModalProps) {
  return (
    <Modal
      backdrop="blur"
      id="modal-content-2"
      isOpen={isOpen}
      placement="center"
      size="sm"
      onClose={onClose}
    >
      <ModalContent>
        {(onCloseModal2) => (
          <>
            <ModalHeader className="flex flex-col text-center">
              คำอธิบายการลงทะเบียน
            </ModalHeader>
            <ModalBody className="flex flex-col gap-2 text-sm">
              <Divider />
              <div>
                <p>
                  <span className="font-semibold">คุณสมบัติ</span>{" "}
                  ผู้ที่มีอายุระหว่าง 18 - 60 ปี{" "}
                </p>
              </div>
              <div>
                <span className="font-semibold">ขอบเขตงาน </span>
                <p className="indent-5">
                  <span className="font-semibold">
                    1. สำรวจภาวะสุขภาพจิตเด็กและวัยรุ่น{" "}
                  </span>{" "}
                  ด้วยการประเมินคัดกรองประเมินภาวะซึมเศร้าในวัยรุ่น (PHQ-A)
                </p>
                <p className="indent-5">
                  <span className="font-semibold">
                    2. ให้คำปรึกษาทางจิตวิทยา{" "}
                  </span>{" "}
                  กรณีคัดกรองพบความผิดปกติ (สำหรับนักจิตวิทยาเท่านั้น)
                </p>
              </div>
              <div>
                <p className="">
                  <span className="font-semibold">พื้นที่ดำเนินโครงการ</span>{" "}
                  เขตบางแค หนองแขม ทวีวัฒนา ตลิ่งชัน ภาษีเจริญ บางบอน
                  บางขุนเทียน เท่านั้น{" "}
                </p>
              </div>
              <div>
                <p className="">
                  <span className="font-semibold">ค่าตอบแทน</span>{" "}
                  50บาท/1แบบสอบถาม (จ่ายเป็นเงินก้อนเมื่อครบสัญญา)
                </p>
              </div>
              <Divider />
            </ModalBody>
            <ModalFooter className="flex justify-center">
              <Button color="primary" variant="solid" onPress={onCloseModal2}>
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
