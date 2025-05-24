import {
  Modal,
  ModalContent,
  Form,
  ModalHeader,
  Divider,
  ModalBody,
  User,
  ScrollShadow,
  Input,
  Select,
  SelectItem,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Affiliation, Employee_Type } from "@prisma/client";

import { ProfileAdminData } from "@/types";
import { prefix } from "@/utils/data";
import {
  userStatusOptions as Options,
  emergencyOptions as Emergency,
  userRoles,
} from "@/app/admin/(app)/data/optionData";

interface Props {
  Profile: ProfileAdminData;
  Mode: string;
  isOpen: any;
  onClose: any;
  onReLoad: any;
}

export const ModalUserProfile = ({
  Profile,
  Mode,
  isOpen,
  onClose,
  onReLoad,
}: Props) => {
  const [mode, setMode] = useState("View");
  const [isRequest] = useState(false);
  const [affiliationList, setAffiliationList] = useState<Affiliation[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<Employee_Type[]>([]);

  const [selectedProfile, setSelectedProfile] =
    useState<ProfileAdminData>(Profile);

  const GetAffiliationList = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((val) => {
        setAffiliationList(val);
      });
  }, [affiliationList]);

  const GetEmployeeList = useCallback(async () => {
    await fetch("/api/data/employee")
      .then((res) => res.json())
      .then((val) => {
        setEmployeeTypes(val);
      });
  }, [employeeTypes]);

  const HandleChange = useCallback(
    (e: any) => {
      if (mode === "Edit") {
        if (e.target.name === "alert") {
          setSelectedProfile((prev) => ({
            ...prev,
            [e.target.name]: e.target.value === "1" ? true : false,
          }));
        } else {
          setSelectedProfile((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }));
        }
      }
    },
    [selectedProfile]
  );

  const ModalSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      const data = JSON.stringify({ profile_data: selectedProfile });

      await fetch("/api/profile/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      }).then(() => {
        if (onReLoad != null) {
          onReLoad();
        }
        onClose();
        addToast({
          color: "success",
          title: "แก้ไขผู้ใช้งาน",
          description: "แก้ไขผู้ใช้งานสำเร็จ",
          timeout: 3000,
        });
      });
    },
    [selectedProfile]
  );

  useEffect(() => {
    GetAffiliationList();
    GetEmployeeList();
    if (isOpen) {
      setSelectedProfile(Profile);
      setMode(Mode);
    }
  }, [isOpen]);

  return (
    <Modal
      backdrop="opaque"
      className="mx-6"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      placement="center"
      radius="lg"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <Form validationBehavior="native" onSubmit={ModalSubmit}>
            <ModalHeader className="flex flex-col gap-1 w-full">
              {mode === "View" ? "ดูข้อมูลผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}
              <Divider className="mt-3" />
            </ModalHeader>
            <ModalBody className="flex w-full">
              <div className="w-full">
                <User
                  avatarProps={{
                    src: selectedProfile.image,
                    size: "lg",
                  }}
                  classNames={{ name: "font-semibold" }}
                  description={
                    <p>Line ID : {selectedProfile.providerAccountId}</p>
                  }
                  name={
                    <>
                      <p>หมายเลข ปชช : {selectedProfile.citizenId}</p>
                      <p>Line : {selectedProfile.name}</p>
                    </>
                  }
                />
              </div>
              <ScrollShadow className="h-[600px]" size={20}>
                <div className="flex flex-col gap-3 font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="หมายเลขโทรศัพท์"
                      labelPlacement="outside"
                      name="tel"
                      placeholder="หมายเลขโทรศัพท์"
                      radius="sm"
                      size="md"
                      value={selectedProfile.tel}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Select
                      className="max-w-xl"
                      errorMessage="กรุณาเลือกคำนำหน้า"
                      isRequired={isRequest}
                      label="คำนำหน้า"
                      labelPlacement="outside"
                      name="prefixId"
                      placeholder="คำนำหน้า"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.prefixId == 0
                          ? ""
                          : selectedProfile.prefixId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {prefix.map((prefix) => (
                        <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      isRequired={isRequest}
                      label="ชื่อ"
                      labelPlacement="outside"
                      name="firstname"
                      placeholder="ชื่อ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.firstname}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Input
                      isRequired={isRequest}
                      label="นามสกุล"
                      labelPlacement="outside"
                      name="lastname"
                      placeholder="นามสกุล"
                      radius="sm"
                      size="md"
                      value={selectedProfile.lastname}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Select
                      errorMessage="กรุณาเลือกสังกัด"
                      isRequired={isRequest}
                      label="สังกัด"
                      labelPlacement="outside"
                      name="affiliationId"
                      placeholder="สังกัด"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.affiliationId === 0
                          ? ""
                          : selectedProfile.affiliationId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {affiliationList.map((val) => {
                        return <SelectItem key={val.id}>{val.name}</SelectItem>;
                      })}
                    </Select>
                    <Input
                      isRequired={isRequest}
                      label="หน่วยงาน"
                      labelPlacement="outside"
                      name="agency"
                      placeholder="หน่วยงาน"
                      radius="sm"
                      size="md"
                      value={selectedProfile.agency}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                    <Select
                      errorMessage="กรุณาเลือกประเภทการจ้าง"
                      isRequired={isRequest}
                      label="ประเภทการจ้าง"
                      labelPlacement="outside"
                      name="employeeTypeId"
                      placeholder="ประเภทการจ้าง"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.employeeTypeId === 0
                          ? ""
                          : selectedProfile.employeeTypeId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {employeeTypes.map((val) => {
                        return <SelectItem key={val.id}>{val.name}</SelectItem>;
                      })}
                    </Select>
                    <Input
                      isRequired={false}
                      label="สาขาวิชาชีพ"
                      labelPlacement="outside"
                      name="professional"
                      placeholder="สาขาวิชาชีพ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.professional}
                      variant="bordered"
                      onChange={HandleChange}
                    />

                    <Input
                      isRequired={false}
                      label="เลขที่ใบอนุญาติ"
                      labelPlacement="outside"
                      name="license"
                      placeholder="เลขที่ใบอนุญาติ"
                      radius="sm"
                      size="md"
                      value={selectedProfile.license}
                      variant="bordered"
                      onChange={HandleChange}
                    />
                  </div>
                  <Divider />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      className="max-w-xl"
                      label="สิทธิ์การใช้งาน"
                      labelPlacement="outside"
                      name="roleId"
                      placeholder="สิทธิ์การใช้งาน"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.roleId === 0
                          ? ""
                          : selectedProfile.roleId.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {userRoles.map((val) => {
                        return <SelectItem key={val.id}>{val.name}</SelectItem>;
                      })}
                    </Select>
                    <Select
                      className="max-w-xl"
                      label="สถานะ"
                      labelPlacement="outside"
                      name="status"
                      placeholder="สถานะ"
                      radius="sm"
                      selectedKeys={
                        selectedProfile.status === 0
                          ? ""
                          : selectedProfile.status.toString()
                      }
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {Options.map((val) => {
                        return (
                          <SelectItem key={val.uid}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                    <Select
                      className="max-w-xl"
                      label="Emergency Alert"
                      labelPlacement="outside"
                      name="alert"
                      placeholder="Emergency Alert"
                      radius="sm"
                      selectedKeys={selectedProfile.alert === false ? "0" : "1"}
                      size="md"
                      variant="bordered"
                      onChange={HandleChange}
                    >
                      {Emergency.map((val) => {
                        return (
                          <SelectItem key={val.uid}>{val.name}</SelectItem>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              </ScrollShadow>
            </ModalBody>
            <ModalFooter className="flex w-full items-end">
              <Button color="default" variant="bordered" onPress={onClose}>
                ปิด
              </Button>
              <Button
                className="bg-primary shadow-lg shadow-indigo-500/20 font-bold text-white "
                isDisabled={mode === "View"}
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
