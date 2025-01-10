"use client"

import { Card, CardBody } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Form } from "@nextui-org/form";
import { Select, SelectItem } from "@nextui-org/select";
import { DatePicker } from "@nextui-org/date-picker";
import { Button } from "@nextui-org/button";
import { useState } from "react";

export const Step1 = ({ NextStep }: { NextStep: (val: any) => void }) => {
    const sex = [
        { key: "1", label: "ชาย" },
        { key: "2", label: "หญิง" },
        { key: "3", label: "ไม่ระบุ" },
    ];

    const prefix = [
        { key: "1", label: "ด.ช." },
        { key: "2", label: "ด.ญ." },
        { key: "3", label: "นาย" },
        { key: "4", label: "น.ส." },
        { key: "5", label: "นาง" },
        { key: "99", label: "อื่นๆ" },
    ];

    const [request, setRequest] = useState(false);

    const onSubmit = (e: any) => {
        e.preventDefault()
        NextStep("Profile");
    }

    return (
        <Card className="w-full">
            <CardBody>
                <Form className="w-full max-w-xs items-center flex flex-col gap-4" validationBehavior="native" onSubmit={onSubmit}>
                    <Input type="number" label="เลขบัตรประชาชน" placeholder="เลขบัตรประชาชน" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกเลขบัตรประชาชน" />
                    <div className="flex flex-row gap-4 w-full">
                        <Select className="max-w-xs" name="prefix" label="คำนำหน้า" placeholder="คำนำหน้า" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกคำนำหน้า">
                            {prefix.map((prefix) => (
                                <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
                            ))}
                        </Select>
                        <Select className="max-w-xs" label="เพศ" placeholder="เพศ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกเพศ">
                            {sex.map((sex) => (
                                <SelectItem key={sex.key}>{sex.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <Input label="ชื่อ" placeholder="ชื่อ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกชื่อ" />
                    <Input label="นามสกุล" placeholder="นามสกุล" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกนามสกุล" />
                    <DatePicker className="w-full" label="วันเกิด" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกวันเกิด" showMonthAndYearPickers />
                    <div className="flex flex-row gap-4 w-full">
                        <Input label="เชื้อชาติ" placeholder="เชื้อชาติ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกเชื้อชาติ" />
                        <Input label="สัญชาติ" placeholder="สัญชาติ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกสัญชาติ" />
                    </div>
                    <Input label="เบอร์โทรศัพท์" placeholder="เบอร์โทรศัพท์" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกเบอร์โทรศัพท์" />
                    <Button className="w-full m-5" variant="solid" color="primary" size="lg" radius="full" type="submit">ถัดไป</Button>
                </Form>
            </CardBody>
        </Card>
    );
}

