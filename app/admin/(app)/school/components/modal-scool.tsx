import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
} from "@heroui/react";
import React, { useEffect, useState } from "react";
import { Districts, School } from "@prisma/client";
import { Autocomplete, AutocompleteItem } from "@heroui/react";

const ModalFrom = ({
  isOpen,
  onOpen,
  onOpenChange,
}: {
  isOpen: any;
  onOpen: any;
  onOpenChange: any;
}) => {
  const [districts, setDistricts] = useState<Districts[]>([]);

  const onSubmit = (e: any) => {
    e.preventDefault();

  };



  return (
    <div>
      <Button
        className="font-bold text-medium"
        color="primary"
        onPress={onOpen}
      >
        เพิ่ม
      </Button>

      <Modal
        backdrop="opaque"
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          // base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
          // header: "border-b-[1px] border-[#292f46]",
          // footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        radius="lg"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (

              <Form onSubmit={onSubmit}>

                <ModalHeader className="flex flex-col gap-1">
                  เพิ่มโรงเรียน
                </ModalHeader>
                <ModalBody className="flex w-full">
                  <Input
                    isRequired
                    errorMessage="กรุณากรอกชื่อโรงเรียน"
                    label="ชื่อโรงเรียน"
                    labelPlacement="outside"
                    placeholder="กรุณากรอกชื่อโรงเรียน"
                    type="input"
                    variant="bordered"
                  />
                  <Autocomplete
                    isRequired
                    defaultItems={districts}
                    errorMessage="กรุณาเลือกเขต"
                    label="เขต"
                    labelPlacement="outside"
                    placeholder="กรุณาเลือกเขต"
                  >
                    {(district) => (
                      <AutocompleteItem key={district.id}>
                        {district.nameInThai}
                      </AutocompleteItem>
                    )}
                  </Autocomplete>
                </ModalBody>
                <ModalFooter className="flex w-full items-end">
                  <Button color="default" variant="light" onPress={onClose}>
                    ปิด
                  </Button>
                  <Button
                    className="bg-success shadow-lg shadow-indigo-500/20 font-bold text-white "
                    type="submit"
                    variant="bordered"
                  >
                    เพิ่ม
                  </Button>
                </ModalFooter>
              </Form>

          )}

        </ModalContent>
      </Modal>
    </div>
  );
};

export default ModalFrom;
