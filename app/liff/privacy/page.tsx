"use client";

import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Tabs, Tab } from "@heroui/tabs";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Suspense, useState } from "react";
import { Image } from "@heroui/image";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useRouter } from "next/navigation";

import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";

import { title } from "@/components/primitives";
import Loading from "@/app/loading";

export default function PrivacyPage() {
  const router = useRouter();
  const [agree, setAgree] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <section className="flex flex-col w-screen items-center justify-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col gap-5">
          <h1 className={title({ size: "sm" })}>ข้อกำหนดการใช้งาน</h1>
          <Tabs
            aria-label="Options"
            color="primary"
            fullWidth={true}
            variant="underlined"
          >
            <Tab key="step1" title="ข้อกำหนดและเงื่อนไข">
              <ScrollShadow
                className="h-[60vh]"
                offset={100}
                orientation="horizontal"
              >
                <Step1 />
              </ScrollShadow>
            </Tab>
            <Tab key="step2" title="นโยบายความเป็นส่วนตัว">
              <ScrollShadow
                className="h-[60vh]"
                offset={100}
                orientation="horizontal"
              >
                <Step2 />
              </ScrollShadow>
            </Tab>
          </Tabs>
          <Checkbox
            className="text-start"
            color="primary"
            size="sm"
            onChange={() => setAgree(!agree)}
          >
            <p>
              ฉันยอมรับข้อกำหนดและเงื่อนไขในการใช้บริการ
              รวมถึงนโยบายคุ้มครองความเป็นส่วนตัว
            </p>
          </Checkbox>
          <Button
            className="w-full"
            color="primary"
            isDisabled={agree}
            onPress={() => onOpen()}
          >
            ต่อไป
          </Button>
        </div>
        <Modal
          backdrop="opaque"
          isOpen={isOpen}
          placement="center"
          size="xs"
          onOpenChange={onOpenChange}
        >
          <ModalContent>
            {() => (
              <>
                <ModalBody className="items-center text-center pt-10">
                  <Image
                    alt="Privacy Image"
                    height={200}
                    loading="lazy"
                    src="../image/Q1-05.png"
                  />
                  <h2 className={title({ size: "xs" })}>
                    จัดการความยินยอมของคุณ
                  </h2>
                  <p>
                    เราให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้โดยทำตาม พรบ
                    คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    เพื่อให้คุณสามารถจัดการกับข้อมูล
                    และเลือกปรับคำยินยอมได้ตามต้องการ
                  </p>
                </ModalBody>
                <ModalFooter className="justify-center">
                  <Button
                    className="w-full"
                    color="primary"
                    radius="full"
                    variant="bordered"
                    onPress={() => router.push("register")}
                  >
                    เข้าใจแล้ว!
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </Suspense>
    </section>
  );
}
