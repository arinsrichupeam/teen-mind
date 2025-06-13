"use client";

import {
  addToast,
  Button,
  Form,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Affiliation, Employee_Type, Profile_Admin } from "@prisma/client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { title } from "@/components/primitives";
import { validateCitizen } from "@/utils/helper";
import { prefix } from "@/utils/data";

const profileInitValue: Profile_Admin = {
  id: "",
  userId: "",
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  tel: "",
  affiliationId: 0,
  agency: "",
  employeeTypeId: 0,
  professional: "",
  license: "",
  status: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  roleId: 3,
  alert: false,
};

export default function RegisterPage() {
  const [request] = useState(true);
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const [employeeType, setEmployeeType] = useState<Employee_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [admin, setProfileAdmin] = useState<Profile_Admin>(profileInitValue);

  const { data: session, status } = useSession();

  const onSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      const data = JSON.stringify({ profile_admin: admin });

      await fetch("/api/register/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).then((res) => {
        if (res.status === 200) {
          addToast({
            title: "ลงทะเบียน",
            color: "success",
            description: "ลงทะเบียนสำเร็จ",
            timeout: 2000,
          });
          setTimeout(() => {
            router.push("/admin/");
          }, 3000);
        }
      });
    },
    [admin, router]
  );

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
    const result = await validateCitizen(value, "admin");
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
        setProfileAdmin((prev) => ({
          ...prev,
          [e.target.name]: value,
        }));
      } else {
        setProfileAdmin((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      }
    },
    [admin]
  );

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        signIn();
      } else {
        setProfileAdmin((prev) => ({
          ...prev,
          userId: session?.user?.id as string,
        }));

        GetEmployeeType();
        GetAffiliation();
      }
    }
  }, [session]);

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <h1 className={title({ size: "sm" })}>ลงทะเบียน</h1>
      <Form
        className="flex flex-col items-center md:px-20 gap-4 w-full text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center h-[450px] overflow-y-auto w-full gap-4 mb-4">
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
            value={admin.citizenId}
            variant="bordered"
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
            selectedKeys={admin.prefixId === 0 ? "" : admin.prefixId.toString()}
            size="sm"
            variant="bordered"
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
            value={admin?.firstname}
            variant="bordered"
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
            value={admin?.lastname}
            variant="bordered"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกเบอร์โทรศัพท์"
            isRequired={false}
            label="เบอร์โทรศัพท์"
            labelPlacement="inside"
            name="tel"
            placeholder="เบอร์โทรศัพท์"
            radius="md"
            size="sm"
            type="number"
            value={admin.tel?.toString()}
            variant="bordered"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            disabledKeys={["99"]}
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliationId"
            placeholder="สังกัด"
            radius="md"
            selectedKeys={
              admin.affiliationId === 0 ? "" : admin.affiliationId.toString()
            }
            size="sm"
            variant="bordered"
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
            value={admin.agency}
            variant="bordered"
            onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกประเภทการจ้างงาน"
            isRequired={request}
            label="ประเภทการจ้างงาน"
            labelPlacement="inside"
            name="employeeTypeId"
            placeholder="ประเภทการจ้างงาน"
            radius="md"
            selectedKeys={
              admin.employeeTypeId === 0 ? "" : admin.employeeTypeId.toString()
            }
            size="sm"
            variant="bordered"
            onChange={HandleChange}
          >
            {employeeType.map((employeeType) => (
              <SelectItem key={employeeType.id}>{employeeType.name}</SelectItem>
            ))}
          </Select>
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกสาขาวิชาชีพ"
            isRequired={false}
            label="สาขาวิชาชีพ"
            labelPlacement="inside"
            name="professional"
            placeholder="สาขาวิชาชีพ"
            radius="md"
            size="sm"
            value={admin.professional?.toString()}
            variant="bordered"
            onChange={HandleChange}
          />
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกเลขที่ใบประกอบวิชาชีพ"
            isRequired={false}
            label="เลขที่ใบประกอบวิชาชีพ"
            labelPlacement="inside"
            name="license"
            placeholder="เลขที่ใบประกอบวิชาชีพ"
            radius="md"
            size="sm"
            value={admin.license?.toString()}
            variant="bordered"
            onChange={HandleChange}
          />
        </div>
        <Button color="primary" type="submit" variant="flat">
          ลงทะเบียน
        </Button>
      </Form>
    </div>
  );
}
