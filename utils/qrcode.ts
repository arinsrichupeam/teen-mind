import QRCode from "qrcode";

/**
 * สร้าง QR Code จากข้อความที่กำหนด
 * @param text ข้อความที่จะสร้างเป็น QR Code
 * @param options ตัวเลือกเพิ่มเติมสำหรับการสร้าง QR Code
 * @returns Promise ที่ resolve เป็น URL ของ QR Code
 */
export async function generateQRCode(
  text: string,
  options: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 200,
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, options);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้าง QR Code:", error);
    throw error;
  }
}

/**
 * สร้าง QR Code และดาวน์โหลดเป็นไฟล์
 * @param text ข้อความที่จะสร้างเป็น QR Code
 * @param filename ชื่อไฟล์ที่จะดาวน์โหลด
 * @param options ตัวเลือกเพิ่มเติมสำหรับการสร้าง QR Code
 */
export async function downloadQRCode(
  text: string,
  filename: string = "qrcode.png",
  options: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 200,
  }
): Promise<void> {
  try {
    const url = await generateQRCode(text, options);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดาวน์โหลด QR Code:", error);
    throw error;
  }
}
