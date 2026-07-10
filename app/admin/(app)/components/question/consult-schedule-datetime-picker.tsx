"use client";

import { DatePicker } from "@heroui/react";

import { safeParseDateTimeForPicker } from "@/utils/helper";

type Props = {
  name: string;
  label: string;
  value: Date | string | null | undefined;
  isDisabled?: boolean;
  isRequired?: boolean;
  onChange?: (name: string, value: string) => void;
};

export function ConsultScheduleDateTimePicker({
  name,
  label,
  value,
  isDisabled = false,
  isRequired = false,
  onChange,
}: Props) {
  return (
    <DatePicker
      key={`${name}-${value?.toString() ?? ""}`}
      hideTimeZone
      showMonthAndYearPickers
      defaultValue={safeParseDateTimeForPicker(value)}
      granularity="minute"
      hourCycle={24}
      isDisabled={isDisabled}
      isRequired={isRequired}
      label={label}
      labelPlacement="outside"
      name={name}
      selectorButtonPlacement="start"
      variant="bordered"
      onChange={(date) => {
        onChange?.(name, date ? date.toString() : "");
      }}
    />
  );
}
