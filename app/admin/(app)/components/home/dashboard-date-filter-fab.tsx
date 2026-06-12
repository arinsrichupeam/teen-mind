"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button, DateRangePicker } from "@heroui/react";
import { CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { parseDate } from "@internationalized/date";

import {
  formatThaiDateLabel,
  parseDateParam,
} from "@/lib/dashboard/parse-dashboard-date";

export type DashboardDateRange = {
  start?: string;
  end?: string;
};

type Props = {
  value: DashboardDateRange;
  onChange: (range: DashboardDateRange) => void;
};

export function DashboardDateFilterFab({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasFilter = Boolean(value.start && value.end);

  const filterLabel = useMemo(() => {
    if (!value.start) return "";

    const from = parseDateParam(value.start);

    if (!from) return `${value.start} – ${value.end ?? ""}`;

    if (value.end) {
      const to = parseDateParam(value.end);

      if (to) {
        return `${formatThaiDateLabel(from)} – ${formatThaiDateLabel(to)}`;
      }
    }

    return `${formatThaiDateLabel(from)} – ปัจจุบัน`;
  }, [value.end, value.start]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      {isOpen ? (
        <button
          aria-label="ปิดตัวกรองช่วงเวลา"
          className="fixed inset-0 z-[90] cursor-default bg-black/20"
          type="button"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        {isOpen ? (
          <div className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-default-200 bg-white p-4 shadow-xl">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-default-700">ช่วงเวลา</p>
              <DateRangePicker
                label="เลือกช่วงวันที่"
                value={
                  value.start && value.end
                    ? {
                        start: parseDate(value.start),
                        end: parseDate(value.end),
                      }
                    : null
                }
                onChange={(range) => {
                  if (!range) {
                    onChange({});

                    return;
                  }
                  onChange({
                    start: range.start?.toString(),
                    end: range.end?.toString(),
                  });
                }}
              />
              {hasFilter ? (
                <Button
                  color="danger"
                  size="sm"
                  startContent={<XMarkIcon className="size-4" />}
                  variant="light"
                  onPress={() => onChange({})}
                >
                  ล้างตัวกรอง
                </Button>
              ) : null}
            </div>
          </div>
        ) : hasFilter ? (
          <span className="rounded-full border border-default-200 bg-white/95 px-3 py-1 text-xs text-default-600 shadow-md backdrop-blur-sm">
            {filterLabel}
          </span>
        ) : value.start && !value.end ? (
          <span className="rounded-full border border-default-200 bg-white/95 px-3 py-1 text-xs text-default-600 shadow-md backdrop-blur-sm">
            {filterLabel}
          </span>
        ) : null}

        <Button
          isIconOnly
          aria-expanded={isOpen}
          aria-label="กรองช่วงเวลา"
          className="shadow-lg"
          color={hasFilter ? "success" : "primary"}
          radius="full"
          size="lg"
          variant={hasFilter ? "flat" : "flat"}
          onPress={() => setIsOpen((open) => !open)}
        >
          <CalendarDaysIcon className="size-6" />
        </Button>
      </div>
    </>,
    document.body
  );
}
