"use client";

import { useCallback, useEffect, useState } from "react";
import { District, Province, Subdistrict } from "@prisma/client";
import { addToast } from "@heroui/react";

type AddressLike =
  | {
      houseNo?: string | null;
      villageNo?: string | null;
      soi?: string | null;
      road?: string | null;
      subdistrictId?: number | null;
      districtId?: number | null;
      provinceId?: number | null;
    }
  | null
  | undefined;

async function fetchJsonList<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch data from ${url}`);
  }

  return (await res.json()) as T;
}

export function formatThaiAddress(
  address: AddressLike,
  lookups: {
    provinces: Province[];
    districts: District[];
    subdistricts: Subdistrict[];
  }
): string {
  if (!address) return "";

  const subdistrictName =
    lookups.subdistricts.find((x) => x.id == address.subdistrictId)
      ?.nameInThai || "";
  const districtName =
    lookups.districts.find((x) => x.id == address.districtId)?.nameInThai || "";
  const provinceName =
    lookups.provinces.find((x) => x.id == address.provinceId)?.nameInThai || "";

  return [
    address.houseNo ? `บ้านเลขที่ ${address.houseNo}` : null,
    address.villageNo ? `ม.${address.villageNo}` : null,
    address.soi ? `ซ.${address.soi}` : null,
    address.road ? `ถ.${address.road}` : null,
    subdistrictName ? `ต.${subdistrictName}` : null,
    districtName ? `อ.${districtName}` : null,
    provinceName ? `จ.${provinceName}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function useThaiGeoLookups() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);

  const load = useCallback(async () => {
    try {
      const [provinceList, districtList, subdistrictList] = await Promise.all([
        fetchJsonList<Province[]>("/api/data/provinces"),
        fetchJsonList<District[]>("/api/data/districts"),
        fetchJsonList<Subdistrict[]>("/api/data/subdistricts"),
      ]);

      setProvinces(provinceList);
      setDistricts(districtList);
      setSubdistricts(subdistrictList);
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        color: "danger",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    provinces,
    districts,
    subdistricts,
    formatAddress: (address: AddressLike) =>
      formatThaiAddress(address, { provinces, districts, subdistricts }),
  };
}
