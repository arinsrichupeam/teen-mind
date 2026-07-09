"use client";
import { useCallback, useEffect, useState } from "react";
import { Address, Districts, Provinces, Subdistricts } from "@prisma/client";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";

import { liffPopoverProps } from "@/utils/liff-popover-props";

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

const parseGeoId = (value: unknown): number | null => {
  if (value == null || value === "" || value === 0 || value === "0") {
    return null;
  }

  const id = typeof value === "number" ? value : parseInt(String(value), 10);

  return Number.isNaN(id) || id <= 0 ? null : id;
};

async function fetchGeoList<T>(url: string): Promise<T[]> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
  }

  return data as T[];
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
  const [isProvinceLoading, setIsProvinceLoading] = useState(true);
  const [isDistrictLoading, setIsDistrictLoading] = useState(false);
  const [isSubDistrictLoading, setIsSubDistrictLoading] = useState(false);
  const [provinceLoadError, setProvinceLoadError] = useState(false);

  const selectedProvinceId = parseGeoId(Result?.province);
  const selectedDistrictId = parseGeoId(Result?.district);
  const selectedSubdistrictId = parseGeoId(Result?.subdistrict);

  const reloadProvinces = useCallback(async () => {
    setIsProvinceLoading(true);
    setProvinceLoadError(false);

    try {
      const provinces = await fetchGeoList<Provinces>("/api/data/provinces");

      setProvince(provinces);
    } catch (error) {
      setProvince([]);
      setProvinceLoadError(true);
      addToast({
        title: "โหลดจังหวัดไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
        color: "danger",
      });
    } finally {
      setIsProvinceLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initialProvinceId = parseGeoId(Result?.province);
    const initialDistrictId = parseGeoId(Result?.district);

    const loadInitialData = async () => {
      setIsProvinceLoading(true);
      setProvinceLoadError(false);

      try {
        const provinces = await fetchGeoList<Provinces>("/api/data/provinces");

        if (cancelled) return;

        setProvince(provinces);

        if (initialProvinceId) {
          setIsDistrictLoading(true);
          try {
            const districts = await fetchGeoList<Districts>(
              `/api/data/districts/${initialProvinceId}`
            );

            if (cancelled) return;

            setDistrict(districts);

            if (initialDistrictId) {
              setIsSubDistrictLoading(true);
              try {
                const subdistricts = await fetchGeoList<Subdistricts>(
                  `/api/data/subdistricts/${initialDistrictId}`
                );

                if (cancelled) return;

                setSubDistrict(subdistricts);
              } finally {
                if (!cancelled) {
                  setIsSubDistrictLoading(false);
                }
              }
            }
          } finally {
            if (!cancelled) {
              setIsDistrictLoading(false);
            }
          }
        }
      } catch (error) {
        if (cancelled) return;

        setProvince([]);
        setProvinceLoadError(true);
        addToast({
          title: "โหลดจังหวัดไม่สำเร็จ",
          description:
            error instanceof Error
              ? error.message
              : "กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
          color: "danger",
        });
      } finally {
        if (!cancelled) {
          setIsProvinceLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
    // โหลดครั้งเดียวตอน mount — ค่าเริ่มต้นจาก Result ถูก capture ใน closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProvinceChange = async (e: number | string | null) => {
    setDistrict([]);
    setSubDistrict([]);

    if (e === null || e === undefined) {
      HandleChange({
        target: { name: "province", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
      HandleChange({
        target: { name: "district", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
      HandleChange({
        target: { name: "subdistrict", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);

      return;
    }

    const id = typeof e === "string" ? parseInt(e, 10) : e;

    if (Number.isNaN(id) || id <= 0) {
      return;
    }

    setIsDistrictLoading(true);
    try {
      const districts = await fetchGeoList<Districts>(
        `/api/data/districts/${id}`
      );

      setDistrict(districts);
    } catch (error) {
      setDistrict([]);
      addToast({
        title: "โหลดเขต/อำเภอไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
        color: "danger",
      });
    } finally {
      setIsDistrictLoading(false);
    }

    HandleChange({
      target: { name: "province", value: String(id) },
    } as React.ChangeEvent<HTMLInputElement>);
    HandleChange({
      target: { name: "district", value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
    HandleChange({
      target: { name: "subdistrict", value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const onDistrictChange = async (e: number | string | null) => {
    setSubDistrict([]);

    if (e === null || e === undefined) {
      HandleChange({
        target: { name: "district", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
      HandleChange({
        target: { name: "subdistrict", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);

      return;
    }

    const id = typeof e === "string" ? parseInt(e, 10) : e;

    if (Number.isNaN(id) || id <= 0) {
      return;
    }

    setIsSubDistrictLoading(true);
    try {
      const subdistricts = await fetchGeoList<Subdistricts>(
        `/api/data/subdistricts/${id}`
      );

      setSubDistrict(subdistricts);
    } catch (error) {
      setSubDistrict([]);
      addToast({
        title: "โหลดแขวง/ตำบลไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่",
        color: "danger",
      });
    } finally {
      setIsSubDistrictLoading(false);
    }

    HandleChange({
      target: { name: "district", value: String(id) },
    } as React.ChangeEvent<HTMLInputElement>);
    HandleChange({
      target: { name: "subdistrict", value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const onSubDistrictChange = (e: number | string | null) => {
    if (e === null || e === undefined) {
      HandleChange({
        target: { name: "subdistrict", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);

      return;
    }

    const id = typeof e === "string" ? parseInt(e, 10) : e;

    if (Number.isNaN(id) || id <= 0) {
      return;
    }

    HandleChange({
      target: { name: "subdistrict", value: String(id) },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    NextStep("Address");
  };

  return (
    <Form
      className="flex flex-col gap-3 sm:gap-4 w-full min-w-0 text-start"
      validationBehavior="native"
      onSubmit={onSubmit}
    >
      <div className="flex flex-row gap-2 sm:gap-4 w-full min-w-0">
        <Input
          className="flex-1 min-w-0"
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
          className="flex-1 min-w-0"
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
        defaultItems={province}
        errorMessage={
          provinceLoadError
            ? "โหลดจังหวัดไม่สำเร็จ กรุณากดโหลดใหม่"
            : "กรุณาเลือกจังหวัด"
        }
        isDisabled={isProvinceLoading}
        isInvalid={provinceLoadError}
        isRequired={request}
        label="จังหวัด"
        labelPlacement="inside"
        menuTrigger="input"
        name="province"
        placeholder={
          isProvinceLoading
            ? "กำลังโหลดจังหวัด..."
            : provinceLoadError
              ? "โหลดจังหวัดไม่สำเร็จ"
              : "จังหวัด"
        }
        popoverProps={liffPopoverProps}
        radius="md"
        selectedKey={
          selectedProvinceId != null ? String(selectedProvinceId) : null
        }
        size="sm"
        variant="faded"
        onSelectionChange={onProvinceChange}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.nameInThai}</AutocompleteItem>
        )}
      </Autocomplete>
      {provinceLoadError && (
        <Button
          color="primary"
          radius="full"
          size="sm"
          variant="flat"
          onPress={() => void reloadProvinces()}
        >
          โหลดจังหวัดใหม่
        </Button>
      )}
      <Autocomplete
        className="w-full"
        defaultItems={district}
        errorMessage="กรุณาเลือกเขต/อำเภอ"
        isDisabled={isDistrictLoading || selectedProvinceId == null}
        isRequired={request}
        label="เขต/อำเภอ"
        labelPlacement="inside"
        menuTrigger="input"
        name="district"
        placeholder={
          selectedProvinceId == null
            ? "เลือกจังหวัดก่อน"
            : isDistrictLoading
              ? "กำลังโหลดเขต/อำเภอ..."
              : "เขต/อำเภอ"
        }
        popoverProps={liffPopoverProps}
        radius="md"
        selectedKey={
          selectedDistrictId != null ? String(selectedDistrictId) : null
        }
        size="sm"
        variant="faded"
        onSelectionChange={onDistrictChange}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.nameInThai}</AutocompleteItem>
        )}
      </Autocomplete>
      <Autocomplete
        className="w-full"
        defaultItems={subDistrict}
        errorMessage="กรุณาเลือกแขวง/ตำบล"
        isDisabled={isSubDistrictLoading || selectedDistrictId == null}
        isRequired={request}
        label="แขวง/ตำบล"
        labelPlacement="inside"
        menuTrigger="input"
        name="subdistrict"
        placeholder={
          selectedDistrictId == null
            ? "เลือกเขต/อำเภอก่อน"
            : isSubDistrictLoading
              ? "กำลังโหลดแขวง/ตำบล..."
              : "แขวง/ตำบล"
        }
        popoverProps={liffPopoverProps}
        radius="md"
        selectedKey={
          selectedSubdistrictId != null ? String(selectedSubdistrictId) : null
        }
        size="sm"
        variant="faded"
        onSelectionChange={onSubDistrictChange}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>{item.nameInThai}</AutocompleteItem>
        )}
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
