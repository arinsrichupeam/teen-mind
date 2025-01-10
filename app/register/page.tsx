"use client"

import { title } from "@/components/primitives";
import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Progress } from "@nextui-org/progress";

import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { useState } from "react";

export default function RegisterPage() {
  const [selected, setSelected] = useState("address");
  const [progress, setProgress] = useState(50);

  const NextStep = (val: any) => {
    if (val === "Profile") {
      setSelected("address");
      setProgress(100);
    }
    else if(val === "Address") {
      // Save to DB
      console.log("Save to DB");
    }
  }

  const BackStep = () => {
    setSelected("profile");
    setProgress(50);
    // }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <Progress aria-label="Loading..." size="md" value={progress} />
      <h1 className={title()}>ลงทะเบียน</h1>
      <div className="flex w-full flex-col">
        <Tabs aria-label="Options" selectedKey={selected}>
          <Tab key="profile" title="ข้อมูลส่วนตัว">
            <Step1 NextStep={NextStep} />
          </Tab>
          <Tab key="address" title="ที่อยู่อาศัย">
            <Step2 NextStep={NextStep} BackStep={BackStep} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
