import moment from "moment";
import { parseDate } from "@internationalized/date";

export function CheckPHQAStatus(val: number) {
  switch (true) {
    case val >= 0 && val <= 4:
      return "ไม่พบความเสี่ยง";
    case val >= 5 && val <= 9:
      return "พบความเสี่ยงเล็กน้อย";
    case val >= 10 && val <= 14:
      return "พบความเสี่ยงปานกลาง";
    case val >= 15 && val <= 19:
      return "พบความเสี่ยงมาก";
    case val >= 20 && val <= 27:
      return "พบความเสี่ยงรุนแรง";
  }
}

// ฟังก์ชันตรวจสอบจำนวนวันในแต่ละเดือน
export function getDaysInMonth(month: number, year: number): number {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // ตรวจสอบปีอธิกสุรทิน (leap year)
  if (month === 2) {
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }

    return 28;
  }

  return daysInMonth[month - 1];
}

// ฟังก์ชัน validate วันเกิด
export function validateBirthday(
  birthday: string,
  minAge: number = 4,
  maxAge: number = 100
): string {
  if (!birthday || birthday === "") {
    return "กรุณาระบุวันเกิด";
  }

  if (!birthday.includes("/")) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  const parts = birthday.split("/");

  if (parts.length !== 3) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const thaiYear = parseInt(parts[2]);

  if (isNaN(day) || isNaN(month) || isNaN(thaiYear)) {
    return "รูปแบบวันเกิดไม่ถูกต้อง กรุณากรอกในรูปแบบ dd/mm/yyyy";
  }

  if (month < 1 || month > 12) {
    return "เดือนไม่ถูกต้อง (1-12)";
  }

  const christianYear = thaiYear - 543;

  if (christianYear < 1900 || christianYear > 2100) {
    return "ปีไม่ถูกต้อง";
  }

  // ตรวจสอบจำนวนวันในเดือนนั้น
  const maxDays = getDaysInMonth(month, christianYear);

  if (day < 1 || day > maxDays) {
    if (month === 2) {
      return `เดือนกุมภาพันธ์มีได้ไม่เกิน ${maxDays} วัน`;
    }

    return `เดือน ${month} มีได้ไม่เกิน ${maxDays} วัน`;
  }

  try {
    // สร้างวันที่โดยใช้ UTC เพื่อหลีกเลี่ยงปัญหา timezone
    const date = new Date(Date.UTC(christianYear, month - 1, day));

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) {
      return "วันที่ไม่ถูกต้อง";
    }

    const today = new Date();

    // ตรวจสอบไม่ให้เป็นวันอนาคต
    if (date > today) {
      return "วันเกิดไม่สามารถเป็นวันอนาคตได้";
    }

    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    if (age < minAge) {
      return `วันที่ไม่ถูกต้อง`;
    }

    if (age > maxAge) {
      return `วันที่ไม่ถูกต้อง`;
    }

    return "";
  } catch (error) {
    return "วันที่ไม่ถูกต้อง" + error;
  }
}

// ฟังก์ชันแปลงวันที่จากปี พ.ศ. เป็นปี ค.ศ. สำหรับบันทึก
export function parseThaiDateToISO(thaiDateString: string): string {
  if (!thaiDateString) return "";

  try {
    const parts = thaiDateString.split("/");

    if (parts.length !== 3) return "";

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const thaiYear = parseInt(parts[2]);

    // ตรวจสอบความถูกต้องของข้อมูล
    if (isNaN(day) || isNaN(month) || isNaN(thaiYear)) return "";
    if (day < 1 || day > 31 || month < 1 || month > 12) return "";

    const christianYear = thaiYear - 543;

    // ตรวจสอบปีที่ถูกต้อง
    if (christianYear < 1900 || christianYear > 2100) return "";

    // สร้างวันที่โดยใช้ UTC เพื่อหลีกเลี่ยงปัญหา timezone
    const date = new Date(Date.UTC(christianYear, month - 1, day));

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
}

// ฟังก์ชันคำนวณปีไทย
export function calculateThaiYear(dateString: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "";

    const thaiYear = date.getFullYear() + 543;

    return thaiYear.toString();
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
}

// ฟังก์ชันแปลงวันที่เป็นปี พ.ศ. สำหรับแสดงผล
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "";

    const thaiYear = date.getFullYear() + 543;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${day}/${month}/${thaiYear}`;
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
}

export async function validateCitizen(
  idCardNo: string,
  source: "user" | "admin" | "referent" = "user",
  excludeId?: number | null
): Promise<Response> {
  try {
    const response = await fetch("/api/validate/citizen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ citizenId: idCardNo, source, excludeId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error }, { status: response.status });
    }

    return Response.json({ valid: true });
  } catch (error) {
    return Response.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน" + error },
      { status: 500 }
    );
  }
}

export function validateEmail(email: string): string {
  const isValidEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

  if (email === "") {
    return "กรุณากรอกอีเมล";
  } else if (email.match(isValidEmail)) {
    return "";
  }

  return "กรอกอีเมลไม่ถูกต้อง";
}

export function validateTel(tel: string): string {
  if (tel === "") {
    return "กรุณากรอกเบอร์โทรศัพท์";
  }

  const isValidTel = /^0[689]\d{8}$/;

  if (tel.match(isValidTel)) {
    return "";
  }

  return "กรอกเบอร์โทรศัพท์ไม่ถูกต้อง";
}

/**
 * Parse date safely with validation
 * @param dateValue - The date value to parse
 * @returns Parsed date or null if invalid
 */
export const safeParseDate = (dateValue: any): any => {
  if (!dateValue) return null;

  try {
    const momentDate = moment(dateValue);

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ และปีต้องมากกว่า 1900
    if (momentDate.isValid() && momentDate.year() > 1900) {
      const formattedDate = momentDate.format("YYYY-MM-DD");

      // ตรวจสอบเพิ่มเติมว่าวันที่ที่ได้ไม่เป็นลบ
      if (momentDate.year() > 0) {
        return parseDate(formattedDate);
      }
    }

    // ถ้าวันที่ไม่สมบูรณ์ ให้ลองแปลงเป็นวันที่ปัจจุบัน
    if (momentDate.isValid()) {
      const now = moment();
      const partialDate = momentDate.clone();

      // ถ้าไม่มีปี ให้ใช้ปีปัจจุบัน
      if (partialDate.year() <= 1900) {
        partialDate.year(now.year());
      }

      // ถ้าไม่มีเดือน ให้ใช้เดือนปัจจุบัน
      if (partialDate.month() === 0) {
        partialDate.month(now.month());
      }

      // ถ้าไม่มีวัน ให้ใช้วันที่ 1
      if (partialDate.date() === 1 && momentDate.date() === 1) {
        partialDate.date(1);
      }

      // ตรวจสอบอีกครั้งว่าวันที่ที่ได้ถูกต้อง
      if (partialDate.isValid() && partialDate.year() > 0) {
        return parseDate(partialDate.format("YYYY-MM-DD"));
      }
    }
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }

  return null;
};

/**
 * Parse date for DatePicker with enhanced error handling
 * @param dateValue - The date value to parse
 * @returns Parsed date or null if invalid
 */
export const safeParseDateForPicker = (dateValue: any): any => {
  if (!dateValue) return null;

  try {
    // ถ้าเป็น string ให้แปลงเป็น Date object ก่อน
    let dateToParse = dateValue;

    if (typeof dateValue === "string") {
      dateToParse = new Date(dateValue);
    }

    const momentDate = moment(dateToParse);

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ และปีต้องมากกว่า 1900
    if (momentDate.isValid() && momentDate.year() > 1900) {
      const formattedDate = momentDate.format("YYYY-MM-DD");

      // ตรวจสอบเพิ่มเติมว่าวันที่ที่ได้ไม่เป็นลบ
      if (momentDate.year() > 0) {
        return parseDate(formattedDate);
      }
    }

    // ถ้าวันที่ไม่สมบูรณ์หรือไม่ถูกต้อง ให้ return null
    return null;
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
};

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย
export const formatThaiDate = (dateString: string | Date): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    const thaiMonths = [
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
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.

    return `${day} ${month} ${year}`;
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
};

// ฟังก์ชันแปลงวันที่เป็นรูปแบบไทยพร้อมเวลา
export const formatThaiDateTime = (dateString: string | Date): string => {
  if (!dateString) return "-";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return "-";

    const thaiMonths = [
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
    ];

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  } catch (error) {
    return "ไม่ระบุวันที่" + error;
  }
};
