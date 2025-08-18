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
import { StatusUpdateButton } from "../status-update-button";

// ตัวเลือกสำหรับ filter สถานะ PHQA, 2Q, Addon
const riskStatusOptions = [
  { name: "พบความเสี่ยง", uid: "risk" },
  { name: "ไม่พบความเสี่ยง", uid: "no-risk" },
];

// ตัวเลือกสำหรับ filter สถานะ PHQA 5 ระดับ
const phqaStatusOptions = [
  { name: "ไม่พบความเสี่ยง", uid: "Green" },
  { name: "พบความเสี่ยงเล็กน้อย", uid: "Green-Low" },
  { name: "พบความเสี่ยงปานกลาง", uid: "Yellow" },
  { name: "พบความเสี่ยงมาก", uid: "Orange" },
  { name: "พบความเสี่ยงรุนแรง", uid: "Red" },
];

interface QuestionFilterContentProps {
  filterValue: string;
  onSearchChange: (value?: string) => void;
  statusFilter: Selection;
  setStatusFilter: (filter: Selection) => void;
  schoolFilter: string;
  setSchoolFilter: (filter: string) => void;
  phqaFilter: Selection;
  setPhqaFilter: (filter: Selection) => void;
  q2Filter: Selection;
  setQ2Filter: (filter: Selection) => void;
  addonFilter: Selection;
  setAddonFilter: (filter: Selection) => void;
  data?: any[];
  filteredData?: any[];
  onDataUpdate?: () => void;
}

export function QuestionFilterContent({
  filterValue,
  onSearchChange,
  statusFilter,
  setStatusFilter,
  schoolFilter,
  setSchoolFilter,
  phqaFilter,
  setPhqaFilter,
  q2Filter,
  setQ2Filter,
  addonFilter,
  setAddonFilter,
  data,
  filteredData,
  onDataUpdate,
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
      <div className="flex flex-col gap-3 w-full">
        {/* Search Bar และ Filter ทั้งหมด */}
        <div className="flex flex-col gap-3 w-full bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          {/* แถวที่ 1: Search และ School Filter */}
          <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center">
            <Input
              isClearable
              classNames={{
                base: "w-full shadow-sm",
              }}
              placeholder="ค้นหาชื่อ-นามสกุล"
              size="md"
              startContent={
                <MagnifyingGlassIcon className="size-5 text-default-400" />
              }
              value={filterValue}
              variant="bordered"
              onClear={() => onSearchChange("")}
              onValueChange={onSearchChange}
            />

            <Autocomplete
              classNames={{
                base: "w-full shadow-sm",
              }}
              placeholder="เลือกโรงเรียน"
              selectedKey={schoolFilter}
              size="md"
              startContent={
                <BuildingOfficeIcon className="size-5 text-default-400" />
              }
              variant="bordered"
              onSelectionChange={(key) => setSchoolFilter(key as string)}
            >
              {schoolsData?.map((school: any) => (
                <AutocompleteItem key={school.name}>
                  {school.name}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </div>

          {/* แถวที่ 2: Status Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* สถานะทั่วไป */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full shadow-sm"
                    color="primary"
                    endContent={<ChevronDownIcon className="size-4" />}
                    size="md"
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

              {/* PHQA Filter */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full shadow-sm"
                    color="primary"
                    endContent={<ChevronDownIcon className="size-4" />}
                    size="md"
                    variant="flat"
                  >
                    PHQA
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="PHQA Filter"
                  closeOnSelect={false}
                  selectedKeys={phqaFilter}
                  selectionMode="multiple"
                  onSelectionChange={setPhqaFilter}
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
                    className="w-full shadow-sm"
                    color="primary"
                    endContent={<ChevronDownIcon className="size-4" />}
                    size="md"
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

              {/* Addon Filter */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    className="w-full shadow-sm"
                    color="primary"
                    endContent={<ChevronDownIcon className="size-4" />}
                    size="md"
                    variant="flat"
                  >
                    Addon
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Addon Filter"
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
                className="w-full shadow-sm"
                color="danger"
                size="md"
                variant="bordered"
                onPress={() => {
                  onSearchChange("");
                  setStatusFilter(new Set(["0", "1"]));
                  setSchoolFilter("");
                  setPhqaFilter(new Set([]));
                  setQ2Filter(new Set([]));
                  setAddonFilter(new Set([]));
                }}
              >
                ล้าง Filter
              </Button>

              {/* ปุ่มปรับสถานะ */}
              {data && (
                <StatusUpdateButton data={data} onDataUpdate={onDataUpdate} />
              )}

              {/* Export Button */}
              {data && <ExportButton data={data} />}
            </div>
          </div>
        </div>

        {/* แสดง Filter ที่เลือก */}
        {(filterValue ||
          schoolFilter ||
          (statusFilter as Set<string>).size > 0 ||
          (phqaFilter as Set<string>).size > 0 ||
          (q2Filter as Set<string>).size > 0 ||
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

            {/* PHQA Filter */}
            {(phqaFilter as Set<string>).size > 0 &&
              Array.from(phqaFilter as Set<string>).map((phqa) => {
                const phqaOption = phqaStatusOptions.find(
                  (opt) => opt.uid === phqa
                );

                return (
                  <Chip
                    key={phqa}
                    className="text-xs"
                    color="default"
                    size="sm"
                    variant="flat"
                    onClose={() => {
                      const newPhqaFilter = new Set(phqaFilter as Set<string>);

                      newPhqaFilter.delete(phqa);
                      setPhqaFilter(newPhqaFilter);
                    }}
                  >
                    PHQA: {phqaOption?.name}
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

            {/* Addon Filter */}
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
                    Addon: {addonOption?.name}
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
      phqaFilter,
      q2Filter,
      addonFilter,
      schoolsData,
      setStatusFilter,
      setSchoolFilter,
      setPhqaFilter,
      setQ2Filter,
      setAddonFilter,
      data,
      filteredData,
    ]
  );

  return topContent;
}
