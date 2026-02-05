"use client";
import { useEffect, useState } from "react";
import { Address, Districts, Provinces, Subdistricts } from "@prisma/client";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";

type StepName = "Profile" | "Address" | "Emergency";

interface Step2Props {
  NextStep: (val: StepName) => void;
  BackStep: (val: StepName) => void;
  Result: Address | undefined;
  HandleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onCancel?: () => void;
}

export const Step2 = ({
  NextStep,
  BackStep,
  Result,
  HandleChange,
  onCancel,
}: Step2Props) => {
  const request = true;
  const [province, setProvince] = useState<Provinces[]>([]);
  const [district, setDistrict] = useState<Districts[]>([]);
  const [subDistrict, setSubDistrict] = useState<Subdistricts[]>([]);
  const [isProvinceLoading, setIsProvinceLoading] = useState<boolean>(false);
  const [isDistrictLoading, setIsDistrictLoading] = useState<boolean>(false);
  const [isSubDistrictLoading, setIsSubDistrictLoading] =
    useState<boolean>(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsProvinceLoading(true);
      try {
        const res = await fetch("/api/data/provinces");
        const val = await res.json();

        setProvince(val);

        // โหลดเขต/อำเภอ และแขวง/ตำบลเริ่มต้น สำหรับกรณีแก้ไขข้อมูล
        if (Result?.province) {
          await onProvinceChange(Result.province);
        }

        if (Result?.district) {
          await onDistrictChange(Result.district);
        }
      } finally {
        setIsProvinceLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const onProvinceChange = async (e: number | string | null) => {
    setDistrict([]);
    setSubDistrict([]);

    if (e !== null && e !== undefined) {
      const id = typeof e === "string" ? parseInt(e, 10) : e;

      setIsDistrictLoading(true);
      try {
        const res = await fetch(`/api/data/districts/${id}`);
        const val = await res.json();

        setDistrict(val);
      } finally {
        setIsDistrictLoading(false);
      }
      HandleChange({
        target: { name: "province", value: String(id) },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const onDistrictChange = async (e: number | string | null) => {
    setSubDistrict([]);

    if (e !== null && e !== undefined) {
      const id = typeof e === "string" ? parseInt(e, 10) : e;

      setIsSubDistrictLoading(true);
      try {
        const res = await fetch(`/api/data/subdistricts/${id}`);
        const val = await res.json();

        setSubDistrict(val);
      } finally {
        setIsSubDistrictLoading(false);
      }
      HandleChange({
        target: { name: "district", value: String(id) },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const onSubDistrictChange = (e: number | string | null) => {
    if (e !== null && e !== undefined) {
      const id = typeof e === "string" ? parseInt(e, 10) : e;

      HandleChange({
        target: { name: "subdistrict", value: String(id) },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    NextStep("Address");
  };

  return (
    <Form
      className="flex flex-col gap-4 text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <div className="flex flex-row gap-4 w-full">
        <Input
          errorMessage="กรุณากรอกบ้านเลขที่"
          isRequired={request}
          label="เลขที่"
          labelPlacement="inside"
          name="houseNo"
          placeholder="เลขที่"
          radius="md"
          size="sm"
          value={Result?.houseNo}
          variant="faded"
          onChange={HandleChange}
        />
        <Input
          label="หมู่ที่"
          labelPlacement="inside"
          name="villageNo"
          placeholder="หมู่ที่"
          radius="md"
          size="sm"
          value={Result?.villageNo}
          variant="faded"
          onChange={HandleChange}
        />
      </div>
      <Input
        label="ซอย"
        labelPlacement="inside"
        name="soi"
        placeholder="ซอย"
        radius="md"
        size="sm"
        value={Result?.soi}
        variant="faded"
        onChange={HandleChange}
      />
      <Input
        errorMessage="กรุณากรอกถนน"
        isRequired={request}
        label="ถนน"
        labelPlacement="inside"
        name="road"
        placeholder="ถนน"
        radius="md"
        size="sm"
        value={Result?.road}
        variant="faded"
        onChange={HandleChange}
      />
      <Autocomplete
        className="w-full"
        defaultSelectedKey={Result?.province.toString()}
        errorMessage="กรุณาเลือกจังหวัด"
        isDisabled={isProvinceLoading}
        isRequired={request}
        label="จังหวัด"
        labelPlacement="inside"
        name="province"
        placeholder={isProvinceLoading ? "กำลังโหลดจังหวัด..." : "จังหวัด"}
        radius="md"
        size="sm"
        variant="faded"
        onSelectionChange={onProvinceChange}
      >
        {province.map((province) => (
          <AutocompleteItem key={province.id}>
            {province.nameInThai}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Autocomplete
        className="w-full"
        defaultSelectedKey={Result?.district.toString()}
        errorMessage="กรุณาเลือกเขต/อำเภอ"
        isDisabled={isDistrictLoading || !Result?.province}
        isRequired={request}
        label="เขต/อำเภอ"
        labelPlacement="inside"
        name="district"
        placeholder={
          !Result?.province
            ? "เลือกจังหวัดก่อน"
            : isDistrictLoading
              ? "กำลังโหลดเขต/อำเภอ..."
              : "เขต/อำเภอ"
        }
        radius="md"
        size="sm"
        variant="faded"
        onSelectionChange={onDistrictChange}
      >
        {district.map((district) => (
          <AutocompleteItem key={district.id}>
            {district.nameInThai}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <Autocomplete
        className="w-full"
        defaultSelectedKey={Result?.subdistrict.toString()}
        errorMessage="กรุณาเลือกแขวง/ตำบล"
        isDisabled={isSubDistrictLoading || !Result?.district}
        isRequired={request}
        label="แขวง/ตำบล"
        labelPlacement="inside"
        name="subdistrict"
        placeholder={
          !Result?.district
            ? "เลือกเขต/อำเภอก่อน"
            : isSubDistrictLoading
              ? "กำลังโหลดแขวง/ตำบล..."
              : "แขวง/ตำบล"
        }
        radius="md"
        size="sm"
        variant="faded"
        onSelectionChange={onSubDistrictChange}
      >
        {subDistrict.map((subDistrict) => (
          <AutocompleteItem key={subDistrict.id}>
            {subDistrict.nameInThai}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      <div className="flex flex-col pt-5 gap-2 w-full">
        <Button
          className="w-full"
          radius="full"
          size="lg"
          variant="solid"
          onPress={() => BackStep("Address")}
        >
          ย้อนกลับ
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
        {onCancel && (
          <Button
            className="w-full"
            color="default"
            radius="full"
            size="lg"
            variant="bordered"
            onPress={onCancel}
          >
            ยกเลิก
          </Button>
        )}
      </div>
    </Form>
  );
};
