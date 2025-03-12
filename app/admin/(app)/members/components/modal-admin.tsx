import {
  Button,
  Card,
  CardBody,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Affiliation, Employee_Type } from "@prisma/client";

import { roles, statusOptions } from "../data";

import { prefix, Profile_Admin_List } from "@/types";

interface Props {
  isOpen: any;
  onOpenChange: any;
  data: Profile_Admin_List | undefined;
  mode: string;
}

export const ProfileAdminModal = ({
  isOpen,
  onOpenChange,
  data,
  mode,
}: Props) => {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<Employee_Type[]>([]);
  const [admin, setProfileAdmin] = useState<Profile_Admin_List>();

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliations(val);
      });
  }, [affiliations]);

  const GetEmployeeList = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((val) => {
        setEmployeeTypes(val);
      });
  }, [employeeTypes]);

  const HandleChange = useCallback(
    (e: any) => {
      console.log(e.target.name, ":", e.target.value);
      // setProfileAdmin((prev) => ({
      //   ...prev,
      //   [e.target.name]: e.target.value,
      // }));
    },
    [admin]
  );

  const onSubmit = useCallback(() => { }, [isOpen]);

  useEffect(() => {
    GetAffiliationList();
    GetEmployeeList();
  }, []);

  return (
    <Modal
      backdrop="opaque"
      classNames={{
        body: "py-6",
        backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
      isOpen={isOpen}
      placement="center"
      radius="lg"
      size="md"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <Form validationBehavior="native" onSubmit={onSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              {mode === "View" ? "ดูข้อมูลผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}
            </ModalHeader>
            <ModalBody className="flex w-full">
              <Tabs
                aria-label="Options"
                className="max-w-xs"
                color="primary"
                // selectedKey={question}
                variant="underlined"
              >
                <Tab key="Profile" title="ข้อมูลส่วนตัว">
                  <Card>
                    <CardBody className="gap-5">
                      <Input
                        label="รหัสประชาชน"
                        labelPlacement="inside"
                        name="citizenId"
                        placeholder="รหัสประชาชน"
                        // defaultValue={data?.profile_admin[0].citizenId}
                        value={admin?.profile_admin[0].citizenId}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                      <Select
                        className="max-w-xl"
                        errorMessage="กรุณาเลือกคำนำหน้า"
                        // isRequired={request}
                        label="คำนำหน้า"
                        labelPlacement="inside"
                        name="prefixId"
                        placeholder="คำนำหน้า"
                        radius="md"
                        selectedKeys={
                          data?.profile_admin[0].prefixId === 0
                            ? ""
                            : data?.profile_admin[0].prefixId.toString()
                        }
                        size="sm"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {prefix.map((prefix) => (
                          <SelectItem key={prefix.key}>
                            {prefix.label}
                          </SelectItem>
                        ))}
                      </Select>
                      <Input
                        label="ชื่อ"
                        labelPlacement="inside"
                        name="firstname"
                        placeholder="ชื่อ"
                        value={data?.profile_admin[0].firstname}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                      <Input
                        label="นามสกุล"
                        labelPlacement="inside"
                        name="lastname"
                        placeholder="นามสกุล"
                        value={data?.profile_admin[0].lastname}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                      <Select
                        className="max-w-xl"
                        label="สถานะ"
                        labelPlacement="inside"
                        name="status"
                        placeholder="สถานะ"
                        radius="md"
                        selectedKeys={
                          data?.profile_admin[0].status === 0
                            ? ""
                            : data?.profile_admin[0].status.toString()
                        }
                        size="sm"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {statusOptions.map((val) => {
                          return (
                            <SelectItem key={val.uid}>{val.name}</SelectItem>
                          );
                        })}
                      </Select>
                      <Select
                        className="max-w-xl"
                        label="สิทธิ์การใช้งาน"
                        labelPlacement="inside"
                        name="role"
                        placeholder="สิทธิ์การใช้งาน"
                        radius="md"
                        selectedKeys={
                          data?.profile_admin[0].role[0].id === 0
                            ? ""
                            : data?.profile_admin[0].role[0].id.toString()
                        }
                        size="sm"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {roles.map((val) => {
                          return (
                            <SelectItem key={val.id}>{val.name}</SelectItem>
                          );
                        })}
                      </Select>
                    </CardBody>
                  </Card>
                </Tab>
                <Tab key="Job" title="ข้อมูลเฉพาะทาง">
                  <Card>
                    <CardBody className="gap-5">
                      <Select
                        className="max-w-xl"
                        errorMessage="กรุณาเลือกสังกัด"
                        // isRequired={request}
                        label="สังกัด"
                        labelPlacement="inside"
                        name="affiliationId"
                        placeholder="สังกัด"
                        radius="md"
                        selectedKeys={
                          data?.profile_admin[0].affiliationId === 0
                            ? ""
                            : data?.profile_admin[0].affiliationId.toString()
                        }
                        size="sm"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {affiliations.map((val) => {
                          return (
                            <SelectItem key={val.id}>{val.name}</SelectItem>
                          );
                        })}
                      </Select>
                      <Input
                        label="หน่วยงาน"
                        labelPlacement="inside"
                        name="agency"
                        placeholder="หน่วยงาน"
                        radius="md"
                        size="sm"
                        value={data?.profile_admin[0].agency}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                      <Select
                        className="max-w-xl"
                        errorMessage="กรุณาเลือกประเภทการจ้าง"
                        // isRequired={request}
                        label="ประเภทการจ้าง"
                        labelPlacement="inside"
                        name="employeeTypeId"
                        placeholder="ประเภทการจ้าง"
                        radius="md"
                        selectedKeys={
                          data?.profile_admin[0].employeeTypeId === 0
                            ? ""
                            : data?.profile_admin[0].employeeTypeId.toString()
                        }
                        size="sm"
                        variant="bordered"
                        onChange={HandleChange}
                      >
                        {employeeTypes.map((val) => {
                          return (
                            <SelectItem key={val.id}>{val.name}</SelectItem>
                          );
                        })}
                      </Select>
                      <Input
                        label="สาขาวิชาชีพ"
                        labelPlacement="inside"
                        name="professional"
                        placeholder="สาขาวิชาชีพ"
                        radius="md"
                        size="sm"
                        value={data?.profile_admin[0].professional}
                        variant="bordered"
                        onChange={HandleChange}
                      />

                      <Input
                        label="เลขที่ใบอนุญาติ"
                        labelPlacement="inside"
                        name="license"
                        placeholder="เลขที่ใบอนุญาติ"
                        radius="md"
                        size="sm"
                        value={data?.profile_admin[0].license}
                        variant="bordered"
                        onChange={HandleChange}
                      />
                    </CardBody>
                  </Card>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter className="flex w-full items-end">
              <Button color="default" variant="bordered" onPress={onOpenChange}>
                ปิด
              </Button>
              <Button
                className="bg-primary shadow-lg shadow-indigo-500/20 font-bold text-white "
                type="submit"
                variant="bordered"
              >
                {mode === "Create" ? "เพิ่ม" : "แก้ไข"}
              </Button>
            </ModalFooter>
          </Form>
        )}
      </ModalContent>
    </Modal>
  );
};
