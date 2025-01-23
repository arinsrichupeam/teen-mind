export function validateCitizen(idCardNo: string): string {
    idCardNo = idCardNo.replace("-", '');

    if (!idCardNo) {
        return "กรุณากรอกเลขบัตรประชาชน";
    }
    if (idCardNo.length !== 13) {
        return "กรอกเลขบัตรประชาชนไม่ครบถ้วน";
    }
    const isDigit: boolean = /^[0-9]*$/.test(idCardNo);
    if (!isDigit) {
        return "idCardNo is not only digit"
    }
    let sum: number = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(idCardNo.charAt(i)) * (13 - i);
    }

    const checksum: number = (11 - (sum % 11)) % 10;
    if (checksum !== parseInt(idCardNo.charAt(12))) {
        return "กรอกเลขบัตรประชาชนไม่ถูกต้อง"
    }
    return "";
}