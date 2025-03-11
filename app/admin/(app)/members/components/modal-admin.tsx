import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Select,
  SelectItem,
} from "@heroui/react";
import { useCallback, useEffect } from "react";

import { prefix } from "@/types";

interface Props {
  isOpen: any;
  onOpenChange: any;
  data: any | undefined;
  mode: string;
}

export const ProfileAdminModal = ({
  isOpen,
  onOpenChange,
  data,
  mode,
}: Props) => {
  const onSubmit = useCallback(() => {}, []);

  useEffect(() => {}, []);

  return (
    <Modal
      backdrop="opaque"
      classNames={{
        body: "py-6",
        backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
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
              <ScrollShadow className="h-[400px]">
                <Input
                  label="รหัสประชาชน"
                  labelPlacement="outside"
                  placeholder="รหัสประชาชน"
                  value={data?.profile_admin[0].citizenId}
                  variant="bordered"
                />
                <Select
                  label="คำนำหน้า"
                  labelPlacement="outside"
                  placeholder="คำนำหน้า"
                  selectedKeys={data?.profile_admin[0].prefixId.toString()}
                  variant="bordered"
                >
                  {prefix.map((val, index) => {
                    return <SelectItem key={index}>{val.label}</SelectItem>;
                  })}
                </Select>
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="ชื่อ"
                  variant="bordered"
                />
                <Input
                  label="นามสกุล"
                  labelPlacement="outside"
                  placeholder="นามสกุล"
                  variant="bordered"
                />
                <Input
                  label="สาขาวิชาชีพ"
                  labelPlacement="outside"
                  placeholder="สาขาวิชาชีพ"
                  variant="bordered"
                />
                <Select
                  label="สังกัด"
                  labelPlacement="outside"
                  placeholder="สังกัด"
                  variant="bordered"
                >
                  <SelectItem>
                    <p>1</p>
                  </SelectItem>
                </Select>
                <Input
                  label="หน่วยงาน"
                  labelPlacement="outside"
                  placeholder="หน่วยงาน"
                  variant="bordered"
                />
                <Select
                  label="ประเภทการจ้าง"
                  labelPlacement="outside"
                  placeholder="ประเภทการจ้าง"
                  variant="bordered"
                >
                  <SelectItem>
                    <p>1</p>
                  </SelectItem>
                </Select>
                <Input
                  label="เลขที่ใบอนุญาติ"
                  labelPlacement="outside"
                  placeholder="เลขที่ใบอนุญาติ"
                  variant="bordered"
                />
                <Select
                  label="สถานะ"
                  labelPlacement="outside"
                  placeholder="สถานะ"
                  variant="bordered"
                >
                  <SelectItem>
                    <p>1</p>
                  </SelectItem>
                </Select>
                <Select
                  label="สิทธิ์การใช้งาน"
                  labelPlacement="outside"
                  placeholder="สิทธิ์การใช้งาน"
                  variant="bordered"
                >
                  <SelectItem>
                    <p>1</p>
                  </SelectItem>
                </Select>
              </ScrollShadow>
            </ModalBody>
            <ModalFooter className="flex w-full items-end">
              <Button color="default" variant="bordered" onPress={onClose}>
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
