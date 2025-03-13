"use client";

import { Profile, School } from "@prisma/client";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { DateInput } from "@heroui/date-input";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { Autocomplete, AutocompleteItem, NumberInput } from "@heroui/react";

import { prefix, sex } from "@/utils/data";
import { validateCitizen } from "@/utils/helper";

interface Props {
  NextStep: (val: any) => void;
  Result: Profile | undefined;
  HandleChange: (val: any) => void;
}

export const Step1 = ({ NextStep, Result, HandleChange }: Props) => {
  const request = true;
  const [birthday, setBirthday] = useState<CalendarDate>();
  const [school, setSchool] = useState<School[]>([]);

  const onSubmit = useCallback((e: any) => {
    e.preventDefault();
    NextStep("Profile");
  }, []);

  const DateChange = useCallback((val: any) => {
    HandleChange({ target: { name: "birthday", value: new Date(val) } });
  }, []);

  useEffect(() => {
    if (Result?.birthday.getDate() != new Date().getDate()) {
      setBirthday(parseDate(moment(Result?.birthday).format("YYYY-MM-DD")));
    }

    fetch("/api/data/school")
      .then((res) => res.json())
      .then((val) => {
        setSchool(val);
      });
  }, []);

  return (
    <Form
      className="flex flex-col gap-4 w-full text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <NumberInput
        formatOptions={{ useGrouping: false }}
        hideStepper={true}
        isRequired={request}
        label="เลขบัตรประชาชน"
        labelPlacement="inside"
        name="citizenId"
        placeholder="เลขบัตรประชาชน"
        radius="md"
        size="sm"
        validate={(val) => validateCitizen(val.toString())}
        value={parseInt(Result?.citizenId as string)}
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
          selectedKeys={
            Result?.prefixId === 0 ? "" : Result?.prefixId.toString()
          }
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
          selectedKeys={Result?.sex === 0 ? "" : Result?.sex.toString()}
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
        value={birthday}
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
        type="number"
        value={Result?.tel}
        variant="faded"
        onChange={HandleChange}
      />
      <Autocomplete
        defaultItems={school}
        errorMessage="กรุณากรอกสถานศึกษา"
        isRequired={request}
        label="สถานศึกษา"
        labelPlacement="inside"
        name="school"
        placeholder="โรงเรียน"
        radius="md"
        size="sm"
        value={Result?.schoolId as number}
        variant="faded"
        onSelectionChange={(val) =>
          HandleChange({ target: { name: "school", value: val } })
        }
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
        )}
      </Autocomplete>
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
