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

export async function validateCitizen(idCardNo: string, source: "user" | "admin" | "referent" = "user"): Promise<true | { errorMessage: string }> {
  try {
    const response = await fetch("/api/validate/citizen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ citizenId: idCardNo, source }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        errorMessage: data.error
      };
    }

    return true;
  } catch (error) {
    console.error("Error validating citizen ID:", error);
    return {
      errorMessage: "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน"
    };
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
