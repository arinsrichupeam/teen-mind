"use client";

import { Profile } from "@prisma/client";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { DateInput } from "@heroui/date-input";

import { prefix, sex } from "@/types";
import { validateCitizen } from "@/utils/validateCitizen";

export const Step1 = ({
  NextStep,
  Result,
  HandleChange,
}: {
  NextStep: (val: any) => void;
  Result: Profile | undefined;
  HandleChange: (val: any) => void;
}) => {
  const request = true;
  const onSubmit = (e: any) => {
    e.preventDefault();
    NextStep("Profile");
  };

  const DateChange = (val: any) => {
    HandleChange({ target: { name: "birthday", value: new Date(val) } });
  };

  return (
    <Form
      className="flex flex-col gap-4 w-full text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <Input
        isRequired={request}
        label="เลขบัตรประชาชน"
        labelPlacement="inside"
        name="citizenId"
        placeholder="เลขบัตรประชาชน"
        radius="md"
        size="sm"
        type="number"
        validate={(val) => validateCitizen(val)}
        value={Result?.citizenId}
        variant="faded"
        onChange={HandleChange}
      />
      <div className="flex flex-row gap-4 w-full">
        <Select
          className="max-w-xs"
          errorMessage="กรุณาเลือกคำนำหน้า"
          isRequired={request}
          label="คำนำหน้า"
          labelPlacement="inside"
          name="prefix"
          placeholder="คำนำหน้า"
          radius="md"
          selectedKeys={Result?.prefix.toString()}
          size="sm"
          variant="faded"
          onChange={HandleChange}
        >
          {prefix.map((prefix) => (
            <SelectItem key={prefix.key}>{prefix.label}</SelectItem>
          ))}
        </Select>
        <Select
          className="max-w-xs"
          errorMessage="กรุณาเลือกเพศ"
          isRequired={request}
          label="เพศ"
          labelPlacement="inside"
          name="sex"
          placeholder="เพศ"
          radius="md"
          selectedKeys={Result?.sex.toString()}
          size="sm"
          variant="faded"
          onChange={HandleChange}
        >
          {sex.map((sex) => (
            <SelectItem key={sex.key}>{sex.label}</SelectItem>
          ))}
        </Select>
      </div>
      <Input
        errorMessage="กรุณากรอกชื่อ"
        isRequired={request}
        label="ชื่อ"
        labelPlacement="inside"
        name="firstname"
        placeholder="ชื่อ"
        radius="md"
        size="sm"
        value={Result?.firstname}
        variant="faded"
        onChange={HandleChange}
      />
      <Input
        errorMessage="กรุณากรอกนามสกุล"
        isRequired={request}
        label="นามสกุล"
        labelPlacement="inside"
        name="lastname"
        placeholder="นามสกุล"
        radius="md"
        size="sm"
        value={Result?.lastname}
        variant="faded"
        onChange={HandleChange}
      />
      <DateInput
        className="w-full"
        errorMessage="กรุณาเลือกวันเกิด"
        isRequired={request}
        label="วันเกิด"
        labelPlacement="inside"
        radius="md"
        size="sm"
        variant="faded"
        onChange={DateChange}
      />
      <div className="flex flex-row gap-4 w-full">
        <Input
          errorMessage="กรุณากรอกเชื้อชาติ"
          isRequired={request}
          label="เชื้อชาติ"
          labelPlacement="inside"
          name="ethnicity"
          placeholder="เชื้อชาติ"
          radius="md"
          size="sm"
          value={Result?.ethnicity}
          variant="faded"
          onChange={HandleChange}
        />
        <Input
          errorMessage="กรุณากรอกสัญชาติ"
          isRequired={request}
          label="สัญชาติ"
          labelPlacement="inside"
          name="nationality"
          placeholder="สัญชาติ"
          radius="md"
          size="sm"
          value={Result?.nationality}
          variant="faded"
          onChange={HandleChange}
        />
      </div>
      <Input
        errorMessage="กรุณากรอกเบอร์โทรศัพท์"
        isRequired={request}
        label="เบอร์โทรศัพท์"
        labelPlacement="inside"
        name="tel"
        placeholder="เบอร์โทรศัพท์"
        radius="md"
        size="sm"
        value={Result?.tel}
        variant="faded"
        onChange={HandleChange}
      />
      <Input
        errorMessage="กรุณากรอกสถานศึกษา"
        isRequired={request}
        label="สถานศึกษา"
        labelPlacement="inside"
        name="school"
        placeholder="โรงเรียน"
        radius="md"
        size="sm"
        value={Result?.school!}
        variant="faded"
        onChange={HandleChange}
      />
      <Button
        className="w-full"
        color="primary"
        radius="full"
        size="lg"
        type="submit"
        variant="solid"
      >
        ถัดไป
      </Button>
    </Form>
  );
};
