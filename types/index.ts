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

export type Questions_List = {
  count: number;
  questions_data: QuestionsData[];
};

export type QuestionsData = {
  id: string;
  createdAt: string;
  result: string;
  status: number;
  consult: any;
  User: User;
  latitude: string;
  longitude: string;
};

export interface User {
  image: string;
  profile: Profile[];
}

export interface Profile {
  firstname: string;
  lastname: string;
  prefix: number;
  birthday: string;
  ethnicity: string;
  nationality: string;
  citizenId: string;
  tel: string;
  address: Address[];
}

export interface Address {
  houseNo: string;
  villageNo: string;
  soi: string;
  road: string;
  subdistrict: number;
  district: number;
  province: number;
}
