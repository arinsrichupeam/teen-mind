"use client"

import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Tabs, Tab } from "@heroui/tabs";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { useState } from "react";
import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";

export default function PrivacyPage() {
  const [agree, setAgree] = useState(true);
  return (
    <section className="flex flex-col gap-4">
      <h1 className={title({ size: "xs" })}>ข้อกำหนดการใช้งาน</h1>
      <Tabs aria-label="Options" variant="underlined" color="primary" fullWidth={true} selectedKey={"step2"}>
        <Tab key="step1" title="ข้อกำหนดและเงื่อนไข">
          <ScrollShadow className="h-[500px]" offset={100} orientation="horizontal">
            <Step1 />
          </ScrollShadow>
        </Tab>
        <Tab key="step2" title="นโยบายความเป็นส่วนตัว">
          <ScrollShadow className="h-[500px]" offset={100} orientation="horizontal">
            <Step2 />
          </ScrollShadow>
        </Tab>
      </Tabs>
      <Checkbox color="primary" className="text-start" onChange={() => setAgree(!agree)}>
        <p>ฉันยอมรับข้อกำหนดและเงื่อนไขในการใช้บริการ รวมถึงนโยบายคุ้มครองความเป็นส่วนตัว</p>
      </Checkbox>
      <Button color="primary" isDisabled={agree}>ต่อไป</Button>
    </section >
  );
}
