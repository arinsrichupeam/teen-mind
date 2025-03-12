"use client";

import {
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

import { title } from "@/components/primitives";
import { prefix } from "@/utils/data";
import { validateCitizen, validateEmail } from "@/utils/helper";

const referentInitValue: Referent = {
  id: 0,
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  email: "",
  tel: "",
  volunteer_type_id: 0,
  employee_type_id: 0,
  affiliation_id: 0,
  agency: "",
  status: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function ReferentPage() {
  const request = true;

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedReferent, setSelectedReferent] =
    useState<Referent>(referentInitValue);
  const [volunteerType, setvolunteerType] = useState<Volunteer_Type[]>([]);
  const [employeeType, setEmployeeType] = useState<Employee_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);

  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const HandleChange = useCallback(
    (e: any) => {
      setSelectedReferent((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
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
        .then((res) => res.json())
        .then((data) => {
          HandleChange({ target: { name: "id", value: data } });
          onOpen();
        });
    },
    [selectedReferent]
  );

  useEffect(() => {
    GetvolunteerType();
    GetEmployeeType();
    GetAffiliation();
  }, []);

  return (
    <div className="flex flex-col w-[calc(100vw)] min-h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10">
      <h1 className={title({ size: "sm" })}>ลงทะเบียน อสท.</h1>

      <Form
        ref={formRef}
        className="flex flex-col gap-4 w-full text-start"
        validationBehavior="native"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center w-full gap-4 mb-4">
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
            validate={(val) => validateCitizen(val)}
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
            // errorMessage="กรุณากรอกอีเมล"
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
          <Button color="primary" type="submit" variant="solid">
            ลงทะเบียน
          </Button>
        </div>
      </Form>

      <Modal
        backdrop="blur"
        id="modal-content"
        isOpen={isOpen}
        placement="center"
        size="xs"
        onClose={onClose}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col items-center font-bold">
              ข้อมูลการลงทะเบียน อสท.
            </ModalHeader>
            <ModalBody className="flex flex-col gap-2 wrapper">
              <Divider />
              <div className="items-center flex justify-center box-border rounded-full bg-primary-100 font-bold p-2">
                <span className="">รหัสอ้างอิง {selectedReferent.id}</span>
              </div>
              <span>
                ชื่อ - นามสกุล :{" "}
                {prefix[selectedReferent.prefixId - 1]?.label}{" "}
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
                src="/image/Teen-Mind.png"
                width={200}
              />
              <Divider />
            </ModalBody>
            <ModalFooter className="flex justify-center">
              <Button color="primary" variant="solid" onPress={() => { onClose(); formRef.current?.reset(); }}>
                ปิด
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}
