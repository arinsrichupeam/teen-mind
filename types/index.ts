import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type LocationData = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

export const sex = [
  { key: "1", label: "ชาย" },
  { key: "2", label: "หญิง" },
  { key: "3", label: "ไม่ระบุ" },
];

export const prefix = [
  { key: "1", label: "ด.ช." },
  { key: "2", label: "ด.ญ." },
  { key: "3", label: "นาย" },
  { key: "4", label: "น.ส." },
  { key: "5", label: "นาง" },
  { key: "99", label: "อื่นๆ" },
];
