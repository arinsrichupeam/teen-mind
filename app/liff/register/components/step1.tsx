"use client";

import { Profile, School } from "@prisma/client";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { Autocomplete, AutocompleteItem, DatePicker } from "@heroui/react";

import { prefix, sex, gradeYearLevels } from "@/utils/data";
import { validateCitizen, validateTel, safeParseDate } from "@/utils/helper";

/** Profile ที่มีฟิลด์ชั้นปี (gradeYear) สำหรับฟอร์มลงทะเบียน */
type ProfileWithGradeYear = Profile & { gradeYear?: number | null };

interface Props {
  NextStep: (val: any) => void;
  Result: ProfileWithGradeYear | undefined;
  HandleChange: (val: any) => void;
  onCancel?: () => void;
  /** กำหนดลำดับปุ่มหลัก: "next" = ปุ่มถัดไปอยู่บน, "cancel" = ปุ่มยกเลิกอยู่บน */
  primaryAction?: "next" | "cancel";
}

export const Step1 = ({
  NextStep,
  Result,
  HandleChange,
  onCancel,
  primaryAction = "next",
}: Props) => {
  const request = true;
  const [birthday, setBirthday] = useState<CalendarDate | null>(null);
  const [school, setSchool] = useState<School[]>([]);
  const [error, setError] = useState<string>("");

  const onSubmit = useCallback((e: any) => {
    e.preventDefault();
    NextStep("Profile");
  }, []);

  const DateChange = useCallback(
    (val: any) => {
      setBirthday(val);
      HandleChange({ target: { name: "birthday", value: new Date(val) } });
    },
    [HandleChange]
  );

  const validateCitizenId = async (value: string) => {
    const result = await validateCitizen(value, "user");
    const data = await result.json();

    if (!data.valid) {
      setError(data.error);

      return false;
    }
    setError("");

    return true;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) {
      return;
    }

    if (value.length === 13) {
      await validateCitizenId(value);
    } else {
      setError("");
    }

    HandleChange({ target: { name: "citizenId", value } });
  };

  useEffect(() => {
    if (Result?.birthday) {
      const parsedDate = safeParseDate(Result.birthday);

      if (parsedDate) {
        setBirthday(parsedDate);
      }
    }
  }, [Result?.birthday]);

  useEffect(() => {
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
      <Autocomplete
        defaultItems={school}
        errorMessage="กรุณากรอกสถานศึกษา"
        isRequired={false}
        label="สถานศึกษา"
        labelPlacement="inside"
        menuTrigger="input"
        name="school"
        placeholder="โรงเรียน"
        radius="md"
        scrollShadowProps={{
          isEnabled: false,
        }}
        selectedKey={Result?.schoolId?.toString() ?? null}
        size="sm"
        variant="faded"
        onSelectionChange={(val) => {
          const schoolId = val != null ? Number(val) : 0;

          HandleChange({ target: { name: "school", value: schoolId } });
          if (schoolId === 0) {
            HandleChange({ target: { name: "gradeYear", value: null } });
          }
        }}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
        )}
      </Autocomplete>
      {Result?.schoolId != null && Result.schoolId > 0 && (
        <Select
          errorMessage="กรุณาเลือกชั้นปี"
          isRequired={false}
          label="ชั้นปี"
          labelPlacement="inside"
          name="gradeYear"
          placeholder="เลือกชั้นปี"
          radius="md"
          selectedKeys={
            Result?.gradeYear != null ? [Result.gradeYear.toString()] : []
          }
          size="sm"
          variant="faded"
          onChange={(e) =>
            HandleChange({
              target: {
                name: "gradeYear",
                value: e.target.value ? parseInt(e.target.value, 10) : null,
              },
            })
          }
        >
          {gradeYearLevels.map((level) => (
            <SelectItem key={level.key}>{level.label}</SelectItem>
          ))}
        </Select>
      )}
      <Input
        errorMessage={error}
        isInvalid={!!error}
        isRequired={request}
        label="เลขบัตรประชาชน"
        labelPlacement="inside"
        maxLength={13}
        name="citizenId"
        placeholder="เลขบัตรประชาชน"
        radius="md"
        size="sm"
        type="text"
        value={Result?.citizenId ?? ""}
        variant="faded"
        onChange={handleChange}
      />
      <div className="flex flex-row gap-4 w-full">
        <Select
          className="max-w-xs"
          errorMessage="กรุณาเลือกคำนำหน้า"
          isDisabled={false}
          isRequired={request}
          label="คำนำหน้า"
          labelPlacement="inside"
          name="prefix"
          placeholder="คำนำหน้า"
          radius="md"
          selectedKeys={Result?.prefixId ? [Result.prefixId.toString()] : []}
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
          isDisabled={false}
          isRequired={request}
          label="เพศ"
          labelPlacement="inside"
          name="sex"
          placeholder="เพศ"
          radius="md"
          selectedKeys={Result?.sex ? [Result.sex.toString()] : []}
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
      <DatePicker
        className="w-full"
        errorMessage="กรุณาระบุวันเกิดให้ถูกต้อง"
        isRequired={request}
        label="วันเกิด"
        labelPlacement="inside"
        maxValue={parseDate(moment().format("YYYY-MM-DD"))}
        minValue={parseDate(
          moment().subtract(100, "years").format("YYYY-MM-DD")
        )}
        radius="md"
        selectorButtonPlacement="start"
        showMonthAndYearPickers={true}
        size="sm"
        value={birthday ?? undefined}
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
        errorMessage="กรอกเบอร์โทรศัพท์ไม่ถูกต้อง"
        isRequired={request}
        label="เบอร์โทรศัพท์"
        labelPlacement="inside"
        maxLength={10}
        name="tel"
        placeholder="เบอร์โทรศัพท์"
        radius="md"
        size="sm"
        type="text"
        validate={(val) => validateTel(val.toString())}
        value={Result?.tel}
        variant="faded"
        onChange={HandleChange}
      />
      {primaryAction === "cancel" && onCancel ? (
        <>
          <Button
            className="w-full"
            color="default"
            radius="full"
            size="lg"
            variant="solid"
            onPress={onCancel}
          >
            ยกเลิก
          </Button>
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
        </>
      ) : (
        <>
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
          {onCancel && (
            <Button
              className="w-full"
              color="default"
              radius="full"
              size="lg"
              variant="solid"
              onPress={onCancel}
            >
              ยกเลิก
            </Button>
          )}
        </>
      )}
    </Form>
  );
};
