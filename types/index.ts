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

export type QuestionsList = {
  id: string;
  prefixId: string;
  firstname: string;
  lastname: string;
  birthday: string;
  school: string;
  result: string;
  phqa: number;
  createdAt: string;
  status: number;
};

export type QuestionsData = {
  id: string;
  result: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  user: User;
  phqa: Phqa[];
  addon: Phqa_Addon[];
};

export interface User {
  image: string;
  profile: Profile[];
}

export interface Profile {
  id: string;
  firstname: string;
  lastname: string;
  prefixId: string;
  birthday: string;
  ethnicity: string;
  nationality: string;
  citizenId: string;
  tel: string;
  school: string;
  hn: string;
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

export interface Phqa {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
}

export interface Phqa_Addon {
  q1: number;
  q2: number;
}

export interface Profile_Admin_List {
  id: string;
  image: string;
  name: string;
  accounts: Account[];
  profile_admin: ProfileAdmin[];
}

export interface Account {
  providerAccountId: string;
}

export interface ProfileAdmin {
  id: string;
  userId: string;
  citizenId: string;
  prefixId: number;
  firstname: string;
  lastname: string;
  tel: string;
  affiliationId: number;
  agency: string;
  employeeTypeId: number;
  professional: string;
  license: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  role: Role[];
}

export interface Role {
  id: number;
  name: string;
}
