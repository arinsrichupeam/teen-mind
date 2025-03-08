"use client";

import {
  addToast,
  Button,
  Form,
  Input,
  Link,
  Select,
  SelectItem,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Affiliation, Employee_Type } from "@prisma/client";
import { signIn, useSession } from "next-auth/react";

import { title } from "@/components/primitives";
import { prefix } from "@/types";
import { validateCitizen } from "@/utils/helper";

export default function RegisterPage() {
  const [request] = useState(true);
  const [employeeType, setEmployeeType] = useState<Employee_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const { data: session, status } = useSession();

  const onSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    addToast({
      title: "ลงทะเบียน อสท.",
      color: "success",
      description: "ลงทเีบียนสำเร็จ",
      timeout: 2000,
    });
  }, []);

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

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        signIn();
      } else {
        GetEmployeeType();
        GetAffiliation();
      }
    }
  }, [session]);

  return (
    <div className="flex flex-col w-full items-center gap-4">
      <h1 className={title({ size: "sm" })}>ลงทะเบียน เข้าใช้งานระบบ</h1>

      <Form
        className="flex flex-col items-center md:px-20 gap-4 w-full text-start"
        // validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
          <Input
            className="max-w-xl"
            isRequired={true}
            label="เลขบัตรประชาชน"
            labelPlacement="inside"
            name="citizenId"
            placeholder="เลขบัตรประชาชน"
            radius="md"
            size="sm"
            type="number"
            validate={(val) => validateCitizen(val)}
            // value={parseInt(Result?.citizenId as string)}
            variant="bordered"
            // onChange={HandleChange}
          />
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกคำนำหน้า"
            isRequired={request}
            label="คำนำหน้า"
            labelPlacement="inside"
            name="prefix"
            placeholder="คำนำหน้า"
            radius="md"
            // selectedKeys={Result?.prefix === 0 ? "" : Result?.prefix.toString()}
            size="sm"
            variant="bordered"
            // onChange={HandleChange}
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
            // value={Result?.firstname}
            variant="bordered"
            // onChange={HandleChange}
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
            // value={Result?.lastname}
            variant="bordered"
            // onChange={HandleChange}
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
            // value={Result?.tel}
            // validate={(val) => validateEmail(val.toString())}
            variant="bordered"
            // onChange={HandleChange}
          />
          {/* <Input
            className="max-w-xl"
            // errorMessage="กรุณากรอกอีเมล"
            isRequired={request}
            label="อีเมล"
            labelPlacement="inside"
            name="email"
            placeholder="อีเมล"
            radius="md"
            size="sm"
            type="text"
            // value={Result?.tel}
            validate={(val) => validateEmail(val.toString())}
            variant="bordered"
          // onChange={HandleChange}
          /> */}
          {/* <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกประเภทอาสาสมัคร"
            isRequired={request}
            label="ประเภทอาสาสมัคร"
            labelPlacement="inside"
            name="volunteer_type_id"
            placeholder="ประเภทอาสาสมัคร"
            radius="md"
            // selectedKeys={Result?.prefix === 0 ? "" : Result?.prefix.toString()}
            size="sm"
            variant="bordered"
          // onChange={HandleChange}
          >
            {prefix.map((prefix) => (
              <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
            ))}
          </Select> */}
          <Select
            className="max-w-xl"
            errorMessage="กรุณาเลือกสังกัด"
            isRequired={request}
            label="สังกัด"
            labelPlacement="inside"
            name="affiliation_id"
            placeholder="สังกัด"
            radius="md"
            // selectedKeys={Result?.prefix === 0 ? "" : Result?.prefix.toString()}
            size="sm"
            variant="bordered"
            // onChange={HandleChange}
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
            // value={Result?.lastname}
            variant="bordered"
            // onChange={HandleChange}
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
            // selectedKeys={Result?.prefix === 0 ? "" : Result?.prefix.toString()}
            size="sm"
            variant="bordered"
            // onChange={HandleChange}
          >
            {employeeType.map((employeeType) => (
              <SelectItem key={employeeType.id}>{employeeType.name}</SelectItem>
            ))}
          </Select>
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกสาขาวิชาชีพ"
            isRequired={request}
            label="สาขาวิชาชีพ"
            labelPlacement="inside"
            name="firstname1"
            placeholder="สาขาวิชาชีพ"
            radius="md"
            size="sm"
            // value={Result?.firstname}
            variant="bordered"
            // onChange={HandleChange}
          />
          <Input
            className="max-w-xl"
            errorMessage="กรุณากรอกเลขที่ใบประกอบวิชาชีพ"
            isRequired={false}
            label="เลขที่ใบประกอบวิชาชีพ"
            labelPlacement="inside"
            name="firstname2"
            placeholder="เลขที่ใบประกอบวิชาชีพ"
            radius="md"
            size="sm"
            // value={Result?.firstname}
            variant="bordered"
            // onChange={HandleChange}
          />
        </div>
        <Button color="primary" type="submit" variant="flat">
          Register
        </Button>
      </Form>

      <div className="font-light text-slate-400 mt-4 text-sm">
        Already have an account ?{" "}
        <Link className="font-bold" href="/login">
          Login here
        </Link>
      </div>
    </div>
  );
}
