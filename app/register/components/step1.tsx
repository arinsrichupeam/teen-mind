"use client"

import { Button, Card, CardBody, DateInput, DatePicker, Form, Input, Select, SelectItem } from "@heroui/react";
import { useState } from "react";
import { Profile } from "@prisma/client";
import { prefix, sex } from "@/types/systemmodel";
import { validateCitizen } from "@/utils/validateCitizen";

export const Step1 = ({ NextStep, Result, HandleChange }: { NextStep: (val: any) => void; Result: Profile | undefined; HandleChange: (val: any) => void }) => {
    const [request, setRequest] = useState(true);

    const onSubmit = (e: any) => {
        e.preventDefault();
        NextStep("Profile");
    }

    const DateChange = (val: any) => {
        HandleChange({ target: { name: "birthday", value: new Date(val) } });
    }

    return (
        <Card className="w-full">
            <CardBody>
                <Form className="w-full max-w-xs items-center flex flex-col gap-4" validationBehavior="native" onSubmit={onSubmit}>
                    <Input type="number" value={Result?.citizenId} name="citizenId" validate={(val) => validateCitizen(val)} onChange={HandleChange} label="เลขบัตรประชาชน" placeholder="เลขบัตรประชาชน" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} />
                    <div className="flex flex-row gap-4 w-full">
                        <Select className="max-w-xs" selectedKeys={Result?.prefix.toString()} name="prefix" onChange={HandleChange} label="คำนำหน้า" placeholder="คำนำหน้า" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกคำนำหน้า">
                            {prefix.map((prefix) => (
                                <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
                            ))}
                        </Select>
                        <Select className="max-w-xs" selectedKeys={Result?.sex.toString()} name="sex" onChange={HandleChange} label="เพศ" placeholder="เพศ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกเพศ">
                            {sex.map((sex) => (
                                <SelectItem key={sex.key}>{sex.label}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <Input label="ชื่อ" value={Result?.firstname} name="firstname" onChange={HandleChange} placeholder="ชื่อ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกชื่อ" />
                    <Input label="นามสกุล" value={Result?.lastname} name="lastname" onChange={HandleChange} placeholder="นามสกุล" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกนามสกุล" />
                    <DateInput className="w-full" onChange={DateChange} label="วันเกิด" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณาเลือกวันเกิด" />
                    <div className="flex flex-row gap-4 w-full">
                        <Input label="เชื้อชาติ" value={Result?.ethnicity} name="ethnicity" onChange={HandleChange} placeholder="เชื้อชาติ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกเชื้อชาติ" />
                        <Input label="สัญชาติ" value={Result?.nationality} name="nationality" onChange={HandleChange} placeholder="สัญชาติ" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกสัญชาติ" />
                    </div>
                    <Input label="เบอร์โทรศัพท์" value={Result?.tel} name="tel" onChange={HandleChange} placeholder="เบอร์โทรศัพท์" labelPlacement="inside" variant="bordered" size="sm" radius="md" isRequired={request} errorMessage="กรุณากรอกเบอร์โทรศัพท์" />
                    <Button className="w-full m-5" variant="solid" color="primary" size="lg" radius="full" type="submit">ถัดไป</Button>
                </Form>
            </CardBody>
        </Card>
    );
}

