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

export function validateCitizen(idCardNo: string): string {
  if (!idCardNo) {
    return "กรุณากรอกเลขบัตรประชาชน";
  }
  if (idCardNo.length !== 13) {
    return "กรอกเลขบัตรประชาชนไม่ครบถ้วน";
  }
  const isDigit: boolean = /^[0-9]*$/.test(idCardNo);

  if (!isDigit) {
    return "idCardNo is not only digit";
  }
  let sum: number = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(idCardNo.charAt(i)) * (13 - i);
  }

  const checksum: number = (11 - (sum % 11)) % 10;

  if (checksum !== parseInt(idCardNo.charAt(12))) {
    return "กรอกเลขบัตรประชาชนไม่ถูกต้อง";
  }

  return "";
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
