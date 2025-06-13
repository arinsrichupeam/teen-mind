"use client";

import {
  addToast,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Affiliation,
  Employee_Type,
  Referent,
  Volunteer_Type,
} from "@prisma/client";
import React from "react";
import Image from "next/image";

import ReferentQRCodeModal from "../../componant/modalReferent";

import { title } from "@/components/primitives";
import { prefix } from "@/utils/data";
import { validateCitizen, validateEmail } from "@/utils/helper";
import { generateQRCode } from "@/utils/qrcode";
import { referentInitValue } from "@/types/initData";

export default function ReferentPage() {
  const request = true;
  const [error, setError] = useState<string>("");

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedReferent, setSelectedReferent] =
    useState<Referent>(referentInitValue);
  // const [selectVerification, setSelectVerification] =
  //   useState<Referent>(referentInitValue);
  const [referent, setReferent] = useState<Referent>(referentInitValue);
  const [volunteerType, setvolunteerType] = useState<Volunteer_Type[]>([]);
  const [employeeType, setEmployeeType] = useState<Employee_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenModal2,
    onOpen: onOpenModal2,
    onClose: onCloseModal2,
  } = useDisclosure();
  const {
    isOpen: isOpenModal3,
    onOpen: onOpenModal3,
    onClose: onCloseModal3,
    onOpenChange,
  } = useDisclosure();

  const {
    isOpen: isOpenModal4,
    onOpen: onOpenModal4,
    onClose: onCloseModal4,
  } = useDisclosure();

  const GetvolunteerType = useCallback(async () => {
    await fetch("/api/data/volunteer")
      .then((res) => res.json())
      .then((data) => {
        setvolunteerType(data);
      });
  }, [volunteerType]);

  const GetEmployeeType = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((data) => {
        setEmployeeType(data);
      });
  }, [employeeType]);

  const GetAffiliation = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((data) => {
        setAffiliation(data);
      });
  }, [affiliation]);

  const handleVerification = useCallback(
    async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        citizenId: formData.get("citizenId"),
        tel: formData.get("tel"),
      };

      await fetch(`/api/data/referent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const referent = data[0];

            referent.affiliation_id = affiliation.find(
              (x) => x.name === referent.affiliation.name
            )?.id;
            referent.volunteer_type_id = volunteerType.find(
              (x) => x.name === referent.volunteer_type.name
            )?.id;
            setReferent(referent);
            onOpenModal4();
          } else {
            addToast({
              title: "แจ้งเตือน",
              color: "danger",
              description: "ไม่พบข้อมูลการลงทะเบียน",
            });
            onCloseModal3();
          }
        });
    },
    [selectedReferent, onOpen, affiliation, volunteerType]
  );

  const validateCitizenId = async (value: string) => {
    // ตรวจสอบความยาวต้องเป็น 13 หลัก
    if (!value || value.length !== 13) {
      setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");

      return false;
    }

    // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
    const isDigit = /^[0-9]*$/.test(value);

    if (!isDigit) {
      setError("เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น");

      return false;
    }

    // ตรวจสอบเลขตรวจสอบ
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(value.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;

    if (checksum !== parseInt(value.charAt(12))) {
      setError("กรอกเลขบัตรประชาชนไม่ถูกต้อง");

      return false;
    }

    // ตรวจสอบการซ้ำซ้อนในระบบ
    const result = await validateCitizen(value, "referent");

    if (result !== true) {
      setError(result.errorMessage);

      return false;
    }

    setError("");

    return true;
  };

  const HandleChange = useCallback(
    async (e: any) => {
      if (e.target.name === "citizenId") {
        const value = e.target.value;

        if (value.length > 13) {
          return;
        }
        if (value.length === 13) {
          await validateCitizenId(value);
        } else if (value.length > 0) {
          setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");
        } else {
          setError("");
        }
        setSelectedReferent((prev) => ({
          ...prev,
          [e.target.name]: value,
        }));
      } else {
        setSelectedReferent((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      }
    },
    [selectedReferent]
  );

  const onSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      const data = JSON.stringify({ referent_data: selectedReferent });

      await fetch("/api/register/referent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      })
        .then((res) => {
          setIsLoading(true);

          return res.json();
        })
        .then((data) => {
          if (data == "000") {
            addToast({
              title: "แจ้งเตือน",
              color: "danger",
              description: "เลขบัตรประชาชนนี้ได้ถูกลงทะเบียนไว้แล้ว",
            });
            setIsLoading(false);
          } else {
            HandleChange({ target: { name: "id", value: data } });
            onOpen();
          }
        });
    },
    [selectedReferent, HandleChange, onOpen]
  );

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

  useEffect(() => {
    onOpenModal2();
    GetvolunteerType();
    GetEmployeeType();
    GetAffiliation();
    generateQR();
  }, []);

  return (
    <div className="flex flex-col w-[calc(100vw)] min-h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10">
      <h1 className={title({ size: "sm" })}>ลงทะเบียน อสท.</h1>

      <Modal
        backdrop="blur"
        id="modal-content-2"
        isOpen={isOpenModal2}
        placement="center"
        size="sm"
        onClose={onCloseModal2}
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

      <Form
        ref={formRef}
        className="flex flex-col gap-4 text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
          <Input
            className="max-w-xl"
            errorMessage={error}
            isInvalid={!!error}
            isRequired={request}
            label="เลขบัตรประชาชน"
            labelPlacement="inside"
            maxLength={13}
            name="citizenId"
            placeholder="เลขบัตรประชาชน"
            radius="md"
            size="sm"
            type="text"
            variant="faded"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกคำนำหน้า"
            isRequired={request}
            label="คำนำหน้า"
            labelPlacement="inside"
            name="prefixId"
            placeholder="คำนำหน้า"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {prefix.map((prefix) => (
              <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
            ))}
          </Select>

          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกชื่อ"
            isRequired={request}
            label="ชื่อ"
            labelPlacement="inside"
            name="firstname"
            placeholder="ชื่อ"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกนามสกุล"
            isRequired={request}
            label="นามสกุล"
            labelPlacement="inside"
            name="lastname"
            placeholder="นามสกุล"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
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
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl"
            isRequired={request}
            label="อีเมล"
            labelPlacement="inside"
            name="email"
            placeholder="อีเมล"
            radius="md"
            size="sm"
            type="text"
            validate={(val) => validateEmail(val.toString())}
            variant="faded"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกประเภทอาสาสมัคร"
            isRequired={request}
            label="ประเภทอาสาสมัคร"
            labelPlacement="inside"
            name="volunteer_type_id"
            placeholder="ประเภทอาสาสมัคร"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {volunteerType.map((volunteerType) => (
              <SelectItem key={volunteerType.id}>
                {volunteerType.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliation_id"
            placeholder="สังกัด"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {affiliation.map((affiliation) => (
              <SelectItem key={affiliation.id}>{affiliation.name}</SelectItem>
            ))}
          </Select>
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกหน่วยงาน"
            isRequired={request}
            label="หน่วยงาน"
            labelPlacement="inside"
            name="agency"
            placeholder="หน่วยงาน"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกประเภทการจ้างงาน"
            isRequired={request}
            label="ประเภทการจ้างงาน"
            labelPlacement="inside"
            name="employee_type_id"
            placeholder="ประเภทการจ้างงาน"
            radius="md"
            size="sm"
            variant="faded"
            onChange={HandleChange}
          >
            {employeeType.map((employeeType) => (
              <SelectItem key={employeeType.id}>{employeeType.name}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex justify-center w-full">
          <Button
            color="primary"
            isLoading={isLoading}
            type="submit"
            variant="solid"
          >
            {isLoading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </Button>
        </div>

        <div className="flex justify-center items-center gap-4 w-full font-semibold">
          <p>ตรวจสอบข้อมูลการลงทะเบียน อสท.</p>
          <Button
            color="warning"
            type="button"
            variant="solid"
            onPress={onOpenModal3}
          >
            ตรวจสอบ
          </Button>
        </div>
      </Form>

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
                  affiliation.find(
                    (x) => x.id == selectedReferent.affiliation_id
                  )?.name
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

      <ReferentQRCodeModal
        affiliation={affiliation}
        data={referent}
        isOpen={isOpenModal4}
        volunteerType={volunteerType}
        onClose={onCloseModal4}
      />

      <Modal
        backdrop="blur"
        id="modal-content-3"
        isOpen={isOpenModal3}
        placement="center"
        size="sm"
        onClose={onCloseModal3}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">
                ตรวจสอบการลงทะเบียน
              </ModalHeader>
              <ModalBody>
                <Form
                  className="flex flex-col gap-4 w-full p-5"
                  onSubmit={handleVerification}
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
                    ตรวจสอบ
                  </Button>
                  <Button
                    className="w-full"
                    color="danger"
                    variant="light"
                    onPress={onCloseModal3}
                  >
                    ปิด
                  </Button>
                </Form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
