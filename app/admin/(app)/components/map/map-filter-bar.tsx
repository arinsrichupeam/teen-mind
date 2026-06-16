"use client";

import { useMemo } from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  DateRangePicker,
  addToast,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import useSWR from "swr";

import {
  ASSESSMENT_RESULT_LABELS,
  getAssessmentResultColor,
} from "@/lib/assessment-result-colors";
import { MapFilterState, MapViewMode } from "@/types";

const RISK_OPTIONS = [
  { key: "Green", label: "ไม่พบความเสี่ยง" },
  { key: "Green-Low", label: "เล็กน้อย" },
  { key: "Yellow", label: "ปานกลาง" },
  { key: "Orange", label: "มาก" },
  { key: "Red", label: "รุนแรง" },
] as const;

type SchoolOption = {
  id: number;
  name: string;
};

type Props = {
  filters: MapFilterState;
  viewMode: MapViewMode;
  onFiltersChange: (filters: MapFilterState) => void;
  onViewModeChange: (mode: MapViewMode) => void;
};

const emptyFilters: MapFilterState = {
  dateFrom: "",
  dateTo: "",
  school: "",
  results: [],
};

export function MapFilterBar({
  filters,
  viewMode,
  onFiltersChange,
  onViewModeChange,
}: Props) {
  const { data: schoolsData } = useSWR<SchoolOption[]>(
    "/api/data/school",
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch schools");

        return res.json();
      } catch (error) {
        addToast({
          title: "Error fetching schools",
          description: String(error),
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

  const schools = schoolsData ?? [];
  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.dateFrom ||
          filters.dateTo ||
          filters.school ||
          filters.results.length > 0
      ),
    [filters]
  );

  const toggleResult = (result: string) => {
    const next = filters.results.includes(result)
      ? filters.results.filter((item) => item !== result)
      : [...filters.results, result];

    onFiltersChange({ ...filters, results: next });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-default-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <DateRangePicker
          className="w-full lg:max-w-xs"
          label="ช่วงวันที่ประเมิน"
          labelPlacement="outside"
          value={
            filters.dateFrom && filters.dateTo
              ? {
                  start: parseDate(filters.dateFrom),
                  end: parseDate(filters.dateTo),
                }
              : null
          }
          onChange={(range) => {
            if (!range?.start || !range?.end) {
              onFiltersChange({
                ...filters,
                dateFrom: "",
                dateTo: "",
              });

              return;
            }

            onFiltersChange({
              ...filters,
              dateFrom: range.start.toString(),
              dateTo: range.end.toString(),
            });
          }}
        />

        <Autocomplete
          className="w-full lg:max-w-sm"
          label="โรงเรียน"
          labelPlacement="outside"
          placeholder="เลือกโรงเรียน"
          selectedKey={filters.school || null}
          onSelectionChange={(key) => {
            onFiltersChange({
              ...filters,
              school: key ? String(key) : "",
            });
          }}
        >
          {schools.map((school) => (
            <AutocompleteItem key={school.name} textValue={school.name}>
              {school.name}
            </AutocompleteItem>
          ))}
        </Autocomplete>

        <div className="flex gap-2">
          <Button
            color={viewMode === "markers" ? "primary" : "default"}
            variant={viewMode === "markers" ? "solid" : "flat"}
            onPress={() => onViewModeChange("markers")}
          >
            จุด
          </Button>
          <Button
            color={viewMode === "heatmap" ? "primary" : "default"}
            variant={viewMode === "heatmap" ? "solid" : "flat"}
            onPress={() => onViewModeChange("heatmap")}
          >
            ความหนาแน่น
          </Button>
        </div>

        {hasActiveFilters ? (
          <Button
            color="danger"
            variant="light"
            onPress={() => onFiltersChange(emptyFilters)}
          >
            ล้างตัวกรอง
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {RISK_OPTIONS.map(({ key, label }) => {
          const selected = filters.results.includes(key);

          return (
            <Chip
              key={key}
              className="cursor-pointer"
              size="sm"
              style={{
                backgroundColor: selected
                  ? `${getAssessmentResultColor(key)}33`
                  : undefined,
                borderColor: getAssessmentResultColor(key),
                color: selected ? getAssessmentResultColor(key) : undefined,
              }}
              variant={selected ? "solid" : "bordered"}
              onClick={() => toggleResult(key)}
            >
              {label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

export const MAP_LEGEND_ITEMS = RISK_OPTIONS.map(({ key, label }) => ({
  key,
  label: ASSESSMENT_RESULT_LABELS[key] ?? label,
}));
