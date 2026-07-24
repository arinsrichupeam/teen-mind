"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  DateRangePicker,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Chip,
  addToast,
  Progress,
  Switch,
  Divider,
} from "@heroui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { parseDate } from "@internationalized/date";
import useSWR from "swr";

import { questionStatusOptions } from "../../data/optionData";

import { QuestionsData, ProfileSchool } from "@/types";
import { gradeYearLevels, prefix } from "@/utils/data";
import {
  formatThaiDate,
  calculateAge,
  formatThaiDateTimeAtThailand,
  formatDateForDisplay,
  formatAgeYMD,
} from "@/utils/helper";
import {
  calculateQuestionStatus,
  isRoundUnreachable,
} from "@/lib/question-followup-rounds";
import { getScreeningStartByRound } from "@/lib/school-screening";

function formatExportDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const isoDate = new Date(value).toISOString().split("T")[0];

  return formatDateForDisplay(`${isoDate}T12:00:00`) || "";
}

function getSchoolScreenings(school: ProfileSchool | null | undefined) {
  if (typeof school === "object" && school !== null) {
    return {
      screenings: school.screenings,
      legacy: school.screeningDate ?? null,
    };
  }

  return { screenings: undefined, legacy: null };
}

interface ExportField {
  key: string;
  label: string;
  selected: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuestionsData[];
  dataType: "question" | "user" | "school" | "volunteer";
}

const ADDRESS_FIELD_KEYS = [
  "addrHouseNo",
  "addrVillageNo",
  "addrSubdistrict",
  "addrDistrict",
  "addrProvince",
] as const;

const UNREACHABLE_FIELD_KEYS = [
  "unreachable1",
  "unreachable2",
  "unreachable3",
] as const;

const CONTACT_ATTEMPT_FIELD_KEYS = [
  "contactAttemptDate1",
  "contactAttemptDate2",
  "contactAttemptDate3",
] as const;

/** แปลง index คอลัมน์ (0-based) เป็นตัวอักษร Excel เช่น 0→A, 26→AA */
function excelColLetter(index: number): string {
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
function buildAgeAtDateExcelFormula(
  birthdayRef: string,
  assessDateRef: string
): string {
  // แปลง พ.ศ. → ค.ศ. (ถ้าปี >= 2400 ถือว่าเป็น พ.ศ.)
  const toCE = (ref: string) =>
    `IF(ISNUMBER(${ref}),DATE(YEAR(${ref})-IF(YEAR(${ref})>=2400,543,0),MONTH(${ref}),DAY(${ref})),DATE(VALUE(RIGHT(TRIM(${ref}),4))-543,VALUE(MID(${ref},FIND("/",${ref})+1,FIND("/",${ref},FIND("/",${ref})+1)-FIND("/",${ref})-1)),VALUE(LEFT(${ref},FIND("/",${ref})-1))))`;

  const b = toCE(birthdayRef);
  const a = toCE(assessDateRef);

  return `IF(OR(${birthdayRef}="",${birthdayRef}="-",${assessDateRef}=""),"",DATEDIF(${b},${a},"Y")&" ปี "&DATEDIF(${b},${a},"YM")&" เดือน "&DATEDIF(${b},${a},"MD")&" วัน")`;
}

export const ModalExportData = ({
  isOpen,
  onClose,
  data,
  dataType,
}: ExportModalProps) => {
  const [sourceData, setSourceData] = useState<QuestionsData[]>(data);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [dedupMode, setDedupMode] = useState<
    "none" | "profile_day" | "profile"
  >("none");
  const allQuestionsRef = useRef<QuestionsData[]>([]);
  const [filters, setFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    schools: string[];
    ageGroup: "" | "under18" | "18plus";
    result: string[];
  }>({
    dateFrom: "",
    dateTo: "",
    schools: [],
    ageGroup: "",
    result: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [includeAddress, setIncludeAddress] = useState(false);
  const [includeUnreachable, setIncludeUnreachable] = useState(false);
  const [includeContactAttempt, setIncludeContactAttempt] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const rowsPerPage = 10;

  useEffect(() => {
    setSourceData(data);
  }, [data]);

  const applyDedup = useCallback(
    (questions: QuestionsData[], mode: "none" | "profile_day" | "profile") => {
      if (mode === "none") return questions;

      const map = new Map<string, QuestionsData>();

      for (const q of questions) {
        const pid = q.profile?.id;

        if (!pid) continue;
        const key =
          mode === "profile_day"
            ? `${pid}_${new Date(q.createdAt).toISOString().split("T")[0]}`
            : pid;
        const existing = map.get(key);

        if (!existing || new Date(q.createdAt) > new Date(existing.createdAt)) {
          map.set(key, q);
        }
      }

      return Array.from(map.values());
    },
    []
  );

  useEffect(() => {
    const fetchAllQuestionData = async () => {
      if (!isOpen || dataType !== "question") return;

      try {
        const firstRes = await fetch("/api/question?page=1&limit=2000", {
          credentials: "include",
        });

        if (!firstRes.ok) {
          throw new Error("Failed to fetch questions page 1");
        }

        const firstJson = await firstRes.json();
        const allQuestions: QuestionsData[] = firstJson.questionsList ?? [];
        const totalPages = Number(firstJson.pagination?.totalPages ?? 1);

        if (totalPages > 1) {
          for (let page = 2; page <= totalPages; page++) {
            const res = await fetch(`/api/question?page=${page}&limit=2000`, {
              credentials: "include",
            });

            if (!res.ok) {
              throw new Error(`Failed to fetch questions page ${page}`);
            }

            const json = await res.json();

            allQuestions.push(...(json.questionsList ?? []));
          }
        }

        allQuestionsRef.current = allQuestions;
        setSourceData(applyDedup(allQuestions, dedupMode));
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description:
            "ไม่สามารถดึงข้อมูลทั้งหมดได้ ใช้ข้อมูลหน้าปัจจุบันแทน: " + error,
          color: "warning",
        });
      }
    };

    fetchAllQuestionData();
  }, [isOpen, dataType]);

  useEffect(() => {
    if (allQuestionsRef.current.length > 0) {
      setSourceData(applyDedup(allQuestionsRef.current, dedupMode));
      setCurrentPage(1);
    }
  }, [dedupMode, applyDedup]);

  // กำหนดฟิลด์ที่สามารถ export ได้สำหรับข้อมูลแบบประเมิน
  const getAvailableFields = (): ExportField[] => {
    return [
      { key: "id", label: "ลำดับ", selected: true },
      { key: "province", label: "จังหวัด", selected: true },
      { key: "hospitalCode", label: "รหัสหน่วยบริการ", selected: true },
      { key: "hospitalName", label: "ชื่อหน่วยบริการ", selected: true },
      { key: "name", label: "ชื่อ-สกุล ผู้รับบริการ", selected: true },
      { key: "citizenId", label: "เลขบัตรประชาชน", selected: true },
      { key: "birthday", label: "วันเกิด", selected: true },
      { key: "currentAge", label: "อายุปัจจุบัน", selected: true },
      {
        key: "assessmentRoundDate1",
        label: "วันที่ประเมินครั้งที่ 1",
        selected: true,
      },
      {
        key: "ageAtAssessment1",
        label: "อายุ ณ วันที่ประเมินครั้งที่ 1",
        selected: true,
      },
      {
        key: "assessmentRoundDate2",
        label: "วันที่ประเมินครั้งที่ 2",
        selected: true,
      },
      {
        key: "ageAtAssessment2",
        label: "อายุ ณ วันที่ประเมินครั้งที่ 2",
        selected: true,
      },
      { key: "sex", label: "เพศ", selected: true },
      { key: "addrHouseNo", label: "บ้านเลขที่ (ที่อยู่)", selected: true },
      { key: "addrVillageNo", label: "หมู่ (ที่อยู่)", selected: true },
      { key: "addrSubdistrict", label: "แขวง/ตำบล (ที่อยู่)", selected: true },
      { key: "addrDistrict", label: "เขต/อำเภอ (ที่อยู่)", selected: true },
      { key: "addrProvince", label: "จังหวัด (ที่อยู่)", selected: true },
      { key: "insurance", label: "สิทธิ์การรักษา", selected: true },
      { key: "school", label: "โรงเรียน", selected: true },
      { key: "grade", label: "ระดับชั้น", selected: true },
      { key: "district", label: "เขต", selected: true },
      {
        key: "serviceDate",
        label: "วันที่เข้ารับบริการคัดกรอง",
        selected: true,
      },
      { key: "phqa", label: "ผล 9Q/PHQ-A", selected: true },
      { key: "q2Result", label: "ผล Q2", selected: true },
      { key: "q8Result", label: "ผล Q8", selected: true },
      {
        key: "assessmentDate",
        label: "วันที่พบนักจิตวิทยา (รอบที่ 1)",
        selected: true,
      },
      {
        key: "visitDate2",
        label: "วันที่พบนักจิตวิทยา (รอบที่ 2)",
        selected: true,
      },
      {
        key: "visitDate3",
        label: "วันที่พบนักจิตวิทยา (รอบที่ 3)",
        selected: true,
      },
      {
        key: "unreachable1",
        label: "ติดต่อไม่ได้ (รอบที่ 1)",
        selected: true,
      },
      {
        key: "unreachable2",
        label: "ติดต่อไม่ได้ (รอบที่ 2)",
        selected: true,
      },
      {
        key: "unreachable3",
        label: "ติดต่อไม่ได้ (รอบที่ 3)",
        selected: true,
      },
      {
        key: "contactAttemptDate1",
        label: "วันที่พยายามติดต่อ (รอบที่ 1)",
        selected: true,
      },
      {
        key: "contactAttemptDate2",
        label: "วันที่พยายามติดต่อ (รอบที่ 2)",
        selected: true,
      },
      {
        key: "contactAttemptDate3",
        label: "วันที่พยายามติดต่อ (รอบที่ 3)",
        selected: true,
      },
      {
        key: "nextContactDate1",
        label: "นัดติดต่อครั้งถัดไป (รอบที่ 1)",
        selected: true,
      },
      {
        key: "nextContactDate2",
        label: "นัดติดต่อครั้งถัดไป (รอบที่ 2)",
        selected: true,
      },
      {
        key: "nextContactDate3",
        label: "นัดติดต่อครั้งถัดไป (รอบที่ 3)",
        selected: true,
      },
      {
        key: "followUpDate1",
        label: "นัดพบครั้งถัดไป (รอบที่ 1)",
        selected: true,
      },
      {
        key: "followUpDate2",
        label: "นัดพบครั้งถัดไป (รอบที่ 2)",
        selected: true,
      },
      {
        key: "followUpDate3",
        label: "นัดพบครั้งถัดไป (รอบที่ 3)",
        selected: true,
      },
      { key: "status", label: "สถานะแบบประเมิน", selected: true },
      {
        key: "referralUnit",
        label: "หน่วยบริการส่งต่อพบแพทย์",
        selected: true,
      },
      {
        key: "referentId",
        label: "รหัส อสท.",
        selected: true,
      },
      {
        key: "consultName",
        label: "นักจิตวิทยา (รอบที่ 1)",
        selected: true,
      },
      {
        key: "consultName2",
        label: "นักจิตวิทยา (รอบที่ 2)",
        selected: true,
      },
      {
        key: "consultName3",
        label: "นักจิตวิทยา (รอบที่ 3)",
        selected: true,
      },
      {
        key: "closeCaseReason",
        label: "เหตุผลปิดเคส",
        selected: true,
      },
      {
        key: "studentPhone",
        label: "เบอร์โทรนักเรียน",
        selected: true,
      },
      {
        key: "emergencyContact",
        label: "ข้อมูลผู้ติดต่อฉุกเฉิน",
        selected: true,
      },
    ];
  };

  const availableFields = useMemo(() => getAvailableFields(), [dataType]);

  const exportFields = useMemo(
    () =>
      selectedFields.filter((key) => {
        if (
          !includeAddress &&
          ADDRESS_FIELD_KEYS.includes(
            key as (typeof ADDRESS_FIELD_KEYS)[number]
          )
        ) {
          return false;
        }

        if (
          !includeUnreachable &&
          UNREACHABLE_FIELD_KEYS.includes(
            key as (typeof UNREACHABLE_FIELD_KEYS)[number]
          )
        ) {
          return false;
        }

        if (
          !includeContactAttempt &&
          CONTACT_ATTEMPT_FIELD_KEYS.includes(
            key as (typeof CONTACT_ATTEMPT_FIELD_KEYS)[number]
          )
        ) {
          return false;
        }

        return true;
      }),
    [selectedFields, includeAddress, includeUnreachable, includeContactAttempt]
  );

  // ตั้งค่าเริ่มต้นสำหรับ selectedFields ทันทีเมื่อ availableFields มีข้อมูล
  useEffect(() => {
    if (availableFields.length > 0 && selectedFields.length === 0) {
      const allFields = availableFields.map((field) => field.key);

      setSelectedFields(allFields);
    }
  }, [availableFields, selectedFields.length]);

  // ดึงข้อมูลโรงเรียนด้วย SWR
  const { data: schools, isLoading: schoolsLoading } = useSWR(
    "/api/data/school",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch schools");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโรงเรียนได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // ดึงข้อมูลเขตด้วย SWR
  const { data: districts, isLoading: districtsLoading } = useSWR(
    "/api/data/districts",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch districts");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลเขตได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // ดึงข้อมูลจังหวัดด้วย SWR
  const { data: provinces, isLoading: provincesLoading } = useSWR(
    "/api/data/provinces",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch provinces");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลจังหวัดได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // ดึงข้อมูลแขวง/ตำบลด้วย SWR
  const { data: subdistricts, isLoading: subdistrictsLoading } = useSWR(
    "/api/data/subdistricts",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch subdistricts");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลแขวง/ตำบลได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // ดึงข้อมูล profile_admin ด้วย SWR
  const { data: profileAdmins, isLoading: profileAdminsLoading } = useSWR(
    "/api/profile/admin",
    async (url) => {
      try {
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch profile admins");

        return response.json();
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูล profile admin ได้: " + error,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // ฟังก์ชันสำหรับหาชื่อเขตจากรหัสเขต
  const getDistrictName = useCallback(
    (districtId: number): string => {
      if (!districts || districtsLoading) {
        return `เขต ${districtId}`;
      }

      const district = districts.find(
        (d: { id: number; nameInThai?: string }) => d.id === districtId
      );

      return district ? district.nameInThai : `เขต ${districtId}`;
    },
    [districts, districtsLoading]
  );

  // ฟังก์ชันสำหรับหาชื่อจังหวัดจากรหัสจังหวัด
  const getProvinceName = useCallback(
    (provinceId: number): string => {
      if (!provinces || provincesLoading) return `จังหวัด ${provinceId}`;
      const province = provinces.find(
        (p: { id: number; nameInThai?: string }) => p.id === provinceId
      );

      return province ? province.nameInThai : `จังหวัด ${provinceId}`;
    },
    [provinces, provincesLoading]
  );

  // ฟังก์ชันสำหรับหาชื่อแขวง/ตำบลจากรหัส
  const getSubdistrictName = useCallback(
    (subdistrictId: number): string => {
      if (!subdistricts || subdistrictsLoading) return `ตำบล ${subdistrictId}`;
      const subdistrict = subdistricts.find(
        (s: { id: number; nameInThai?: string }) => s.id === subdistrictId
      );

      return subdistrict ? subdistrict.nameInThai : `ตำบล ${subdistrictId}`;
    },
    [subdistricts, subdistrictsLoading]
  );

  // ฟังก์ชันสำหรับหาชื่อนักจิตวิทยาจาก profile_admin
  const getConsultName = useCallback(
    (consultId: string): string => {
      if (!profileAdmins || profileAdminsLoading) {
        return `${consultId}`;
      }

      const profileAdmin = profileAdmins.find(
        (p: {
          userId: string;
          prefixId?: number;
          firstname?: string;
          lastname?: string;
        }) => p.userId === consultId
      );

      if (profileAdmin) {
        const prefixLabel =
          prefix.find((p) => p.key === profileAdmin.prefixId?.toString())
            ?.label || "";

        return `${prefixLabel} ${profileAdmin.firstname || ""} ${profileAdmin.lastname || ""}`.trim();
      }

      return `${consultId}`;
    },
    [profileAdmins, profileAdminsLoading]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setCurrentPage(1);
    },
    []
  );

  // ฟังก์ชันสำหรับ filter ข้อมูล
  const getFilteredData = useCallback(() => {
    let filteredData = [...sourceData];

    if (filters.dateFrom && filters.dateTo) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        const itemDateStr = new Date(item.createdAt)
          .toISOString()
          .split("T")[0];

        return itemDateStr >= filters.dateFrom && itemDateStr <= filters.dateTo;
      });
    }

    if (filters.schools.length > 0) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        const school = item.profile?.school;
        const schoolId =
          typeof school === "object" && school !== null
            ? school.id?.toString()
            : undefined;

        if (filters.schools.includes("__none__") && !schoolId) return true;

        return !!schoolId && filters.schools.includes(schoolId);
      });
    }

    if (filters.ageGroup) {
      filteredData = filteredData.filter((item: QuestionsData) => {
        if (!item.profile?.birthday) return false;

        const age = calculateAge(item.profile.birthday, item.createdAt);

        return filters.ageGroup === "under18" ? age < 18 : age >= 18;
      });
    }

    if (filters.result.length > 0) {
      filteredData = filteredData.filter((item: QuestionsData) =>
        filters.result.includes(item.result)
      );
    }

    return filteredData;
  }, [sourceData, filters]);

  const formatDateOrDash = (value: Date | string | null | undefined) =>
    value != null ? formatThaiDate(value) : "-";

  const formatDateTimeOrDash = (value: Date | string | null | undefined) =>
    value != null ? formatThaiDateTimeAtThailand(value) : "-";

  const getFieldValue = (
    item: QuestionsData,
    field: string
  ): string | number => {
    switch (field) {
      case "id": {
        const filteredData = getFilteredData();
        const itemIndex = filteredData.findIndex(
          (dataItem: QuestionsData) => dataItem.id === item.id
        );

        return itemIndex !== -1 ? itemIndex + 1 : "-";
      }
      case "province":
        return "กรุงเทพมหานคร";
      case "hospitalCode":
        return "141641";
      case "hospitalName":
        return "โรงพยาบาลราชพิพัฒน์";
      case "name":
        const prefixLabel =
          prefix.find((p) => p.key === item.profile?.prefixId?.toString())
            ?.label || "";

        return `${prefixLabel} ${item.profile?.firstname || ""} ${item.profile?.lastname || ""}`;
      case "citizenId":
        return item.profile?.citizenId;
      case "birthday": {
        if (!item.profile?.birthday) return "-";
        const isoDate = new Date(item.profile.birthday)
          .toISOString()
          .split("T")[0];

        return formatDateForDisplay(`${isoDate}T12:00:00`) || "-";
      }
      case "currentAge":
        return item.profile?.birthday
          ? formatAgeYMD(item.profile.birthday)
          : "-";
      case "assessmentRoundDate1": {
        const { screenings, legacy } = getSchoolScreenings(
          item.profile?.school
        );
        const date = getScreeningStartByRound(screenings, 1, legacy);

        return formatExportDate(date);
      }
      case "assessmentRoundDate2": {
        const { screenings, legacy } = getSchoolScreenings(
          item.profile?.school
        );
        const date = getScreeningStartByRound(screenings, 2, legacy);

        return formatExportDate(date);
      }
      case "ageAtAssessment1":
      case "ageAtAssessment2":
        // คำนวณด้วยสูตร Excel ตอน export
        return "";
      case "sex": {
        const sex = String(item.profile?.sex ?? "");

        return sex === "1" ? "ชาย" : sex === "2" ? "หญิง" : "-";
      }
      case "insurance":
        return "";
      case "school": {
        const school = item.profile?.school;

        return typeof school === "object" && school !== null
          ? school.name || "-"
          : typeof school === "string"
            ? school
            : "-";
      }
      case "grade":
        if (
          item.profile?.gradeYear == null ||
          Number.isNaN(Number(item.profile.gradeYear))
        ) {
          return "-";
        }

        return (
          gradeYearLevels.find((level) => level.key === item.profile.gradeYear)
            ?.label || "-"
        );
      case "district":
        if (item.profile?.school) {
          const profileSchool = item.profile.school;

          if (
            typeof profileSchool !== "object" ||
            profileSchool === null ||
            !("id" in profileSchool)
          ) {
            return "-";
          }
          if (districtsLoading) {
            return "-";
          }
          const school = schools?.find(
            (s: { id: number; districtId?: number }) =>
              s.id === profileSchool.id
          );

          if (school && school.districtId) {
            return getDistrictName(school.districtId);
          }

          const schoolWithDistrict = profileSchool as { districtId?: number };

          return schoolWithDistrict.districtId != null
            ? `เขต ${schoolWithDistrict.districtId}`
            : "-";
        }

        return "-";
      case "serviceDate": {
        return item.createdAt ? formatThaiDate(item.createdAt) : "-";
      }
      case "phqa":
        return item.result_text || "-";
      case "q2Result": {
        if (Array.isArray(item.q2) && item.q2.length > 0) {
          const q2Data = item.q2[0];
          const hasRisk = q2Data.q1 === 1 || q2Data.q2 === 1;

          return hasRisk ? "พบความเสี่ยง" : "ไม่พบความเสี่ยง";
        }

        return "-";
      }
      case "q8Result": {
        if (Array.isArray(item.q8) && item.q8.length > 0) {
          const q8Score = Number(item.q8[0].sum ?? 0);

          return q8Score > 0 ? "พบความเสี่ยง" : "ไม่พบความเสี่ยง";
        }

        return "-";
      }
      case "assessmentDate":
        return isRoundUnreachable(item, 0)
          ? "-"
          : formatDateTimeOrDash(item.schedule_telemed);
      case "visitDate2":
        return isRoundUnreachable(item, 1)
          ? "-"
          : formatDateTimeOrDash(item.schedule_telemed2);
      case "visitDate3":
        return isRoundUnreachable(item, 2)
          ? "-"
          : formatDateTimeOrDash(item.schedule_telemed3);
      case "unreachable1":
        return isRoundUnreachable(item, 0) ? "ใช่" : "ไม่ใช่";
      case "unreachable2":
        return isRoundUnreachable(item, 1) ? "ใช่" : "ไม่ใช่";
      case "unreachable3":
        return isRoundUnreachable(item, 2) ? "ใช่" : "ไม่ใช่";
      case "contactAttemptDate1":
        return isRoundUnreachable(item, 0)
          ? formatDateTimeOrDash(item.schedule_telemed)
          : "-";
      case "contactAttemptDate2":
        return isRoundUnreachable(item, 1)
          ? formatDateTimeOrDash(item.schedule_telemed2)
          : "-";
      case "contactAttemptDate3":
        return isRoundUnreachable(item, 2)
          ? formatDateTimeOrDash(item.schedule_telemed3)
          : "-";
      case "nextContactDate1":
        return isRoundUnreachable(item, 0)
          ? formatDateOrDash(item.follow_up)
          : "-";
      case "nextContactDate2":
        return isRoundUnreachable(item, 1)
          ? formatDateOrDash(item.follow_up2)
          : "-";
      case "nextContactDate3":
        return isRoundUnreachable(item, 2)
          ? formatDateOrDash(item.follow_up3)
          : "-";
      case "followUpDate1":
        return isRoundUnreachable(item, 0)
          ? "-"
          : formatDateOrDash(item.follow_up);
      case "followUpDate2":
        return isRoundUnreachable(item, 1)
          ? "-"
          : formatDateOrDash(item.follow_up2);
      case "followUpDate3":
        return isRoundUnreachable(item, 2)
          ? "-"
          : formatDateOrDash(item.follow_up3);
      case "status": {
        const status = item.status ?? calculateQuestionStatus(item);

        return questionStatusOptions[status]?.name ?? "-";
      }
      case "referralUnit":
        return (item as Record<string, unknown>).referralUnit != null
          ? String((item as Record<string, unknown>).referralUnit)
          : "-";
      case "referentId":
        if (item.referentId) {
          // แปลงเป็น string และเติม 0 ข้างหน้าให้เป็น 3 หลัก
          return item.referentId.toString().padStart(3, "0");
        }

        return "-";
      case "consultName":
        return item.consult ? getConsultName(item.consult) : "-";
      case "consultName2":
        return item.consult2 ? getConsultName(item.consult2) : "-";
      case "consultName3":
        return item.consult3 ? getConsultName(item.consult3) : "-";
      case "closeCaseReason":
        return item.close_case_reason?.trim() || "-";
      case "studentPhone":
        return item.profile?.tel || "-";
      case "emergencyContact":
        const emergency = item.profile?.emergency?.[0];

        if (emergency) {
          const name = emergency.name || "";
          const relation = emergency.relation || "";
          const tel = emergency.tel || "";

          return (
            `${name} - ${relation ? `${relation}` : ""} - ${tel ? `${tel}` : ""}`.trim() ||
            "-"
          );
        }

        return "-";
      case "addrHouseNo":
        return item.profile?.address?.[0]?.houseNo || "-";
      case "addrVillageNo":
        return item.profile?.address?.[0]?.villageNo || "-";
      case "addrSubdistrict": {
        const sub = item.profile?.address?.[0]?.subdistrict;

        return sub ? getSubdistrictName(sub) : "-";
      }
      case "addrDistrict": {
        const addrDist = item.profile?.address?.[0]?.district;

        return addrDist ? getDistrictName(addrDist) : "-";
      }
      case "addrProvince": {
        const addrProv = item.profile?.address?.[0]?.province;

        return addrProv ? getProvinceName(addrProv) : "-";
      }
      default:
        return (item as Record<string, unknown>)[field] != null
          ? String((item as Record<string, unknown>)[field])
          : "-";
    }
  };

  const handleClose = useCallback(() => {
    // Clear ข้อมูลทั้งหมด
    setSelectedFields([]);
    setIncludeAddress(false);
    setIncludeUnreachable(false);
    setIncludeContactAttempt(false);
    setIsFilterOpen(true);
    setFilters({
      dateFrom: "",
      dateTo: "",
      schools: [],
      ageGroup: "",
      result: [],
    });
    setCurrentPage(1);

    // เรียก onClose จาก props
    onClose();
  }, [onClose]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // ใช้ข้อมูลที่กรองแล้ว
      const filteredExportData = getFilteredData();

      if (filteredExportData.length === 0) {
        addToast({
          title: "ไม่พบข้อมูล",
          description: "ไม่มีข้อมูลสำหรับ export",
          color: "warning",
        });

        return;
      }

      // แสดง toast เริ่มต้น export
      addToast({
        title: "เริ่มต้น Export",
        description: `กำลังประมวลผลข้อมูล ${filteredExportData.length} รายการ...`,
        color: "primary",
      });

      // จำลองการประมวลผลแบบ batch เพื่อไม่ให้ UI freeze
      const batchSize = 100;
      const totalBatches = Math.ceil(filteredExportData.length / batchSize);
      let processedData: Record<string, string | number>[] = [];

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, filteredExportData.length);
        const batch = filteredExportData.slice(start, end);

        const processedBatch = batch.map((item: QuestionsData) => {
          const row: Record<string, string | number> = {};

          exportFields.forEach((field) => {
            const fieldLabel =
              availableFields.find((f) => f.key === field)?.label || field;

            row[fieldLabel] = getFieldValue(item, field);
          });

          return row;
        });

        processedData.push(...processedBatch);

        // อัปเดต progress
        const progress = Math.round(((i + 1) / totalBatches) * 100);

        setExportProgress(progress);

        // ให้ UI มีโอกาสอัปเดต
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // สร้าง Excel file
      setExportProgress(90);

      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedData);

      const headers = exportFields.map(
        (field) => availableFields.find((f) => f.key === field)?.label || field
      );

      ws["!cols"] = headers.map((label) => ({
        wch: Math.max(label.length + 4, 18),
      }));

      // ใส่สูตร Excel คำนวณอายุ ณ วันที่ประเมินครั้งที่ 1, 2
      const birthdayIdx = exportFields.indexOf("birthday");
      const assess1Idx = exportFields.indexOf("assessmentRoundDate1");
      const assess2Idx = exportFields.indexOf("assessmentRoundDate2");
      const age1Idx = exportFields.indexOf("ageAtAssessment1");
      const age2Idx = exportFields.indexOf("ageAtAssessment2");
      const dataRowCount = processedData.length;

      for (let r = 0; r < dataRowCount; r++) {
        const excelRow = r + 2; // แถว 1 = header

        if (age1Idx >= 0 && birthdayIdx >= 0 && assess1Idx >= 0) {
          const cellAddr = `${excelColLetter(age1Idx)}${excelRow}`;

          ws[cellAddr] = {
            t: "s",
            f: buildAgeAtDateExcelFormula(
              `${excelColLetter(birthdayIdx)}${excelRow}`,
              `${excelColLetter(assess1Idx)}${excelRow}`
            ),
          };
        }

        if (age2Idx >= 0 && birthdayIdx >= 0 && assess2Idx >= 0) {
          const cellAddr = `${excelColLetter(age2Idx)}${excelRow}`;

          ws[cellAddr] = {
            t: "s",
            f: buildAgeAtDateExcelFormula(
              `${excelColLetter(birthdayIdx)}${excelRow}`,
              `${excelColLetter(assess2Idx)}${excelRow}`
            ),
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, `${dataType}_data`);

      setExportProgress(95);

      const fileName = `${dataType}_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      XLSX.writeFile(wb, fileName);

      setExportProgress(100);

      // แสดง toast สำเร็จ
      addToast({
        title: "Export สำเร็จ",
        description: `ส่งออกข้อมูล ${processedData.length} รายการเรียบร้อยแล้ว`,
        color: "success",
      });

      // ปิด modal หลังจาก delay เล็กน้อย
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถ export ข้อมูลได้: " + error,
        color: "danger",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  }, [
    exportFields,
    filters,
    availableFields,
    handleClose,
    getFilteredData,
    isExporting,
  ]);

  const RESULT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    under18: [
      { value: "Green", label: "ไม่พบความเสี่ยง" },
      { value: "Green-Low", label: "พบความเสี่ยงเล็กน้อย" },
      { value: "Yellow", label: "พบความเสี่ยงปานกลาง" },
      { value: "Orange", label: "พบความเสี่ยงมาก" },
      { value: "Red", label: "พบความเสี่ยงรุนแรง" },
    ],
    "18plus": [
      { value: "Green", label: "ไม่มีอาการ / น้อยมาก" },
      { value: "Yellow", label: "ระดับน้อย" },
      { value: "Orange", label: "ระดับปานกลาง" },
      { value: "Red", label: "ระดับรุนแรง" },
    ],
    all: [
      { value: "Green", label: "เขียว — ปกติ" },
      { value: "Green-Low", label: "เขียวอ่อน — เล็กน้อย (PHQ-A)" },
      { value: "Yellow", label: "เหลือง — ปานกลาง" },
      { value: "Orange", label: "ส้ม — มาก" },
      { value: "Red", label: "แดง — รุนแรง" },
    ],
  };

  const resultOptions = useMemo(
    () => RESULT_OPTIONS[filters.ageGroup || "all"],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.ageGroup]
  );

  const filteredData = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.dateFrom ||
          filters.dateTo ||
          filters.schools.length > 0 ||
          filters.ageGroup ||
          filters.result.length > 0
      ),
    [filters]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      schools: [],
      ageGroup: "",
      result: [],
    });
    setSchoolSearch("");
    setCurrentPage(1);
  }, []);

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      classNames={{
        base: "h-[95vh] max-w-[95vw]",
        body: "h-[calc(95vh-180px)] overflow-hidden",
      }}
      isOpen={isOpen}
      placement="center"
      size="5xl"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-lg font-semibold">Export ข้อมูล</h3>
        </ModalHeader>
        <ModalBody className="h-full overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Filter Options */}
            <Card className="shrink-0 border border-default-200 shadow-sm">
              <CardBody className="gap-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    className="flex items-center gap-2 text-left"
                    type="button"
                    onClick={() => setIsFilterOpen((open) => !open)}
                  >
                    <ChevronDownIcon
                      className={`size-4 shrink-0 text-default-500 transition-transform ${
                        isFilterOpen ? "rotate-0" : "-rotate-90"
                      }`}
                    />
                    <div>
                      <h4 className="font-medium leading-tight">
                        ตัวกรองข้อมูล
                      </h4>
                      <p className="text-tiny text-default-500">
                        พบ {filteredData.length.toLocaleString()} รายการ
                        {includeAddress ||
                        includeUnreachable ||
                        includeContactAttempt
                          ? " · ปรับคอลัมน์แล้ว"
                          : ""}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <Switch
                      classNames={{
                        base: "max-w-fit items-center",
                        label: "text-small whitespace-nowrap pl-1",
                      }}
                      isSelected={includeAddress}
                      size="sm"
                      onValueChange={setIncludeAddress}
                    >
                      ที่อยู่
                    </Switch>
                    <Switch
                      classNames={{
                        base: "max-w-fit items-center",
                        label: "text-small whitespace-nowrap pl-1",
                      }}
                      isSelected={includeUnreachable}
                      size="sm"
                      onValueChange={setIncludeUnreachable}
                    >
                      ติดต่อไม่ได้
                    </Switch>
                    <Switch
                      classNames={{
                        base: "max-w-fit items-center",
                        label: "text-small whitespace-nowrap pl-1",
                      }}
                      isSelected={includeContactAttempt}
                      size="sm"
                      onValueChange={setIncludeContactAttempt}
                    >
                      วันที่พยายามติดต่อ
                    </Switch>
                    {hasActiveFilters && (
                      <Button
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={clearFilters}
                      >
                        ล้างตัวกรอง
                      </Button>
                    )}
                  </div>
                </div>

                {isFilterOpen && (
                  <>
                    <Divider />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <DateRangePicker
                        className="xl:col-span-1"
                        label="ช่วงวันที่"
                        labelPlacement="outside"
                        size="sm"
                        value={
                          filters.dateFrom && filters.dateTo
                            ? {
                                start: parseDate(filters.dateFrom),
                                end: parseDate(filters.dateTo),
                              }
                            : null
                        }
                        onChange={(range) => {
                          if (!range) {
                            handleFilterChange("dateFrom", "");
                            handleFilterChange("dateTo", "");

                            return;
                          }

                          handleFilterChange(
                            "dateFrom",
                            range.start ? range.start.toString() : ""
                          );
                          handleFilterChange(
                            "dateTo",
                            range.end ? range.end.toString() : ""
                          );
                        }}
                      />

                      <Select
                        label="ช่วงอายุ"
                        labelPlacement="outside"
                        placeholder="ทุกช่วงอายุ"
                        selectedKeys={
                          filters.ageGroup ? [filters.ageGroup] : []
                        }
                        size="sm"
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as
                            | ""
                            | "under18"
                            | "18plus"
                            | undefined;

                          setFilters((prev) => ({
                            ...prev,
                            ageGroup: selectedKey || "",
                            result: [],
                          }));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectItem key="under18">
                          น้อยกว่า 18 ปี (PHQ-A)
                        </SelectItem>
                        <SelectItem key="18plus">18 ปีขึ้นไป (9Q)</SelectItem>
                      </Select>

                      <Select
                        label="การตัดข้อมูลซ้ำ"
                        labelPlacement="outside"
                        selectedKeys={[dedupMode]}
                        size="sm"
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as
                            | "none"
                            | "profile_day"
                            | "profile";

                          if (val) setDedupMode(val);
                        }}
                      >
                        <SelectItem key="none">
                          ไม่กรองข้อมูลซ้ำ (แสดงทุกรายการ)
                        </SelectItem>
                        <SelectItem key="profile_day">
                          1 รายการต่อคนต่อวัน (ล่าสุดในแต่ละวัน)
                        </SelectItem>
                        <SelectItem key="profile">
                          แสดงเฉพาะครั้งล่าสุดต่อคน
                        </SelectItem>
                      </Select>

                      <div className="flex flex-col gap-1">
                        <span className="text-tiny text-foreground">
                          โรงเรียน
                        </span>
                        <Popover placement="bottom-start">
                          <PopoverTrigger>
                            <Button
                              className="h-8 w-full justify-between font-normal"
                              endContent={
                                <ChevronDownIcon className="size-4 shrink-0 text-default-400" />
                              }
                              size="sm"
                              variant="bordered"
                            >
                              <span className="truncate text-left text-small text-default-500">
                                {filters.schools.length > 0
                                  ? `เลือก ${filters.schools.length} โรงเรียน`
                                  : "ทุกโรงเรียน"}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-0">
                            <div className="flex flex-col">
                              <div className="border-b border-divider px-3 py-2">
                                <input
                                  className="w-full rounded border border-divider px-2 py-1 text-small outline-none focus:border-primary"
                                  placeholder="ค้นหาโรงเรียน..."
                                  type="text"
                                  value={schoolSearch}
                                  onChange={(e) =>
                                    setSchoolSearch(e.target.value)
                                  }
                                />
                              </div>
                              {filters.schools.length > 0 && (
                                <div className="flex justify-end border-b border-divider px-3 py-1">
                                  <button
                                    className="text-xs text-danger hover:underline"
                                    type="button"
                                    onClick={() =>
                                      handleFilterChange("schools", [])
                                    }
                                  >
                                    ล้าง ({filters.schools.length})
                                  </button>
                                </div>
                              )}
                              <ul
                                aria-multiselectable="true"
                                className="max-h-60 overflow-y-auto py-1"
                                role="listbox"
                              >
                                {!schoolSearch && (
                                  <li
                                    aria-selected={filters.schools.includes(
                                      "__none__"
                                    )}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-default-100"
                                    role="option"
                                    onClick={() => {
                                      const current = filters.schools;
                                      const next = current.includes("__none__")
                                        ? current.filter(
                                            (s) => s !== "__none__"
                                          )
                                        : [...current, "__none__"];

                                      handleFilterChange("schools", next);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        const current = filters.schools;
                                        const next = current.includes(
                                          "__none__"
                                        )
                                          ? current.filter(
                                              (s) => s !== "__none__"
                                            )
                                          : [...current, "__none__"];

                                        handleFilterChange("schools", next);
                                      }
                                    }}
                                  >
                                    <input
                                      readOnly
                                      checked={filters.schools.includes(
                                        "__none__"
                                      )}
                                      className="accent-primary"
                                      type="checkbox"
                                    />
                                    <span className="text-small">ไม่ระบุ</span>
                                  </li>
                                )}
                                {schools
                                  ?.filter((s: { id: number; name: string }) =>
                                    s.name
                                      .toLowerCase()
                                      .includes(schoolSearch.toLowerCase())
                                  )
                                  .map(
                                    (school: { id: number; name: string }) => {
                                      const key = school.id.toString();

                                      return (
                                        <li
                                          key={school.id}
                                          aria-selected={filters.schools.includes(
                                            key
                                          )}
                                          className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-default-100"
                                          role="option"
                                          onClick={() => {
                                            const current = filters.schools;
                                            const next = current.includes(key)
                                              ? current.filter((s) => s !== key)
                                              : [...current, key];

                                            handleFilterChange("schools", next);
                                          }}
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" ||
                                              e.key === " "
                                            ) {
                                              const current = filters.schools;
                                              const next = current.includes(key)
                                                ? current.filter(
                                                    (s) => s !== key
                                                  )
                                                : [...current, key];

                                              handleFilterChange(
                                                "schools",
                                                next
                                              );
                                            }
                                          }}
                                        >
                                          <input
                                            readOnly
                                            checked={filters.schools.includes(
                                              key
                                            )}
                                            className="accent-primary"
                                            type="checkbox"
                                          />
                                          <span className="text-small">
                                            {school.name}
                                          </span>
                                        </li>
                                      );
                                    }
                                  )}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Select
                        label="ระดับผลการประเมิน"
                        labelPlacement="outside"
                        placeholder="ทุกระดับ"
                        selectedKeys={new Set(filters.result)}
                        selectionMode="multiple"
                        size="sm"
                        onSelectionChange={(keys) => {
                          handleFilterChange(
                            "result",
                            Array.from(keys) as string[]
                          );
                        }}
                      >
                        {resultOptions.map((opt) => (
                          <SelectItem key={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>

                    {filters.schools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {filters.schools.includes("__none__") && (
                          <Chip
                            size="sm"
                            variant="flat"
                            onClose={() =>
                              handleFilterChange(
                                "schools",
                                filters.schools.filter((s) => s !== "__none__")
                              )
                            }
                          >
                            ไม่ระบุ
                          </Chip>
                        )}
                        {filters.schools
                          .filter((s) => s !== "__none__")
                          .map((key) => {
                            const school = schools?.find(
                              (s: { id: number; name: string }) =>
                                s.id.toString() === key
                            );

                            return (
                              <Chip
                                key={key}
                                size="sm"
                                variant="flat"
                                onClose={() =>
                                  handleFilterChange(
                                    "schools",
                                    filters.schools.filter((s) => s !== key)
                                  )
                                }
                              >
                                {school?.name ?? key}
                              </Chip>
                            );
                          })}
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>

            {/* ตัวอย่างตาราง */}
            <Card className="min-h-0 flex-1">
              <CardBody className="flex h-full min-h-0 flex-col gap-2 py-3">
                <div className="flex shrink-0 items-center justify-between">
                  <h4 className="font-medium">ตัวอย่างข้อมูลที่จะ Export</h4>
                  {filteredData.length > 0 && (
                    <span className="text-sm text-gray-600">
                      แสดง {(currentPage - 1) * rowsPerPage + 1}-
                      {Math.min(currentPage * rowsPerPage, filteredData.length)}{" "}
                      จาก {filteredData.length.toLocaleString()} รายการ
                    </span>
                  )}
                </div>
                <div className="min-h-0 flex-1 overflow-auto rounded-lg border shadow-sm">
                  {exportFields.length > 0 && availableFields.length > 0 ? (
                    schoolsLoading ||
                    districtsLoading ||
                    provincesLoading ||
                    subdistrictsLoading ||
                    profileAdminsLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                          <span>กำลังโหลดข้อมูล...</span>
                        </div>
                      </div>
                    ) : (
                      <Table
                        isStriped
                        aria-label="ตัวอย่างข้อมูลที่จะ Export"
                        className="w-full"
                        selectionMode="none"
                      >
                        <TableHeader>
                          {exportFields.map((field) => {
                            const fieldLabel =
                              availableFields.find((f) => f.key === field)
                                ?.label || field;
                            const numberMatch =
                              fieldLabel.match(/^\((\d+)\)\s*(.+)$/);
                            const label = numberMatch
                              ? numberMatch[2]
                              : fieldLabel;

                            return (
                              <TableColumn key={field} className="text-center">
                                {label}
                              </TableColumn>
                            );
                          })}
                        </TableHeader>
                        <TableBody>
                          {paginatedData.map((item, index) => (
                            <TableRow key={item.id || index}>
                              {exportFields.map((field) => {
                                const value = getFieldValue(item, field);

                                const isLeftAlign = [
                                  "name",
                                  "emergencyContact",
                                  "addrHouseNo",
                                  "addrVillageNo",
                                  "addrSubdistrict",
                                  "addrDistrict",
                                  "addrProvince",
                                ].includes(field);

                                return (
                                  <TableCell
                                    key={field}
                                    className={`${isLeftAlign ? "text-left" : "text-center"} whitespace-nowrap`}
                                  >
                                    <div
                                      className="truncate"
                                      title={
                                        value != null ? String(value) : "-"
                                      }
                                    >
                                      {value != null ? String(value) : "-"}
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {availableFields.length === 0
                        ? "ไม่พบข้อมูลสำหรับประเภทนี้"
                        : "กำลังโหลดข้อมูล..."}
                    </div>
                  )}
                </div>
                {filteredData.length > 0 && (
                  <div className="flex shrink-0 justify-center pt-1">
                    <Pagination
                      isCompact
                      showControls
                      color="primary"
                      page={currentPage}
                      total={totalPages}
                      onChange={setCurrentPage}
                    />
                  </div>
                )}

                {exportFields.length > 0 &&
                  filteredData.length === 0 &&
                  !schoolsLoading && (
                    <div className="text-center py-8 text-gray-500">
                      ไม่มีข้อมูลตัวอย่าง
                    </div>
                  )}
              </CardBody>
            </Card>

            {/* Export Progress */}
            {isExporting && (
              <Card>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">กำลัง Export ข้อมูล...</h4>
                      <span className="text-sm text-gray-600">
                        {exportProgress}%
                      </span>
                    </div>
                    <Progress
                      className="w-full"
                      color="primary"
                      value={exportProgress}
                    />
                    <p className="text-sm text-gray-600">
                      กรุณารอสักครู่ อย่าปิดหน้าต่างนี้
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            isDisabled={isExporting}
            variant="light"
            onPress={handleClose}
          >
            ยกเลิก
          </Button>
          <Button
            color="primary"
            isDisabled={isExporting}
            isLoading={isExporting}
            onPress={handleExport}
          >
            {isExporting ? "กำลัง Export..." : "Export Excel"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
