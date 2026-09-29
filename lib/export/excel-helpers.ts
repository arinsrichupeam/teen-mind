/** แปลง index คอลัมน์ (0-based) เป็นตัวอักษร Excel เช่น 0→A, 26→AA */
export function excelColLetter(index: number): string {
  let n = index;
  let s = "";

  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }

  return s;
}

/**
 * สูตร Excel คำนวณอายุ ปี เดือน วัน
 * รองรับทั้งค่าวันที่ Excel (ปี พ.ศ. ที่ Excel แปลงอัตโนมัติ) และข้อความ dd/mm/พ.ศ.
 */
export function buildAgeAtDateExcelFormula(
  birthdayRef: string,
  assessDateRef: string
): string {
  const toCE = (ref: string) =>
    `IF(ISNUMBER(${ref}),DATE(YEAR(${ref})-IF(YEAR(${ref})>=2400,543,0),MONTH(${ref}),DAY(${ref})),DATE(VALUE(RIGHT(TRIM(${ref}),4))-543,VALUE(MID(${ref},FIND("/",${ref})+1,FIND("/",${ref},FIND("/",${ref})+1)-FIND("/",${ref})-1)),VALUE(LEFT(${ref},FIND("/",${ref})-1))))`;

  const b = toCE(birthdayRef);
  const a = toCE(assessDateRef);

  return `IF(OR(${birthdayRef}="",${birthdayRef}="-",${assessDateRef}=""),"",DATEDIF(${b},${a},"Y")&" ปี "&DATEDIF(${b},${a},"YM")&" เดือน "&DATEDIF(${b},${a},"MD")&" วัน")`;
}
