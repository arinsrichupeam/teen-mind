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
  latitude: number;
  longitude: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  schedule_telemed: Date;
  follow_up: Date;
  consult: string;
  createdAt: string;
  status: number;
  hn: string;
  profile: Profile;
  phqa: Phqa[];
  q2: q2[];
  addon: Addon[];
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
}

export interface q2 {
  q1: number;
  q2: number;
}

export interface Addon {
  q1: number;
  q2: number;
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
