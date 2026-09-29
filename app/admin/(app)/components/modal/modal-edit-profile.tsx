"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { District, Province, Subdistrict } from "@prisma/client";
import {
  addToast,
  Button,
  Divider,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";

import { BirthdaySelect } from "@/components/birthday-select";
import { mapSexToLegacyNumber } from "@/lib/legacy-value-mapping";
import { normalizeProfileFormFieldName } from "@/lib/profile-form-fields";
import { gradeYearLevels, prefix } from "@/utils/data";
import {
  validateCitizen,
  validateBirthday,
  parseThaiDateToISO,
  calculateThaiYear,
  formatDateForDisplay,
} from "@/utils/helper";

interface EditProfileData {
  hn: string;
  citizenId: string;
  prefixId: string;
  sex: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  thaiYear: string;
  ethnicity: string;
  nationality: string;
  mainInsclCode: string;
  mainInsclName: string;
  subInsclCode: string;
  subInsclName: string;
  hmainCode: string;
  hmainName: string;
  hsubCode: string;
  hsubName: string;
  nhsoVerifiedAt: string;
  address: {
    houseNo: string;
    villageNo: string;
    soi: string;
    road: string;
    subdistrictId: string;
    districtId: string;
    provinceId: string;
  };
  phone: string;
  emergency: {
    name: string;
    phone: string;
    relation: string;
  };
  school: string;
  gradeYear: string;
}

/** ข้อมูลสำหรับ modal แก้ไข profile (จาก user list หรือ question) */
export interface ModalEditProfileData {
  profile?: {
    id: string;
    userId?: string | null;
    citizenId?: string;
    prefixId?: number;
    firstName?: string;
    lastName?: string;
    /** @deprecated alias */
    firstname?: string;
    /** @deprecated alias */
    lastname?: string;
    sex?: string | number;
    birthDate?: string | Date | null;
    birthday?: string | Date | null;
    ethnicity?: string;
    nationality?: string;
    phone?: string;
    hn?: string | null;
    schoolId?: number | null;
    gradeYear?: number | null;
    school?: { id?: number; name?: string } | string | null;
    healthcareFacilityId?: string | null;
    healthcareFacility?: { id?: string; name?: string } | null;
    address?: Array<{
      houseNo?: string;
      villageNo?: string;
      soi?: string;
      road?: string;
      provinceId?: number;
      districtId?: number;
      subdistrictId?: number;
      /** @deprecated */
      province?: number;
      district?: number;
      subdistrict?: number;
    }>;
    emergency?: Array<{
      name?: string;
      phone?: string;
      tel?: string;
      relation?: string;
    }>;
    [key: string]: unknown;
  };
  /** หน่วยงานเจ้าของเคส — แสดงอย่างเดียวเมื่อเปิดจาก case drawer */
  caseHealthcareFacility?: { id?: string; name?: string } | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ModalEditProfileData;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

function resolveHealthcareFacilityName(
  data: ModalEditProfileData | null | undefined
): string {
  const caseName = data?.caseHealthcareFacility?.name;

  if (typeof caseName === "string" && caseName.trim()) {
    return caseName.trim();
  }

  const profileName = data?.profile?.healthcareFacility?.name;

  return typeof profileName === "string" && profileName.trim()
    ? profileName.trim()
    : "";
}

function resolveHealthcareFacilityId(
  profile: ModalEditProfileData["profile"]
): string | null {
  if (
    typeof profile?.healthcareFacilityId === "string" &&
    profile.healthcareFacilityId.trim()
  ) {
    return profile.healthcareFacilityId.trim();
  }

  const nestedId = profile?.healthcareFacility?.id;

  return typeof nestedId === "string" && nestedId.trim()
    ? nestedId.trim()
    : null;
}

export const ModalEditProfile = ({
  isOpen,
  onClose,
  data,
  mode,
  onSuccess,
}: Props) => {
  const [distrince, setDistrince] = useState<District[]>([]);
  const [province, setProvince] = useState<Province[]>([]);
  const [subdistrince, setSubDistrince] = useState<Subdistrict[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [editProfileData, setEditProfileData] = useState<EditProfileData>({
    hn: "",
    citizenId: "",
    prefixId: "",
    sex: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    thaiYear: "",
    ethnicity: "",
    nationality: "",
    mainInsclCode: "",
    mainInsclName: "",
    subInsclCode: "",
    subInsclName: "",
    hmainCode: "",
    hmainName: "",
    hsubCode: "",
    hsubName: "",
    nhsoVerifiedAt: "",
    address: {
      houseNo: "",
      villageNo: "",
      soi: "",
      road: "",
      subdistrictId: "",
      districtId: "",
      provinceId: "",
    },
    phone: "",
    emergency: {
      name: "",
      phone: "",
      relation: "",
    },
    school: "",
    gradeYear: "",
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isHnLoading, setIsHnLoading] = useState(false);
  const [isNhsoLoading, setIsNhsoLoading] = useState(false);
  const [citizenIdError, setCitizenIdError] = useState<string>("");
  const [isCheckingCitizenId, setIsCheckingCitizenId] = useState(false);
  const citizenIdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [birthdayError, setBirthdayError] = useState<string>("");
  const [gradeYearError, setGradeYearError] = useState<string>("");
  const [currentData, setCurrentData] = useState<ModalEditProfileData | null>(
    null
  );

  const fetchData = async <T,>(
    url: string,
    setter: React.Dispatch<React.SetStateAction<T>>
  ) => {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Failed to fetch data from ${url}`);
      }
      const data = await res.json();

      setter(data as T);
    } catch (err) {
      addToast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        color: "danger",
      });
    }
  };

  const GetDistrictList = async () => {
    await fetchData("/api/data/districts", setDistrince);
  };

  const GetProvinceList = async () => {
    await fetchData("/api/data/provinces", setProvince);
  };

  const GetSubdistrictList = async () => {
    await fetchData("/api/data/subdistricts", setSubDistrince);
  };

  const GetSchoolList = async () => {
    await fetchData("/api/data/school", setSchools);
  };

  const handleEditProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };

        return newData;
      });
    } else if (name.startsWith("emergency.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          emergency: {
            ...prev.emergency,
            [field]: value,
          },
        };

        return newData;
      });
    } else {
      let processedValue = value;

      // ตรวจสอบโทรศัพท์ให้รับเฉพาะตัวเลขเท่านั้น
      if (name === "tel" || name === "phone" || name === "emergency.phone") {
        // อนุญาตให้กรอกได้แค่ตัวเลขเท่านั้น
        const onlyNumbers = /^[0-9]*$/;

        if (!onlyNumbers.test(value)) {
          return; // ไม่ทำอะไรถ้าไม่ใช่ตัวเลข
        }
        processedValue = value;
      }

      setEditProfileData((prev) => {
        const field = normalizeProfileFormFieldName(name);
        const newData = {
          ...prev,
          [field]: processedValue,
        };

        return newData;
      });

      // Validate citizenId ทั้งในโหมด create และ edit
      if (name === "citizenId") {
        if (citizenIdTimerRef.current) {
          clearTimeout(citizenIdTimerRef.current);
          citizenIdTimerRef.current = null;
        }
        if (value.length === 13) {
          setIsCheckingCitizenId(true);
          setCitizenIdError("");
          citizenIdTimerRef.current = setTimeout(() => {
            setIsCheckingCitizenId(false);
            validateCitizenIdAsync(value);
          }, 500);
        } else if (value.length > 0) {
          setIsCheckingCitizenId(false);
          setCitizenIdError("เลขบัตรประชาชนต้องมี 13 หลัก");
        } else {
          setIsCheckingCitizenId(false);
          setCitizenIdError("");
        }
      }
    }
  };

  const handleEditProfileSelectChange = (name: string, value: string) => {
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];

      setEditProfileData((prev) => {
        const newData = {
          ...prev,
          address: {
            ...prev.address,
            [field]: value,
          },
        };

        return newData;
      });
    } else {
      setEditProfileData((prev) => {
        const newData: EditProfileData = {
          ...prev,
          [name]: value,
        };

        // เมื่อล้างสถานศึกษา ให้ล้างชั้นปีด้วย
        if (name === "school" && !value) {
          newData.gradeYear = "";
          setGradeYearError("");
        }

        if (name === "gradeYear" && value) {
          setGradeYearError("");
        }

        return newData;
      });
    }
  };

  const handleSearchHn = useCallback(async () => {
    const citizenId = editProfileData.citizenId.trim();

    if (!citizenId || citizenId.length !== 13) {
      addToast({
        title: "ไม่พบเลขบัตรประชาชน",
        description: "กรุณากรอกเลขบัตรประชาชน 13 หลักก่อนค้นหา HN",
        color: "warning",
      });

      return;
    }

    setIsHnLoading(true);
    try {
      const response = await fetch("/api/his/patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardno: citizenId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        hn?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error || "เกิดข้อผิดพลาดในการค้นหา HN");
      }

      const foundHn = payload.hn?.trim();

      if (!foundHn) {
        setEditProfileData((prev) => ({ ...prev, hn: "" }));
        addToast({
          title: "ไม่พบข้อมูล HN",
          description: `ไม่พบข้อมูลผู้ป่วยจากเลขบัตร ${citizenId}`,
          color: "warning",
        });

        return;
      }

      setEditProfileData((prev) => ({ ...prev, hn: foundHn }));
      addToast({
        title: "ค้นหา HN สำเร็จ",
        description: `พบ HN: ${foundHn}`,
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "ค้นหา HN ไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการค้นหา HN",
        color: "danger",
      });
    } finally {
      setIsHnLoading(false);
    }
  }, [editProfileData.citizenId]);

  const clearNhsoFields = useCallback(
    (): Pick<
      EditProfileData,
      | "mainInsclCode"
      | "mainInsclName"
      | "subInsclCode"
      | "subInsclName"
      | "hmainCode"
      | "hmainName"
      | "hsubCode"
      | "hsubName"
      | "nhsoVerifiedAt"
    > => ({
      mainInsclCode: "",
      mainInsclName: "",
      subInsclCode: "",
      subInsclName: "",
      hmainCode: "",
      hmainName: "",
      hsubCode: "",
      hsubName: "",
      nhsoVerifiedAt: "",
    }),
    []
  );

  const handleSearchNhso = useCallback(async () => {
    const citizenId = editProfileData.citizenId.trim();

    if (!citizenId || citizenId.length !== 13) {
      addToast({
        title: "ไม่พบเลขบัตรประชาชน",
        description: "กรุณากรอกเลขบัตรประชาชน 13 หลักก่อนค้นหาสิทธิ",
        color: "warning",
      });

      return;
    }

    setIsNhsoLoading(true);
    try {
      const response = await fetch("/api/profile/nhso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ citizenId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        nhsoResult?: {
          mainInsclCode?: string;
          mainInsclName?: string;
          subInsclCode?: string;
          subInsclName?: string;
          hmainCode?: string;
          hmainName?: string;
          hsubCode?: string;
          hsubName?: string;
          verifiedAt?: string;
        };
      };

      if (!response.ok || !payload.nhsoResult) {
        setEditProfileData((prev) => ({ ...prev, ...clearNhsoFields() }));
        throw new Error(
          payload.error || "เกิดข้อผิดพลาดในการค้นหาสิทธิจาก สปสช."
        );
      }

      const result = payload.nhsoResult;
      const rightsLabel =
        result.mainInsclName?.trim() ||
        result.mainInsclCode?.trim() ||
        "พบข้อมูลสิทธิ";

      setEditProfileData((prev) => ({
        ...prev,
        mainInsclCode: result.mainInsclCode?.trim() || "",
        mainInsclName: result.mainInsclName?.trim() || "",
        subInsclCode: result.subInsclCode?.trim() || "",
        subInsclName: result.subInsclName?.trim() || "",
        hmainCode: result.hmainCode?.trim() || "",
        hmainName: result.hmainName?.trim() || "",
        hsubCode: result.hsubCode?.trim() || "",
        hsubName: result.hsubName?.trim() || "",
        nhsoVerifiedAt: result.verifiedAt
          ? new Date(result.verifiedAt).toISOString()
          : "",
      }));
      addToast({
        title: "ค้นหาสิทธิสำเร็จ",
        description: `พบสิทธิ: ${rightsLabel}`,
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "ค้นหาสิทธิไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการค้นหาสิทธิ",
        color: "danger",
      });
    } finally {
      setIsNhsoLoading(false);
    }
  }, [editProfileData.citizenId, clearNhsoFields]);

  const validateCitizenIdAsync = async (
    citizenId: string
  ): Promise<boolean> => {
    try {
      // ในโหมด edit ให้ส่งข้อมูล user ID ปัจจุบันเพื่อยกเว้นการตรวจสอบซ้ำ
      const currentUserId = mode === "edit" ? data?.profile?.id : null;

      const response = await validateCitizen(citizenId, "user", currentUserId);
      const responseData = await response.json();

      if (responseData.error) {
        setCitizenIdError(responseData.error);

        return false;
      }

      setCitizenIdError("");

      return true;
    } catch (error) {
      setCitizenIdError(
        "เกิดข้อผิดพลาดในการตรวจสอบเลขบัตรประชาชน" +
          (error instanceof Error ? error.message : "ไม่ระบุข้อมูล")
      );

      return false;
    }
  };

  const initializeEditProfileData = () => {
    // รีเซ็ต error message
    setCitizenIdError("");
    setBirthdayError("");

    if (mode === "create") {
      // รีเซ็ตข้อมูลสำหรับการสร้างใหม่
      setEditProfileData({
        hn: "",
        citizenId: "",
        prefixId: "",
        sex: "",
        firstName: "",
        lastName: "",
        birthDate: "",
        thaiYear: "",
        ethnicity: "",
        nationality: "",
        mainInsclCode: "",
        mainInsclName: "",
        subInsclCode: "",
        subInsclName: "",
        hmainCode: "",
        hmainName: "",
        hsubCode: "",
        hsubName: "",
        nhsoVerifiedAt: "",
        address: {
          houseNo: "",
          villageNo: "",
          soi: "",
          road: "",
          subdistrictId: "",
          districtId: "",
          provinceId: "",
        },
        phone: "",
        emergency: {
          name: "",
          phone: "",
          relation: "",
        },
        school: "",
        gradeYear: "",
      });

      return;
    }

    if (data?.profile) {
      const profile = data.profile;
      const addr = profile.address?.[0];
      const provinceIdRaw = addr?.provinceId ?? addr?.province;
      const districtIdRaw = addr?.districtId ?? addr?.district;
      const subdistrictIdRaw = addr?.subdistrictId ?? addr?.subdistrict;

      let birthdayDisplay = "";

      const birthdayRaw = profile.birthDate ?? profile.birthday;

      if (birthdayRaw) {
        try {
          const date =
            birthdayRaw instanceof Date
              ? birthdayRaw
              : new Date(birthdayRaw as string | number);

          if (!isNaN(date.getTime())) {
            const isoDate = [
              date.getFullYear(),
              String(date.getMonth() + 1).padStart(2, "0"),
              String(date.getDate()).padStart(2, "0"),
            ].join("-");

            birthdayDisplay = formatDateForDisplay(isoDate);
          }
        } catch (error) {
          addToast({
            title: "ผิดพลาด",
            description:
              "ไม่สามารถดึงข้อมูลจากระบบ" +
              (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
            color: "danger",
          });
        }
      }

      const thaiYear = birthdayDisplay
        ? calculateThaiYear(parseThaiDateToISO(birthdayDisplay))
        : "";

      const schoolObj = profile.school as { id?: number } | undefined;
      const schoolId =
        schoolObj?.id ??
        (profile as { schoolId?: number | null }).schoolId ??
        null;
      const emergencyFirst = profile.emergency?.[0];
      const sexLegacy =
        profile.sex != null && profile.sex !== ""
          ? mapSexToLegacyNumber(
              profile.sex as string | number | null | undefined
            )
          : null;

      const initialData: EditProfileData = {
        hn: String(profile.hn ?? ""),
        citizenId: String(profile.citizenId ?? ""),
        prefixId: profile.prefixId != null ? String(profile.prefixId) : "",
        sex: sexLegacy != null ? String(sexLegacy) : "",
        firstName: String(profile.firstName ?? profile.firstname ?? ""),
        lastName: String(profile.lastName ?? profile.lastname ?? ""),
        birthDate: birthdayDisplay || "",
        thaiYear: thaiYear,
        ethnicity: String(profile.ethnicity ?? ""),
        nationality: String(profile.nationality ?? ""),
        mainInsclCode: String(
          (profile as { mainInsclCode?: string | null }).mainInsclCode ?? ""
        ),
        mainInsclName: String(
          (profile as { mainInsclName?: string | null }).mainInsclName ?? ""
        ),
        subInsclCode: String(
          (profile as { subInsclCode?: string | null }).subInsclCode ?? ""
        ),
        subInsclName: String(
          (profile as { subInsclName?: string | null }).subInsclName ?? ""
        ),
        hmainCode: String(
          (profile as { hmainCode?: string | null }).hmainCode ?? ""
        ),
        hmainName: String(
          (profile as { hmainName?: string | null }).hmainName ?? ""
        ),
        hsubCode: String(
          (profile as { hsubCode?: string | null }).hsubCode ?? ""
        ),
        hsubName: String(
          (profile as { hsubName?: string | null }).hsubName ?? ""
        ),
        nhsoVerifiedAt: (() => {
          const raw = (profile as { nhsoVerifiedAt?: string | Date | null })
            .nhsoVerifiedAt;

          if (!raw) return "";

          return new Date(raw).toISOString();
        })(),
        address: {
          houseNo: String(addr?.houseNo ?? ""),
          villageNo: String(addr?.villageNo ?? ""),
          soi: String(addr?.soi ?? ""),
          road: String(addr?.road ?? ""),
          // Prefer IDs from profile; geo lists only refine when present
          subdistrictId:
            subdistrictIdRaw != null && String(subdistrictIdRaw) !== ""
              ? String(subdistrictIdRaw)
              : "",
          districtId:
            districtIdRaw != null && String(districtIdRaw) !== ""
              ? String(districtIdRaw)
              : "",
          provinceId:
            provinceIdRaw != null && String(provinceIdRaw) !== ""
              ? String(provinceIdRaw)
              : "",
        },
        phone: String(profile.phone ?? ""),
        emergency: {
          name: String(emergencyFirst?.name ?? ""),
          phone: String(emergencyFirst?.phone ?? emergencyFirst?.tel ?? ""),
          relation: String(emergencyFirst?.relation ?? ""),
        },
        school: schoolId != null && schoolId > 0 ? String(schoolId) : "",
        gradeYear:
          (profile as { gradeYear?: number | null }).gradeYear != null
            ? String((profile as { gradeYear?: number | null }).gradeYear)
            : "",
      };

      setEditProfileData(initialData);
    }
  };

  const handleSaveProfileData = async () => {
    // ตรวจสอบ validation เลขบัตรประชาชนทั้งในโหมด create และ edit
    const isValid = await validateCitizenIdAsync(editProfileData.citizenId);

    if (!isValid) {
      addToast({
        title: "ข้อผิดพลาด",
        description: "กรุณาตรวจสอบเลขบัตรประชาชน",
        color: "danger",
      });

      return;
    }

    // ตรวจสอบวันเกิด
    const birthdayError = validateBirthday(editProfileData.birthDate);

    if (birthdayError) {
      addToast({
        title: "ข้อผิดพลาด",
        description: birthdayError,
        color: "danger",
      });

      return;
    }

    const hasSchool =
      editProfileData.school && Number(editProfileData.school) > 0;
    const hasGradeYear =
      editProfileData.gradeYear && Number(editProfileData.gradeYear) > 0;

    if (hasSchool && !hasGradeYear) {
      setGradeYearError("กรุณาเลือกชั้นปี");
      addToast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกชั้นปี",
        color: "danger",
      });

      return;
    }

    setGradeYearError("");
    setIsProfileSaving(true);
    try {
      const profileData = {
        hn: editProfileData.hn,
        citizenId: editProfileData.citizenId,
        prefixId: parseInt(editProfileData.prefixId),
        sex: parseInt(editProfileData.sex),
        firstName: editProfileData.firstName,
        lastName: editProfileData.lastName,
        birthDate:
          editProfileData.birthDate &&
          editProfileData.birthDate !== "" &&
          editProfileData.birthDate.includes("/")
            ? new Date(parseThaiDateToISO(editProfileData.birthDate))
            : null,
        ethnicity: editProfileData.ethnicity,
        nationality: editProfileData.nationality,
        mainInsclCode: editProfileData.mainInsclCode || null,
        mainInsclName: editProfileData.mainInsclName || null,
        subInsclCode: editProfileData.subInsclCode || null,
        subInsclName: editProfileData.subInsclName || null,
        hmainCode: editProfileData.hmainCode || null,
        hmainName: editProfileData.hmainName || null,
        hsubCode: editProfileData.hsubCode || null,
        hsubName: editProfileData.hsubName || null,
        nhsoVerifiedAt: editProfileData.nhsoVerifiedAt || null,
        schoolId: editProfileData.school
          ? parseInt(editProfileData.school)
          : null,
        gradeYear: editProfileData.gradeYear
          ? parseInt(editProfileData.gradeYear)
          : null,
        // Keep existing facility; this modal does not allow changing it
        healthcareFacilityId: resolveHealthcareFacilityId(data?.profile),
        isStudent: Boolean(
          editProfileData.school && Number(editProfileData.school) > 0
        ),
        address: {
          houseNo: editProfileData.address.houseNo,
          villageNo: editProfileData.address.villageNo,
          soi: editProfileData.address.soi,
          road: editProfileData.address.road,
          subdistrictId: parseInt(editProfileData.address.subdistrictId),
          districtId: parseInt(editProfileData.address.districtId),
          provinceId: parseInt(editProfileData.address.provinceId),
        },
        phone: editProfileData.phone,
        emergency: {
          name: editProfileData.emergency.name,
          phone: editProfileData.emergency.phone,
          relation: editProfileData.emergency.relation,
        },
      };

      let response;

      if (mode === "create") {
        // สร้าง profile ใหม่
        response = await fetch("/api/profile/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        });
      } else {
        // แก้ไข profile ที่มีอยู่
        // ถ้าเชื่อม LINE แล้วใช้ userId; ถ้ายังไม่เชื่อม LINE ใช้ profile.id (admin อัปเดตตาม profile id)
        const profile = data?.profile;

        if (!profile?.id) {
          addToast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่พบข้อมูลโปรไฟล์",
            color: "danger",
          });
          setIsProfileSaving(false);

          return;
        }

        const updateTargetId = profile.userId ?? profile.id;
        const updateData = {
          id: profile.id,
          ...profileData,
        };

        response = await fetch(`/api/profile/user/${updateTargetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
      }

      if (response.ok) {
        addToast({
          title: "สำเร็จ",
          description:
            mode === "create"
              ? "สร้างข้อมูลผู้ประเมินสำเร็จ"
              : "บันทึกข้อมูลผู้ประเมินสำเร็จ",
          color: "success",
        });

        // เรียก onSuccess ก่อนปิด modal เพื่อให้ parent component อัปเดตข้อมูล
        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      } else {
        const errorPayload = (await response.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };

        throw new Error(
          errorPayload.message ||
            errorPayload.error ||
            "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
        );
      }
    } catch (error) {
      addToast({
        title: "ข้อผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        color: "danger",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  useEffect(() => {
    GetProvinceList();
    GetDistrictList();
    GetSubdistrictList();
    GetSchoolList();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // School list is optional (DB may have zero active schools). Do not block
    // profile field hydration on schools.length — that left the edit form blank.
    setCurrentData(data);
    initializeEditProfileData();
  }, [isOpen, data, mode]);

  // เพิ่ม useEffect เพื่ออัปเดตข้อมูลเมื่อ data เปลี่ยน
  useEffect(() => {
    if (
      isOpen &&
      data &&
      currentData &&
      JSON.stringify(data) !== JSON.stringify(currentData)
    ) {
      // อัปเดตข้อมูลเมื่อ data เปลี่ยน
      setCurrentData(data);
      initializeEditProfileData();
    }
  }, [data, isOpen, currentData]);

  // รีเซ็ตข้อมูลเมื่อ modal ปิด
  useEffect(() => {
    if (!isOpen) {
      setCurrentData(null);
      // รีเซ็ต error messages เมื่อปิด modal
      setCitizenIdError("");
      setBirthdayError("");
    }
  }, [isOpen]);

  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      closeButton={false}
      isOpen={isOpen}
      radius="md"
      scrollBehavior="inside"
      shadow="lg"
      size="3xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-row justify-center">
          <h2 className="text-2xl font-bold">
            {mode === "create"
              ? "เพิ่มข้อมูลผู้ประเมิน"
              : "แก้ไขข้อมูลผู้ประเมิน"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2">
            <p className="text-md font-bold">ข้อมูลส่วนตัว</p>
            <div className="flex flex-row gap-2">
              <Input
                description={
                  isCheckingCitizenId ? "กำลังตรวจสอบ..." : undefined
                }
                errorMessage={citizenIdError}
                isInvalid={citizenIdError !== ""}
                isRequired={true}
                label="เลขที่บัตรประชาชน"
                maxLength={13}
                name="citizenId"
                placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
                size="sm"
                value={editProfileData.citizenId}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                endContent={
                  <Button
                    isIconOnly
                    aria-label="ค้นหา HN"
                    isLoading={isHnLoading}
                    size="sm"
                    variant="light"
                    onPress={handleSearchHn}
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </Button>
                }
                label="HN"
                name="hn"
                size="sm"
                value={editProfileData.hn}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Input
                className="flex-1"
                endContent={
                  <Button
                    isIconOnly
                    aria-label="ค้นหาสิทธิจาก สปสช."
                    isLoading={isNhsoLoading}
                    size="sm"
                    variant="light"
                    onPress={handleSearchNhso}
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </Button>
                }
                label="สิทธิการรักษา (สปสช.)"
                name="mainInsclName"
                placeholder="ค้นหาจากเลขบัตรประชาชน"
                size="sm"
                value={
                  editProfileData.mainInsclName ||
                  editProfileData.mainInsclCode ||
                  ""
                }
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Select
                isRequired={true}
                label="คำนำหน้า"
                name="prefixId"
                placeholder="เลือกคำนำหน้า"
                selectedKeys={
                  editProfileData.prefixId ? [editProfileData.prefixId] : []
                }
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleEditProfileSelectChange("prefixId", selectedKey);
                }}
              >
                {prefix.map((item) => (
                  <SelectItem key={item.key}>{item.label}</SelectItem>
                ))}
              </Select>
              <Input
                isRequired={true}
                label="ชื่อ"
                name="firstName"
                size="sm"
                value={editProfileData.firstName}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                isRequired={true}
                label="นามสกุล"
                name="lastName"
                size="sm"
                value={editProfileData.lastName}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Select
                isRequired={true}
                label="เพศ"
                name="sex"
                placeholder="เลือกเพศ"
                selectedKeys={editProfileData.sex ? [editProfileData.sex] : []}
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleEditProfileSelectChange("sex", selectedKey);
                }}
              >
                <SelectItem key="1">ชาย</SelectItem>
                <SelectItem key="2">หญิง</SelectItem>
                <SelectItem key="3">ไม่ระบุ</SelectItem>
              </Select>
              <Input
                isRequired={true}
                label="เชื้อชาติ"
                name="ethnicity"
                size="sm"
                value={editProfileData.ethnicity}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                isRequired={true}
                label="สัญชาติ"
                name="nationality"
                size="sm"
                value={editProfileData.nationality}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <BirthdaySelect
                className="w-full"
                errorMessage={birthdayError}
                isInvalid={!!birthdayError}
                isRequired={true}
                label="วันเกิด"
                name="birthday"
                placeholder="วว/ดด/ปปปป (พ.ศ.)"
                size="sm"
                value={editProfileData.birthDate}
                variant="bordered"
                onChange={(isoDate) => {
                  if (!isoDate) {
                    setEditProfileData((prev) => ({
                      ...prev,
                      birthDate: "",
                      thaiYear: "",
                    }));
                    setBirthdayError("กรุณาระบุวันเกิด");

                    return;
                  }

                  const thaiDate = formatDateForDisplay(isoDate);
                  const error = validateBirthday(thaiDate);

                  setEditProfileData((prev) => ({
                    ...prev,
                    birthDate: thaiDate,
                    thaiYear: error ? "" : calculateThaiYear(isoDate),
                  }));
                  setBirthdayError(error);
                }}
              />
            </div>
            {mode !== "create" && (
              <Input
                isReadOnly
                description={
                  data?.caseHealthcareFacility
                    ? "หน่วยงานเจ้าของเคส (แก้ไขไม่ได้)"
                    : "หน่วยงานที่ผู้ใช้เลือกตอนลงทะเบียน (แก้ไขไม่ได้)"
                }
                label="หน่วยงาน"
                size="sm"
                value={resolveHealthcareFacilityName(data) || "-"}
                variant="bordered"
              />
            )}
            <Autocomplete
              className="w-full"
              defaultItems={schools}
              isRequired={false}
              label="สถานศึกษา"
              name="school"
              placeholder="เลือกสถานศึกษา"
              selectedKey={
                editProfileData.school ? editProfileData.school : null
              }
              size="sm"
              variant="bordered"
              onSelectionChange={(key) => {
                handleEditProfileSelectChange("school", key ? String(key) : "");
              }}
            >
              {(item) => (
                <AutocompleteItem key={String(item.id)} textValue={item.name}>
                  {item.name}
                </AutocompleteItem>
              )}
            </Autocomplete>
            {editProfileData.school && Number(editProfileData.school) > 0 && (
              <Select
                isRequired
                className="w-full"
                errorMessage={gradeYearError || "กรุณาเลือกชั้นปี"}
                isInvalid={!!gradeYearError}
                label="ชั้นปี"
                name="gradeYear"
                placeholder="เลือกชั้นปี"
                selectedKeys={
                  editProfileData.gradeYear
                    ? new Set([editProfileData.gradeYear])
                    : new Set<string>()
                }
                size="sm"
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;

                  handleEditProfileSelectChange("gradeYear", selectedKey);
                }}
              >
                {gradeYearLevels.map((level) => (
                  <SelectItem key={String(level.key)} textValue={level.label}>
                    {level.label}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>
          <Divider className="my-1" />
          <p className="text-md font-bold">ที่อยู่</p>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Input
                isRequired={true}
                label="บ้านเลขที่"
                name="address.houseNo"
                size="sm"
                value={editProfileData.address.houseNo}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                label="หมู่ที่"
                name="address.villageNo"
                size="sm"
                value={editProfileData.address.villageNo}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Input
                label="ซอย"
                name="address.soi"
                size="sm"
                value={editProfileData.address.soi}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
              <Input
                label="ถนน"
                name="address.road"
                size="sm"
                value={editProfileData.address.road}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
            <div className="flex flex-row gap-2">
              <Autocomplete
                defaultItems={province}
                isRequired={true}
                label="จังหวัด"
                name="address.provinceId"
                placeholder="เลือกจังหวัด"
                selectedKey={editProfileData.address.provinceId || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.provinceId",
                    selectedKey
                  );
                  // รีเซ็ตอำเภอและตำบลเมื่อเปลี่ยนจังหวัด
                  handleEditProfileSelectChange("address.districtId", "");
                  handleEditProfileSelectChange("address.subdistrictId", "");
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Autocomplete
                defaultItems={distrince.filter(
                  (item) =>
                    item.provinceId.toString() ===
                    editProfileData.address.provinceId
                )}
                isDisabled={!editProfileData.address.provinceId}
                isRequired={true}
                label="อำเภอ"
                name="address.districtId"
                placeholder="เลือกอำเภอ"
                selectedKey={editProfileData.address.districtId || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.districtId",
                    selectedKey
                  );
                  // รีเซ็ตตำบลเมื่อเปลี่ยนอำเภอ
                  handleEditProfileSelectChange("address.subdistrictId", "");
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
            </div>
            <div className="flex flex-row gap-2">
              <Autocomplete
                defaultItems={subdistrince.filter(
                  (item) =>
                    item.districtId.toString() ===
                    editProfileData.address.districtId
                )}
                isDisabled={!editProfileData.address.districtId}
                isRequired={true}
                label="ตำบล"
                name="address.subdistrictId"
                placeholder="เลือกตำบล"
                selectedKey={editProfileData.address.subdistrictId || ""}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const selectedKey = key as string;

                  handleEditProfileSelectChange(
                    "address.subdistrictId",
                    selectedKey
                  );
                }}
              >
                {(item) => (
                  <AutocompleteItem
                    key={item.id.toString()}
                    textValue={item.nameInThai}
                  >
                    {item.nameInThai}
                  </AutocompleteItem>
                )}
              </Autocomplete>
              <Input
                label="โทรศัพท์"
                maxLength={10}
                name="phone"
                size="sm"
                value={editProfileData.phone}
                variant="bordered"
                onChange={handleEditProfileChange}
              />
            </div>
          </div>
          <Divider className="my-1" />
          <p className="text-md font-bold">ข้อมูลผู้ติดต่อฉุกเฉิน</p>
          <div className="flex flex-row gap-2">
            <Input
              isRequired={true}
              label="ชื่อผู้ติดต่อฉุกเฉิน"
              name="emergency.name"
              size="sm"
              value={editProfileData.emergency.name}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
            <Input
              isRequired={true}
              label="โทรศัพท์"
              maxLength={10}
              name="emergency.phone"
              size="sm"
              value={editProfileData.emergency.phone}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
            <Input
              isRequired={true}
              label="ความสัมพันธ์"
              name="emergency.relation"
              size="sm"
              value={editProfileData.emergency.relation}
              variant="bordered"
              onChange={handleEditProfileChange}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            isDisabled={isProfileSaving}
            variant="light"
            onPress={onClose}
          >
            ปิด
          </Button>
          <Button
            color="primary"
            isDisabled={isProfileSaving}
            isLoading={isProfileSaving}
            onPress={handleSaveProfileData}
          >
            {isProfileSaving
              ? "กำลังบันทึก..."
              : mode === "create"
                ? "สร้าง"
                : "บันทึก"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
