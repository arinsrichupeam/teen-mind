import moment from "moment";
import { parseDate, parseDateTime } from "@internationalized/date";

const TH_OFFSET_MS = 7 * 60 * 60 * 1000;

const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const pad2 = (value: number) => String(value).padStart(2, "0");

/** ข้อมูลเก่าที่บันทึกแค่วันที่ (UTC เที่ยงคืน) */
export function isLegacyDateOnlyUtc(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/** แปลงค่า DB → CalendarDateTime สำหรับ DatePicker (granularity minute) ตามเวลาไทย */
export const safeParseDateTimeForPicker = (
  dateValue: unknown
): ReturnType<typeof parseDateTime> | undefined => {
  if (!dateValue) return undefined;

  try {
    const date = new Date(dateValue as string | Date);

    if (isNaN(date.getTime()) || date.getUTCFullYear() <= 1900) {
      return undefined;
    }

    if (isLegacyDateOnlyUtc(date)) {
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();

      return parseDateTime(`${year}-${pad2(month)}-${pad2(day)}T09:00`);
    }

    const th = new Date(date.getTime() + TH_OFFSET_MS);
    const year = th.getUTCFullYear();
    const month = th.getUTCMonth() + 1;
    const day = th.getUTCDate();
    const hour = th.getUTCHours();
    const minute = th.getUTCMinutes();

    return parseDateTime(
      `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`
    );
  } catch {
    return undefined;
  }
};

/** แปลงค่าจาก DatePicker → Date UTC สำหรับเก็บใน DB (ตีความเป็นเวลาไทย) */
export const dateTimePickerValueToDate = (value: string): Date | null => {
  if (!value) return null;

  try {
    const parsed = parseDateTime(value);
    const thailandAsUtcMs = Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hour,
      parsed.minute,
      0,
      0
    );

    return new Date(thailandAsUtcMs - TH_OFFSET_MS);
  } catch {
    return null;
  }
};

/** แสดงวันที่และเวลาในเขตเวลาไทย (UTC+7) */
export const formatThaiDateTimeAtThailand = (
  dateString: string | Date
): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    const th = new Date(date.getTime() + TH_OFFSET_MS);
    const day = th.getUTCDate();
    const month = THAI_MONTHS_FULL[th.getUTCMonth()];
    const year = th.getUTCFullYear() + 543;
    const hours = pad2(th.getUTCHours());
    const minutes = pad2(th.getUTCMinutes());

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  } catch {
    return "-";
  }
};

export function parseThaiDateToISO(thaiDateString: string): string {
  if (!thaiDateString) return "";

  try {
    const parts = thaiDateString.split("/");

    if (parts.length !== 3) return "";

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const thaiYear = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(thaiYear)) return "";
    if (day < 1 || day > 31 || month < 1 || month > 12) return "";

    const christianYear = thaiYear - 543;

    if (christianYear < 1900 || christianYear > 2100) return "";

    const date = new Date(Date.UTC(christianYear, month - 1, day));

    if (isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function calculateThaiYear(dateString: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "";

    return String(date.getFullYear() + 543);
  } catch {
    return "";
  }
}

export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "";

    const thaiYear = date.getFullYear() + 543;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${day}/${month}/${thaiYear}`;
  } catch {
    return "";
  }
}

export const safeParseDate = (
  dateValue: unknown
): ReturnType<typeof parseDate> | string | null => {
  if (!dateValue) return null;

  try {
    const momentDate = moment(dateValue);

    if (momentDate.isValid() && momentDate.year() > 1900) {
      const formattedDate = momentDate.format("YYYY-MM-DD");

      if (momentDate.year() > 0) {
        return parseDate(formattedDate);
      }
    }

    if (momentDate.isValid()) {
      const now = moment();
      const partialDate = momentDate.clone();

      if (partialDate.year() <= 1900) {
        partialDate.year(now.year());
      }

      if (partialDate.month() === 0) {
        partialDate.month(now.month());
      }

      if (partialDate.date() === 1 && momentDate.date() === 1) {
        partialDate.date(1);
      }

      if (partialDate.isValid() && partialDate.year() > 0) {
        return parseDate(partialDate.format("YYYY-MM-DD"));
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const safeParseDateForPicker = (
  dateValue: unknown
): ReturnType<typeof parseDate> | string | null => {
  if (!dateValue) return null;

  try {
    let dateToParse: Date | string = dateValue as Date | string;

    if (typeof dateValue === "string") {
      dateToParse = new Date(dateValue);
    }

    const momentDate = moment(dateToParse);

    if (momentDate.isValid() && momentDate.year() > 1900) {
      const formattedDate = momentDate.format("YYYY-MM-DD");

      if (momentDate.year() > 0) {
        return parseDate(formattedDate);
      }
    }

    return null;
  } catch {
    return null;
  }
};

/** แสดงวันที่แบบไทย (วัน เดือน ปี พ.ศ.) ตามเขตเวลาไทย */
export const formatThaiDate = (dateString: string | Date): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    const th = new Date(date.getTime() + TH_OFFSET_MS);
    const day = th.getUTCDate();
    const month = THAI_MONTHS_FULL[th.getUTCMonth()];
    const year = th.getUTCFullYear() + 543;

    return `${day} ${month} ${year}`;
  } catch {
    return "-";
  }
};

/** แสดงวันที่และเวลาแบบไทย ตามเขตเวลาไทย */
export const formatThaiDateTime = (dateString: string | Date): string => {
  return formatThaiDateTimeAtThailand(dateString);
};
