"use client";

import {
  addToast,
  Button,
  Form,
  Input,
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

import {
  RegistrationInfoModal,
  RegistrationDescriptionModal,
  VerificationModal,
  ReferentQRCodeModal,
} from "./components";

import { title } from "@/components/primitives";
import { prefix } from "@/utils/data";
import { validateCitizen, validateEmail } from "@/utils/helper";
import { generateQRCode } from "@/utils/qrcode";
import { referentInitValue } from "@/types/initData";

type Mode = "register" | "edit";

export default function ReferentPage() {
  const request = true;
  const [error, setError] = useState<string>("");
  const [mode, setMode] = useState<Mode>("register");

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedReferent, setSelectedReferent] =
    useState<Referent>(referentInitValue);
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

            if (referent.affiliation?.name) {
              referent.affiliation_id = affiliation.find(
                (x) => x.name === referent.affiliation.name
              )?.id;
            }

            if (referent.volunteer_type?.name) {
              referent.volunteer_type_id = volunteerType.find(
                (x) => x.name === referent.volunteer_type.name
              )?.id;
            }

            if (referent.employee_type?.name) {
              referent.employee_type_id = employeeType.find(
                (x) => x.name === referent.employee_type.name
              )?.id;
            }

            if (referent.prefixId) {
              referent.prefixId = referent.prefixId.toString();
            }

            if (mode === "edit") {
              setSelectedReferent(referent);
              onCloseModal3();
              addToast({
                title: "สำเร็จ",
                color: "success",
                description: "พบข้อมูลการลงทะเบียน สามารถแก้ไขได้",
              });
            } else {
              setReferent(referent);
              onOpenModal4();
            }
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
    [selectedReferent, onOpen, affiliation, volunteerType, mode, onCloseModal3, onOpenModal4, employeeType]
  );

  const validateCitizenId = async (value: string) => {
    if (!value || value.length !== 13) {
      setError("กรอกเลขบัตรประชาชนไม่ครบถ้วน");

      return false;
    }

    const isDigit = /^[0-9]*$/.test(value);

    if (!isDigit) {
      setError("เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น");

      return false;
    }

    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(value.charAt(i)) * (13 - i);
    }
    const checksum = (11 - (sum % 11)) % 10;

    if (checksum !== parseInt(value.charAt(12))) {
      setError("กรอกเลขบัตรประชาชนไม่ถูกต้อง");

      return false;
    }

    const result = await validateCitizen(value, "referent");
    const data = await result.json();

    if (!data.valid) {
      setError(data.error);

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

      if (mode === "register") {
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
      } else {
        
        if (!selectedReferent.id) {
          addToast({
            title: "แจ้งเตือน",
            color: "danger",
            description: "ไม่พบ ID ของข้อมูลที่ต้องการอัปเดต",
          });
          return;
        }
        
        await fetch(`/api/data/referent/${selectedReferent.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedReferent),
        })
          .then((res) => {
            setIsLoading(true);
            return res.json();
          })
          .then((data) => {
            if (data.success) {
              addToast({
                title: "สำเร็จ",
                color: "success",
                description: "อัปเดตข้อมูลเรียบร้อยแล้ว",
              });
              setMode("register");
              formRef.current?.reset();
              setSelectedReferent(referentInitValue);
            } else {
              addToast({
                title: "แจ้งเตือน",
                color: "danger",
                description: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
              });
            }
            setIsLoading(false);
          })
          .catch((error) => {
            addToast({
              title: "แจ้งเตือน",
              color: "danger",
              description: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
            });
            setIsLoading(false);
          });
      }
    },
    [selectedReferent, HandleChange, onOpen, mode]
  );

  const handleEditMode = useCallback(async () => {
    setMode("edit");
    onOpenModal3();
  }, [onOpenModal3]);

  const handleRegisterMode = useCallback(() => {
    setMode("register");
    setSelectedReferent(referentInitValue);
    setError("");
    formRef.current?.reset();
  }, []);

  const loadReferentData = useCallback((referentData: Referent) => {
    setSelectedReferent(referentData);
    setMode("edit");
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

  useEffect(() => {
    if (mode === "register") {
      onOpenModal2();
    }
    GetvolunteerType();
    GetEmployeeType();
    GetAffiliation();
    generateQR();
  }, [mode, onOpenModal2]);

  return (
    <div className="flex flex-col w-[calc(100vw)] min-h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10">
      <h1 className={title({ size: "sm" })}>
        {mode === "register" ? "ลงทะเบียน อสท." : "แก้ไขข้อมูล อสท."}
      </h1>

      <div className="flex gap-4 mb-4">
        <Button
          color={mode === "register" ? "primary" : "default"}
          variant={mode === "register" ? "solid" : "bordered"}
          onPress={handleRegisterMode}
        >
          ลงทะเบียนใหม่
        </Button>
        <Button
          color={mode === "edit" ? "primary" : "default"}
          variant={mode === "edit" ? "solid" : "bordered"}
          onPress={handleEditMode}
        >
          แก้ไขข้อมูล
        </Button>
      </div>

      <RegistrationDescriptionModal
        isOpen={isOpenModal2}
        onClose={onCloseModal2}
      />

      <Form
        ref={formRef}
        className="flex flex-col gap-4 text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
          <Input
            className="max-w-xl w-full min-w-[320px]"
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
            value={selectedReferent.citizenId || ""}
            onChange={HandleChange}
            isReadOnly={mode === "edit"}
          />
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกคำนำหน้า"
            isRequired={request}
            label="คำนำหน้า"
            labelPlacement="inside"
            name="prefixId"
            placeholder="คำนำหน้า"
            radius="md"
            size="sm"
            variant="faded"
            selectedKeys={selectedReferent.prefixId ? [selectedReferent.prefixId.toString()] : []}
            onChange={HandleChange}
          >
            {prefix.map((prefix) => (
              <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
            ))}
          </Select>

          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกชื่อ"
            isRequired={request}
            label="ชื่อ"
            labelPlacement="inside"
            name="firstname"
            placeholder="ชื่อ"
            radius="md"
            size="sm"
            variant="faded"
            value={selectedReferent.firstname || ""}
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกนามสกุล"
            isRequired={request}
            label="นามสกุล"
            labelPlacement="inside"
            name="lastname"
            placeholder="นามสกุล"
            radius="md"
            size="sm"
            variant="faded"
            value={selectedReferent.lastname || ""}
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
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
            value={selectedReferent.tel || ""}
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl w-full min-w-[320px]"
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
            value={selectedReferent.email || ""}
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกประเภทอาสาสมัคร"
            isRequired={request}
            label="ประเภทอาสาสมัคร"
            labelPlacement="inside"
            name="volunteer_type_id"
            placeholder="ประเภทอาสาสมัคร"
            radius="md"
            size="sm"
            variant="faded"
            selectedKeys={selectedReferent.volunteer_type_id ? [selectedReferent.volunteer_type_id.toString()] : []}
            onChange={HandleChange}
          >
            {volunteerType.map((volunteerType) => (
              <SelectItem key={volunteerType.id}>
                {volunteerType.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliation_id"
            placeholder="สังกัด"
            radius="md"
            size="sm"
            variant="faded"
            selectedKeys={selectedReferent.affiliation_id ? [selectedReferent.affiliation_id.toString()] : []}
            onChange={HandleChange}
          >
            {affiliation.map((affiliation) => (
              <SelectItem key={affiliation.id}>{affiliation.name}</SelectItem>
            ))}
          </Select>
          <Input
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณากรอกหน่วยงาน"
            isRequired={request}
            label="หน่วยงาน"
            labelPlacement="inside"
            name="agency"
            placeholder="หน่วยงาน"
            radius="md"
            size="sm"
            variant="faded"
            value={selectedReferent.agency || ""}
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl w-full min-w-[320px]"
            errorMessage="กรุณาเลือกประเภทการจ้างงาน"
            isRequired={request}
            label="ประเภทการจ้างงาน"
            labelPlacement="inside"
            name="employee_type_id"
            placeholder="ประเภทการจ้างงาน"
            radius="md"
            size="sm"
            variant="faded"
            selectedKeys={selectedReferent.employee_type_id ? [selectedReferent.employee_type_id.toString()] : []}
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
            {isLoading 
              ? (mode === "register" ? "กำลังลงทะเบียน..." : "กำลังบันทึก...") 
              : (mode === "register" ? "ลงทะเบียน" : "บันทึกข้อมูล")
            }
          </Button>
        </div>

        {mode === "register" && (
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
        )}
      </Form>

      <RegistrationInfoModal
        isOpen={isOpen}
        onClose={onClose}
        selectedReferent={selectedReferent}
        affiliation={affiliation}
        volunteerType={volunteerType}
        qrCode={qrCode}
        formRef={formRef as React.RefObject<HTMLFormElement>}
        setIsLoading={setIsLoading}
      />

      <ReferentQRCodeModal
        affiliation={affiliation}
        data={referent}
        isOpen={isOpenModal4}
        volunteerType={volunteerType}
        onClose={onCloseModal4}
      />

      <VerificationModal
        isOpen={isOpenModal3}
        onClose={onCloseModal3}
        onOpenChange={onOpenChange}
        onSubmit={handleVerification}
        request={request}
        mode={mode}
      />
    </div>
  );
}
