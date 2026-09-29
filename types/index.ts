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

/** สถานะติดตามครั้งที่ 1–3 (คำนวณจากนัด Telemed + ผู้ให้คำปรึกษา + Discharge SOAP ต่อครั้ง) */
export type FollowUpRoundTrackingStatus = {
  round: 1 | 2 | 3;
  complete: boolean;
  statusLabel: string;
  title: string;
  consultTelemedComplete: boolean;
  dischargeSoapComplete: boolean;
  /** รอบนี้ถูกทำเครื่องหมาย "ติดต่อไม่ได้" (ไม่นับเป็นการพบจริง) */
  unreachable: boolean;
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
  /** Discharge Summary รอบ 2–3 (ตาม schema questions_master) */
  subjective2?: string | null;
  subjective3?: string | null;
  objective2?: string | null;
  objective3?: string | null;
  assessment2?: string | null;
  assessment3?: string | null;
  plan2?: string | null;
  plan3?: string | null;
  note?: string | null;
  note2?: string | null;
  note3?: string | null;
  close_case_reason?: string | null;
  schedule_telemed: Date | null;
  schedule_telemed2?: Date | null;
  schedule_telemed3?: Date | null;
  follow_up: Date | null;
  follow_up2?: Date | null;
  follow_up3?: Date | null;
  /** ติดต่อไม่ได้ต่อรอบ — ไม่นับเป็นการพบจริงและไม่เลื่อนสถานะ */
  unreachable?: boolean | null;
  unreachable2?: boolean | null;
  unreachable3?: boolean | null;
  consult: string;
  consult2?: string | null;
  consult3?: string | null;
  createdAt: string;
  status: number;
  /** Native Case.status (PENDING / IN_PROGRESS / …) when mapped from Case */
  caseStatus?: string;
  /** หน่วยงานเจ้าของเคส (Case.healthcareFacility) — ใช้ scope permission ต่อหน่วย */
  healthcareFacilityId?: string | null;
  healthcareFacility?: { id: string; name: string } | null;
  /** คำขอส่งต่อค้าง (Case.transferToFacility) */
  transferToFacilityId?: string | null;
  transferToFacility?: { id: string; name: string } | null;
  transferNote?: string | null;
  transferRequestedAt?: string | Date | null;
  /** ประวัติ CaseTransfer (ล่าสุดก่อน) */
  transfers?: {
    id: string;
    status: string;
    requestNote?: string | null;
    responseNote?: string | null;
    requestedAt: string | Date;
    respondedAt?: string | Date | null;
    fromFacility?: { id: string; name: string } | null;
    toFacility?: { id: string; name: string } | null;
  }[];
  /** Profile_Admin.id of the assigned consult */
  assigneeAdminId?: string | null;
  /** User.id of assignee — matches consultant Autocomplete keys */
  assigneeUserId?: string | null;
  /** Display name of assignee (first + last) */
  assigneeName?: string | null;
  hn: string;
  /** Draft สิทธิจากค้นหา สปสช. ก่อนกดบันทึก (เหมือน hn ระดับเคส) */
  nhsoDraft?: {
    mainInsclCode?: string | null;
    mainInsclName?: string | null;
    subInsclCode?: string | null;
    subInsclName?: string | null;
    hmainCode?: string | null;
    hmainName?: string | null;
    hsubCode?: string | null;
    hsubName?: string | null;
    nhsoVerifiedAt?: string | Date | null;
  } | null;
  referentId: number | null;
  profile: Profile;
  referent: {
    id: number;
    citizenId: string;
    firstName: string;
    lastName: string;
  } | null;
  phqa: Phqa[];
  q2: Questions2Q[];
  addon: Addon[];
  q9: Q9Data[];
  q8: Q8Data[];
  problem: ProblemPayload[];
  /** จาก GET /api/question/[id] (คำนวณฝั่งเซิร์ฟเวอร์) */
  followUpRoundStatuses?: FollowUpRoundTrackingStatus[];
  /** TreatmentNote ทุกรอบ (ไม่จำกัด 3) — ใช้ใน UI บันทึกคำปรึกษา */
  treatmentNotes?: {
    round: number;
    consult?: string | null;
    scheduleTelemed?: Date | string | null;
    serviceEndedAt?: Date | string | null;
    unreachable?: boolean | null;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    note?: string | null;
    sessionSelfHarmRisk?: string | null;
    psychRisk?: string | null;
    presentingTopics?: string[] | null;
    presentingTopicsOther?: string | null;
    interventions?: string[] | null;
    interventionsOther?: string | null;
    sessionOutcome?: string | null;
    afterCarePlan?: string | null;
    afterCarePlanOther?: string | null;
    followUp?: Date | string | null;
  }[];
};

export interface User {
  image: string;
  /** ชื่อแสดงจาก LINE (เก็บใน User.name) */
  name?: string | null;
  profile: Profile[];
}

/** รูป school จาก API (object) หรือ string */
export type ProfileSchool =
  | string
  | {
      id: number;
      name: string;
      screeningDate?: Date | string | null;
      screenings?: {
        round: number;
        startDate: Date | string;
        endDate?: Date | string | null;
      }[];
    };

export interface Profile {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  prefixId: string;
  sex: string;
  birthDate: string;
  ethnicity: string;
  nationality: string;
  citizenId: string;
  phone: string;
  school: ProfileSchool;
  /** หน่วยงานที่ผู้ใช้เลือกตอนลงทะเบียน (กรณีไม่ใช่นักเรียน) */
  healthcareFacility?: { id: string; name: string } | null;
  gradeYear?: number | null;
  hn: string;
  mainInsclCode?: string | null;
  mainInsclName?: string | null;
  subInsclCode?: string | null;
  subInsclName?: string | null;
  hmainCode?: string | null;
  hmainName?: string | null;
  hsubCode?: string | null;
  hsubName?: string | null;
  nhsoVerifiedAt?: string | Date | null;
  address: Address[];
  emergency: Emergency[];
  user: User;
}

export interface Address {
  houseNo: string;
  villageNo: string;
  soi: string;
  road: string;
  subdistrictId: number;
  districtId: number;
  provinceId: number;
}

export interface Emergency {
  name: string;
  phone: string;
  relation: string;
}

export interface Phqa {
  round?: number;
  createdAt?: string | Date;
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
  round?: number;
  createdAt?: string | Date;
  q1: number;
  q2: number;
}

/** @deprecated ใช้ Questions2Q แทน */
export type q2 = Questions2Q;

export interface Addon {
  round?: number;
  createdAt?: string | Date;
  q1: number;
  q2: number;
}

export interface Q9Data {
  round?: number;
  createdAt?: string | Date;
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

export interface Q8Data {
  round?: number;
  createdAt?: string | Date;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q8Addon: number;
  sum: number;
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

/** 9Q payload (มี sum สำหรับคำนวณระดับความเสี่ยง) */
export interface Q9Payload extends PhqaPayload {
  sum: number;
}

/** 8Q payload (มี q8Addon และ sum สำหรับคำนวณความเสี่ยง) */
export interface Q8Payload {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q8Addon: number;
  sum: number;
}

export interface ProblemPayload {
  round?: number;
  createdAt?: string | Date;
  familyRelation: number;
  familyStudyPressure: number;
  familyConflict: number;
  familyAbuse: number;
  familyLoss: number;
  socialFriendIssue: number;
  socialBullying: number;
  socialBreakup: number;
  socialTeacher: number;
  socialAssault: number;
  studyStress: number;
  studyNoMotivation: number;
  studyBurnout: number;
  studyTimeManage: number;
  studyHomeworkLoad: number;
  studyExamAnxiety: number;
  financeFamilyIssue: number;
  lifestyleSocialMediaOveruse: number;
  lifestyleGamingAddiction: number;
  lifestyleSubstanceUse: number;
  lifestyleEatingIssue: number;
  lifestyleBodyImageConcern: number;
  lifestyleInsomnia: number;
  sum: number;
}

/** Payload สำหรับสร้าง/อัปเดตแบบประเมิน (POST/PUT question API) */
export interface QuestionPayload {
  profileId: string;
  reference?: number | null;
  phqa?: PhqaPayload & { sum: number };
  Q2: Questions2Q;
  phqaAddon?: Addon;
  q9?: Q9Payload;
  q8?: Q8Payload;
  problem?: ProblemPayload;
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
  firstName: string;
  lastName: string;
  phone: string;
  affiliationId: number | null;
  /** @deprecated use healthcareFacilityId */
  agency?: string;
  healthcareFacilityId?: string | null;
  facilityUnitId?: number | null;
  /** AdminDataScope — elevated values set by SUPERADMIN only */
  scopeLevel?: string;
  zoneId?: number | null;
  /** Effective visibility after แม่ zone elevation for Admin (list/detail API) */
  effectiveScopeLevel?: string;
  facilitatedZoneId?: number | null;
  facilitatedZoneName?: string | null;
  employeeTypeId: number;
  /** @deprecated use profession */
  professional?: string;
  profession?: string;
  license: string;
  /** AdminStatus enum or legacy 0/1/3 for UI */
  status: number | string;
  receiveAlert: boolean;
  createdAt: string;
  updatedAt: string;
  roleId: number;
  /** Role.name from DB (e.g. Consult / Admin) */
  roleName?: string;
  /** Role.code from DB (e.g. STAFF / ADMIN) */
  roleCode?: string;
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

export type MapLocationProfile = {
  id: string;
  prefixId: string;
  firstName: string;
  lastName: string;
  schoolName: string | null;
};

export type MapLocation = {
  id: string;
  latitude: number;
  longitude: number;
  result: string;
  result_text: string | null;
  status: number;
  createdAt: string;
  profile: MapLocationProfile;
};

export type MapRiskSummary = {
  Green: number;
  "Green-Low": number;
  Yellow: number;
  Orange: number;
  Red: number;
};

export type MapLocationsResponse = {
  total: number;
  summary: MapRiskSummary;
  locations: MapLocation[];
};

export type MapViewMode = "markers" | "heatmap";

export type MapFilterState = {
  dateFrom: string;
  dateTo: string;
  school: string;
  results: string[];
};
