import { calculateAge } from "@/lib/age";

export async function validateCitizen(
  idCardNo: string,
  source: "user" | "admin" | "referent" = "user",
  excludeId?: string | number | null
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
      return Response.json(
        { valid: false, error: data.error, ...data },
        { status: response.status }
      );
    }

    return Response.json({ valid: true });
  } catch (error) {
    return Response.json(
      {
        error:
          "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน" +
          (error instanceof Error ? error.message : ""),
      },
      { status: 500 }
    );
  }
}

export function validateEmail(email: string): string {
  const isValidEmail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g;

  if (email === "") {
    return "กรุณากรอกอีเมล";
  } else if (email.match(isValidEmail)) {
    return "";
  }

  return "กรอกอีเมลไม่ถูกต้อง";
}

export function validateTel(phone: string): string {
  if (phone === "") {
    return "กรุณากรอกเบอร์โทรศัพท์";
  }

  const isValidTel = /^0[689]\d{8}$/;

  if (phone.match(isValidTel)) {
    return "";
  }

  return "กรอกเบอร์โทรศัพท์ไม่ถูกต้อง";
}

export function calculateGradeLevel(age: number): string {
  switch (age) {
    case 12:
      return "ป.6";
    case 13:
      return "ม.1";
    case 14:
      return "ม.2";
    case 15:
      return "ม.3";
    case 16:
      return "ม.4";
    case 17:
      return "ม.5";
    case 18:
      return "ม.6";
    default:
      return "-";
  }
}

export function calculateGradeLevelFromBirthday(birthDate: string): string {
  const age = calculateAge(birthDate);

  return calculateGradeLevel(age);
}

export function calculateGradeLevelFromThaiYear(thaiYear: number): string {
  const currentYear = new Date().getFullYear() + 543;
  const age = currentYear - thaiYear;

  return calculateGradeLevel(age);
}
