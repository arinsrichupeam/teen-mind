/**
 * จัดเก็บรหัสผู้ให้คำแนะนำ (referent id) จาก QR code ไว้ชั่วคราวใน sessionStorage
 *
 * เหตุผลที่ใช้ sessionStorage แทนการส่งผ่าน URL:
 * - NextAuth `redirect` callback บังคับ path /liff/* กลับไปที่ /liff (ทิ้ง query string)
 *   ทำให้ ref หายตอน OAuth redirect — เก็บไว้ใน storage จึงรอดข้ามขั้นตอน login ได้
 * - scope แค่ session/แท็บปัจจุบัน และหมดอายุเอง จึงไม่มี ref เก่าค้างไปปนกับการประเมินครั้งถัดไป
 *
 * ทุก helper ป้องกัน SSR (window ไม่มีบน server) และ try/catch กรณี webview ปิด storage
 * (เช่น LINE in-app browser โหมดส่วนตัว) ซึ่งอาจ throw เมื่อเข้าถึง sessionStorage
 */

const REFERENT_REF_KEY = "teenmind:referentRef";

/**
 * บันทึก referent id ลง sessionStorage (เฉพาะค่าที่เป็นตัวเลขที่ถูกต้องเท่านั้น)
 */
export const saveReferentRef = (id: string | number): void => {
  if (typeof window === "undefined") return;

  const value = String(id).trim();

  // รับเฉพาะ id ที่เป็นจำนวนเต็มบวก ป้องกันค่าขยะจาก query string
  if (value === "" || !/^\d+$/.test(value)) return;

  try {
    window.sessionStorage.setItem(REFERENT_REF_KEY, value);
  } catch {
    // ไม่สามารถเข้าถึง storage ได้ — ข้ามไปอย่างเงียบ ๆ (ยังมี ref ใน URL เป็น fallback)
  }
};

/**
 * อ่าน referent id ที่เก็บไว้ (คืน "" ถ้าไม่มีหรือเข้าถึงไม่ได้) โดยไม่ลบทิ้ง
 */
export const peekReferentRef = (): string => {
  if (typeof window === "undefined") return "";

  try {
    return window.sessionStorage.getItem(REFERENT_REF_KEY) ?? "";
  } catch {
    return "";
  }
};

/**
 * ลบ referent id ที่เก็บไว้ — เรียกหลังทำแบบประเมินสำเร็จ เพื่อไม่ให้ค้างไปปนรอบถัดไป
 */
export const clearReferentRef = (): void => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(REFERENT_REF_KEY);
  } catch {
    // เข้าถึง storage ไม่ได้ — ไม่มีอะไรต้องทำ
  }
};
