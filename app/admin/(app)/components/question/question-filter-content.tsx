"use client";

import { useMemo } from "react";
import {
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Autocomplete,
  AutocompleteItem,
  Selection,
  addToast,
} from "@heroui/react";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import useSWR from "swr";

import { questionStatusOptions as options } from "../../data/optionData";
import { ExportButton } from "../export-button";
// import { StatusUpdateButton } from "../status-update-button";

import { QuestionsData } from "@/types";

// 2Q / PHQ-A Addon / 8Q: พบหรือไม่พบความเสี่ยง (กรองคนละตารางในฐานข้อมูล)
const riskStatusOptions = [
  { name: "พบความเสี่ยง", uid: "risk" },
  { name: "ไม่พบความเสี่ยง", uid: "no-risk" },
];

// ระดับจากคะแนน 9Q — ฟิลด์ result ตรงกับ getNineQRiskLevel (ไม่มี Green-Low)
const nineqStatusOptions = [
  {
    name: "ไม่มีอาการของโรคซึมเศร้าหรือมีอาการของโรคซึมเศร้าระดับน้อยมาก",
    uid: "Green",
  },
  { name: "มีอาการของโรคซึมเศร้า ระดับน้อย", uid: "Yellow" },
  { name: "มีอาการของโรคซึมเศร้า ระดับปานกลาง", uid: "Orange" },
  { name: "มีอาการของโรคซึมเศร้า ระดับรุนแรง", uid: "Red" },
];

// ระดับจากคะแนน PHQ-A — ฟิลด์ result ตรงกับ getPhqaRiskLevel
const phqaStatusOptions = [
  { name: "ไม่พบความเสี่ยง", uid: "Green" },
  { name: "พบความเสี่ยงเล็กน้อย", uid: "Green-Low" },
  { name: "พบความเสี่ยงปานกลาง", uid: "Yellow" },
  { name: "พบความเสี่ยงมาก", uid: "Orange" },
  { name: "พบความเสี่ยงรุนแรง", uid: "Red" },
];

/** แยกชุดคำถามหลัก (9Q มีแถว q9; PHQ-A เด็กเล็กไม่มี q9) */
const mainScaleOptions = [
  { name: "ทุกชุดแบบประเมิน", uid: "all" },
  { name: "9Q (อายุ 12 ปีขึ้นไป)", uid: "nineq" },
  { name: "PHQ-A (ต่ำกว่า 12 ปี)", uid: "phqa" },
];

interface QuestionFilterContentProps {
  filterValue: string;
  onSearchChange: (value?: string) => void;
  statusFilter: Selection;
  setStatusFilter: (filter: Selection) => void;
  schoolFilter: string;
  setSchoolFilter: (filter: string) => void;
  nineqResultFilter: Selection;
  setNineqResultFilter: (filter: Selection) => void;
  phqaResultFilter: Selection;
  setPhqaResultFilter: (filter: Selection) => void;
  q2Filter: Selection;
  setQ2Filter: (filter: Selection) => void;
  q8Filter: Selection;
  setQ8Filter: (filter: Selection) => void;
  addonFilter: Selection;
  setAddonFilter: (filter: Selection) => void;
  mainScaleFilter: string;
  setMainScaleFilter: (value: string) => void;
  data?: QuestionsData[];
  filteredData?: QuestionsData[];
  onDataUpdate?: () => void;
}

export function QuestionFilterContent({
  filterValue,
  onSearchChange,
  statusFilter,
  setStatusFilter,
  schoolFilter,
  setSchoolFilter,
  nineqResultFilter,
  setNineqResultFilter,
  phqaResultFilter,
  setPhqaResultFilter,
  q2Filter,
  setQ2Filter,
  q8Filter,
  setQ8Filter,
  addonFilter,
  setAddonFilter,
  mainScaleFilter,
  setMainScaleFilter,
  data,
  filteredData,
  // onDataUpdate,
}: QuestionFilterContentProps) {
  // ดึงข้อมูลโรงเรียน
  const { data: schoolsData } = useSWR(
    "/api/data/school",
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch schools");

        return res.json();
      } catch (error) {
        addToast({
          title: "Error fetching schools",
          description: error as string,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const topContent = useMemo(
    () => (
      <div className="flex flex-col gap-2 w-full">
        {/* Search Bar และ Filter ทั้งหมด */}
        <div className="flex flex-col gap-2 w-full bg-white rounded-lg p-2 shadow-sm border border-gray-200">
          {/* แถวที่ 1: Search และ School Filter */}
          <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
            <Input
              isClearable
              classNames={{
                base: "w-full shadow-sm",
                input: "text-small",
                inputWrapper: "min-h-9 h-9",
              }}
              placeholder="ค้นหาชื่อ-นามสกุล"
              size="sm"
              startContent={
                <MagnifyingGlassIcon className="size-4 text-default-400" />
              }
              value={filterValue}
              variant="bordered"
              onClear={() => onSearchChange("")}
              onValueChange={onSearchChange}
            />

            <Autocomplete
              classNames={{
                base: "w-full shadow-sm",
                selectorButton: "min-w-9 w-9",
              }}
              inputProps={{
                classNames: {
                  input: "text-small",
                  inputWrapper: "min-h-9 h-9",
                },
              }}
              placeholder="เลือกโรงเรียน"
              selectedKey={schoolFilter}
              size="sm"
              startContent={
                <BuildingOfficeIcon className="size-4 text-default-400" />
              }
              variant="bordered"
              onSelectionChange={(key) => setSchoolFilter(key as string)}
            >
              {schoolsData?.map((school: { id: number; name: string }) => (
                <AutocompleteItem key={school.name}>
                  {school.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </div>

          {/* แถวที่ 2: ชุดคำถามหลัก + สถานะ + ระดับคะแนน + 2Q/8Q/Addon */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2 items-center flex-wrap">
              {/* ชุดคำถามหลัก 9Q vs PHQ-A */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 min-w-0 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    {mainScaleOptions.find((o) => o.uid === mainScaleFilter)
                      ?.name ?? "ชุดคำถามหลัก"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Main scale filter"
                  selectedKeys={new Set([mainScaleFilter])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    const first = Array.from(keys as Set<string>)[0];

                    if (first) setMainScaleFilter(first);
                  }}
                >
                  {mainScaleOptions.map((opt) => (
                    <DropdownItem key={opt.uid} className="capitalize">
                      {opt.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* สถานะทั่วไป */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    สถานะ
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Table Columns"
                  closeOnSelect={false}
                  selectedKeys={statusFilter}
                  selectionMode="multiple"
                  onSelectionChange={setStatusFilter}
                >
                  {options.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* ระดับผล 9Q (กรองเฉพาะแถวที่มี q9 — ไม่ผูกกับชุดคำถามหลัก) */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 min-w-0 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    9Q
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="9Q risk levels"
                  closeOnSelect={false}
                  selectedKeys={nineqResultFilter}
                  selectionMode="multiple"
                  onSelectionChange={setNineqResultFilter}
                >
                  {nineqStatusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* ระดับผล PHQ-A ชุดหลัก (แถวที่ไม่มี q9) */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 min-w-0 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    PHQ-A
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="PHQ-A main scale risk levels"
                  closeOnSelect={false}
                  selectedKeys={phqaResultFilter}
                  selectionMode="multiple"
                  onSelectionChange={setPhqaResultFilter}
                >
                  {phqaStatusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* 2Q Filter */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    2Q
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="2Q Filter"
                  closeOnSelect={false}
                  selectedKeys={q2Filter}
                  selectionMode="multiple"
                  onSelectionChange={setQ2Filter}
                >
                  {riskStatusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* 8Q (คะแนนรวม sum — คอลัมน์ 8Q ในตาราง) */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    8Q
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="8Q Filter"
                  closeOnSelect={false}
                  selectedKeys={q8Filter}
                  selectionMode="multiple"
                  onSelectionChange={setQ8Filter}
                >
                  {riskStatusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* PHQ-A Addon (2 ข้อ — ไม่ใช่ 8Q) */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full sm:w-auto min-h-8 h-8 min-w-0 px-3 text-small shadow-sm"
                    color="primary"
                    endContent={
                      <ChevronDownIcon className="size-3.5 shrink-0" />
                    }
                    size="sm"
                    variant="flat"
                  >
                    PHQ-A Addon
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="PHQ-A Addon Filter"
                  closeOnSelect={false}
                  selectedKeys={addonFilter}
                  selectionMode="multiple"
                  onSelectionChange={setAddonFilter}
                >
                  {riskStatusOptions.map((status) => (
                    <DropdownItem key={status.uid} className="capitalize">
                      {status.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>

              {/* Clear All Filters */}
              <Button
                className="w-full sm:w-auto min-h-8 h-8 px-3 text-small shadow-sm"
                color="danger"
                size="sm"
                variant="bordered"
                onPress={() => {
                  onSearchChange("");
                  setStatusFilter(new Set([]));
                  setSchoolFilter("");
                  setNineqResultFilter(new Set([]));
                  setPhqaResultFilter(new Set([]));
                  setQ2Filter(new Set([]));
                  setQ8Filter(new Set([]));
                  setAddonFilter(new Set([]));
                  setMainScaleFilter("all");
                }}
              >
                ล้าง Filter
              </Button>

              {/* ปุ่มปรับสถานะ */}
              {/* {data && (
                <StatusUpdateButton data={data} onDataUpdate={onDataUpdate} />
              )} */}

              {/* Export Button */}
              {data && <ExportButton data={data} />}
            </div>
          </div>
        </div>

        {/* แสดง Filter ที่เลือก */}
        {(filterValue ||
          schoolFilter ||
          mainScaleFilter !== "all" ||
          (statusFilter as Set<string>).size > 0 ||
          (nineqResultFilter as Set<string>).size > 0 ||
          (phqaResultFilter as Set<string>).size > 0 ||
          (q2Filter as Set<string>).size > 0 ||
          (q8Filter as Set<string>).size > 0 ||
          (addonFilter as Set<string>).size > 0) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-small text-default-500">Filter :</span>

            {/* Search Filter */}
            {filterValue && (
              <Chip
                className="text-xs"
                color="default"
                size="sm"
                variant="flat"
                onClose={() => onSearchChange("")}
              >
                ชื่อ: {filterValue}
              </Chip>
            )}

            {/* ชุดคำถามหลัก */}
            {mainScaleFilter !== "all" && (
              <Chip
                className="text-xs"
                color="secondary"
                size="sm"
                variant="flat"
                onClose={() => setMainScaleFilter("all")}
              >
                ชุดหลัก:{" "}
                {mainScaleOptions.find((o) => o.uid === mainScaleFilter)
                  ?.name ?? mainScaleFilter}
              </Chip>
            )}

            {/* School Filter */}
            {schoolFilter && (
              <Chip
                className="text-xs"
                color="default"
                size="sm"
                variant="flat"
                onClose={() => setSchoolFilter("")}
              >
                โรงเรียน: {schoolFilter}
              </Chip>
            )}

            {/* Status Filter */}
            {(statusFilter as Set<string>).size > 0 &&
              Array.from(statusFilter as Set<string>).map((status) => {
                const statusOption = options.find((opt) => opt.uid === status);

                return (
                  <Chip
                    key={status}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const newStatusFilter = new Set(
                        statusFilter as Set<string>
                      );

                      newStatusFilter.delete(status);
                      setStatusFilter(newStatusFilter);
                    }}
                  >
                    สถานะ: {statusOption?.name}
                  </Chip>
                );
              })}

            {/* ระดับผล 9Q */}
            {(nineqResultFilter as Set<string>).size > 0 &&
              Array.from(nineqResultFilter as Set<string>).map((uid) => {
                const opt = nineqStatusOptions.find((o) => o.uid === uid);

                return (
                  <Chip
                    key={`9q-${uid}`}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const next = new Set(nineqResultFilter as Set<string>);

                      next.delete(uid);
                      setNineqResultFilter(next);
                    }}
                  >
                    9Q: {opt?.name ?? uid}
                  </Chip>
                );
              })}

            {/* ระดับผล PHQ-A ชุดหลัก */}
            {(phqaResultFilter as Set<string>).size > 0 &&
              Array.from(phqaResultFilter as Set<string>).map((uid) => {
                const opt = phqaStatusOptions.find((o) => o.uid === uid);

                return (
                  <Chip
                    key={`phqa-${uid}`}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const next = new Set(phqaResultFilter as Set<string>);

                      next.delete(uid);
                      setPhqaResultFilter(next);
                    }}
                  >
                    PHQ-A: {opt?.name ?? uid}
                  </Chip>
                );
              })}

            {/* 2Q Filter */}
            {(q2Filter as Set<string>).size > 0 &&
              Array.from(q2Filter as Set<string>).map((q2) => {
                const q2Option = riskStatusOptions.find(
                  (opt) => opt.uid === q2
                );

                return (
                  <Chip
                    key={q2}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const newQ2Filter = new Set(q2Filter as Set<string>);

                      newQ2Filter.delete(q2);
                      setQ2Filter(newQ2Filter);
                    }}
                  >
                    2Q: {q2Option?.name}
                  </Chip>
                );
              })}

            {/* 8Q */}
            {(q8Filter as Set<string>).size > 0 &&
              Array.from(q8Filter as Set<string>).map((q8) => {
                const q8Option = riskStatusOptions.find(
                  (opt) => opt.uid === q8
                );

                return (
                  <Chip
                    key={q8}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const newQ8Filter = new Set(q8Filter as Set<string>);

                      newQ8Filter.delete(q8);
                      setQ8Filter(newQ8Filter);
                    }}
                  >
                    8Q: {q8Option?.name}
                  </Chip>
                );
              })}

            {/* PHQ-A Addon */}
            {(addonFilter as Set<string>).size > 0 &&
              Array.from(addonFilter as Set<string>).map((addon) => {
                const addonOption = riskStatusOptions.find(
                  (opt) => opt.uid === addon
                );

                return (
                  <Chip
                    key={addon}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const newAddonFilter = new Set(
                        addonFilter as Set<string>
                      );

                      newAddonFilter.delete(addon);
                      setAddonFilter(newAddonFilter);
                    }}
                  >
                    PHQ-A Addon: {addonOption?.name}
                  </Chip>
                );
              })}
          </div>
        )}
      </div>
    ),
    [
      filterValue,
      statusFilter,
      onSearchChange,
      schoolFilter,
      nineqResultFilter,
      phqaResultFilter,
      q2Filter,
      q8Filter,
      addonFilter,
      mainScaleFilter,
      schoolsData,
      setStatusFilter,
      setSchoolFilter,
      setNineqResultFilter,
      setPhqaResultFilter,
      setQ2Filter,
      setQ8Filter,
      setAddonFilter,
      setMainScaleFilter,
      data,
      filteredData,
    ]
  );

  return topContent;
}
