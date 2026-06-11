"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@heroui/react";

import { getDaysInMonth } from "@/utils/helper";

type BirthdayValue = string | Date | null | undefined;

function parseBirthdayValue(value: BirthdayValue): {
  day: string;
  month: string;
  year: string;
} {
  if (!value) {
    return { day: "", month: "", year: "" };
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    const christianYear = value.getFullYear();
    const month = String(value.getMonth() + 1);
    const day = String(value.getDate());

    return { day, month, year: String(christianYear + 543) };
  }

  if (typeof value === "string") {
    if (value.includes("/")) {
      const [day, month, year] = value.split("/");

      return {
        day: day?.replace(/^0+/, "") || "",
        month: month?.replace(/^0+/, "") || "",
        year: year || "",
      };
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [christianYear, month, day] = value.split("T")[0].split("-");
      const thaiYear = String(parseInt(christianYear, 10) + 543);

      return {
        day: String(parseInt(day, 10)),
        month: String(parseInt(month, 10)),
        year: thaiYear,
      };
    }
  }

  return { day: "", month: "", year: "" };
}

function partsToThaiDisplay(day: string, month: string, year: string): string {
  if (!day || !month || !year) {
    return "";
  }

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);

  if (Number.isNaN(dayNum) || Number.isNaN(monthNum)) {
    return "";
  }

  return `${String(dayNum).padStart(2, "0")}/${String(monthNum).padStart(2, "0")}/${year}`;
}

function formatBirthdayTyping(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function partsToIso(day: string, month: string, thaiYear: string): string {
  if (!day || !month || !thaiYear) {
    return "";
  }

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const thaiYearNum = parseInt(thaiYear, 10);

  if (
    Number.isNaN(dayNum) ||
    Number.isNaN(monthNum) ||
    Number.isNaN(thaiYearNum)
  ) {
    return "";
  }

  const christianYear = thaiYearNum - 543;
  const maxDays = getDaysInMonth(monthNum, christianYear);
  const clampedDay = Math.min(Math.max(dayNum, 1), maxDays);

  const mm = String(monthNum).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");

  return `${christianYear}-${mm}-${dd}`;
}

interface BirthdaySelectProps {
  value?: BirthdayValue;
  onChange: (isoDate: string) => void;
  label?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
  name?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "flat" | "bordered" | "faded" | "underlined";
  labelPlacement?: "inside" | "outside";
}

export function BirthdaySelect({
  value,
  onChange,
  label = "วันเกิด",
  isRequired = false,
  isInvalid = false,
  errorMessage,
  className,
  name,
  placeholder = "วว/ดด/ปปปป (พ.ศ.)",
  size = "sm",
  variant = "faded",
  labelPlacement = "inside",
}: BirthdaySelectProps) {
  const { day, month, year } = parseBirthdayValue(value);

  const thaiDisplay = useMemo(
    () => partsToThaiDisplay(day, month, year),
    [day, month, year]
  );

  const [textDraft, setTextDraft] = useState(thaiDisplay);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (!isInputFocused) {
      setTextDraft(thaiDisplay);
    }
  }, [thaiDisplay, isInputFocused]);

  const applyTypedValue = useCallback(
    (formatted: string) => {
      if (formatted === "") {
        onChange("");

        return;
      }

      if (formatted.length !== 10) {
        return;
      }

      const [dayPart, monthPart, yearPart] = formatted.split("/");

      if (!dayPart || !monthPart || !yearPart || yearPart.length !== 4) {
        return;
      }

      const dayNum = parseInt(dayPart, 10);
      const monthNum = parseInt(monthPart, 10);

      if (Number.isNaN(dayNum) || Number.isNaN(monthNum)) {
        return;
      }

      onChange(partsToIso(String(dayNum), String(monthNum), yearPart));
    },
    [onChange]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthdayTyping(e.target.value);

    setTextDraft(formatted);
    applyTypedValue(formatted);
  };

  const handleTextBlur = () => {
    setIsInputFocused(false);

    if (textDraft === "") {
      onChange("");

      return;
    }

    if (textDraft.length === 10) {
      applyTypedValue(textDraft);

      return;
    }

    setTextDraft(thaiDisplay);
  };

  const inputValue = isInputFocused ? textDraft : thaiDisplay || textDraft;

  return (
    <Input
      className={className}
      errorMessage={errorMessage}
      inputMode="numeric"
      isInvalid={isInvalid}
      isRequired={isRequired}
      label={label}
      labelPlacement={labelPlacement}
      maxLength={10}
      name={name}
      placeholder={placeholder}
      size={size}
      type="text"
      value={inputValue}
      variant={variant}
      onBlur={handleTextBlur}
      onChange={handleTextChange}
      onFocus={() => {
        setIsInputFocused(true);
        setTextDraft(thaiDisplay || textDraft);
      }}
    />
  );
}
