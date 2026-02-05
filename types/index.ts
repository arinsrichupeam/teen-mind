import type { Key } from "@react-types/shared";

import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type LocationData = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

export type QuestionsData = {
  id: string;
  result: string;
  result_text: string;
  latitude: number;
  longitude: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  schedule_telemed: Date | null;
  follow_up: Date;
  consult: string;
  createdAt: string;
  status: number;
  hn: string;
  referentId: number | null;
  profile: Profile;
  referent: {
    id: number;
    citizenId: string;
    firstname: string;
    lastname: string;
  } | null;
  phqa: Phqa[];
  q2: Questions2Q[];
  addon: Addon[];
};

export interface User {
  image: string;
  profile: Profile[];
}

/** รูป school จาก API (object) หรือ string */
export type ProfileSchool =
  | string
  | { id: number; name: string; screeningDate?: Date | string | null };

export interface Profile {
  id: string;
  userId?: string;
  firstname: string;
  lastname: string;
  prefixId: string;
  sex: string;
  birthday: string;
  ethnicity: string;
  nationality: string;
  citizenId: string;
  tel: string;
  school: ProfileSchool;
  hn: string;
  address: Address[];
  emergency: Emergency[];
  user: User;
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

export interface Emergency {
  name: string;
  tel: string;
  relation: string;
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
  sum: number;
}

/** คะแนน 2Q (สองข้อ) */
export interface Questions2Q {
  q1: number;
  q2: number;
}

/** @deprecated ใช้ Questions2Q แทน */
export type q2 = Questions2Q;

export interface Addon {
  q1: number;
  q2: number;
}

/** PHQA คะแนน 9 ข้อ (สำหรับ payload ยังไม่มี sum) */
export interface PhqaPayload {
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

/** Payload สำหรับสร้าง/อัปเดตแบบประเมิน (POST/PUT question API) */
export interface QuestionPayload {
  profileId: string;
  reference?: number | null;
  phqa: PhqaPayload;
  Q2: Questions2Q;
  phqaAddon: Addon;
  location?: LocationData | null;
}

export interface ProfileAdminData {
  id: string;
  userId: string;
  providerAccountId: string;
  image: string;
  name: string;
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
  alert: boolean;
  createdAt: string;
  updatedAt: string;
  roleId: number;
}

export interface Consultant {
  id: string;
  name: string;
}

/** ใช้กับ Table sort (column + direction) */
export interface SortDescriptor {
  column?: string;
  direction?: "ascending" | "descending";
}

/** สำหรับ HeroUI Table ที่ต้องการ column และ direction เป็น required (ตรงกับ @react-aria) */
export interface TableSortDescriptor {
  column: Key;
  direction: "ascending" | "descending";
}
