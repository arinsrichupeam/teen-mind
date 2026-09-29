"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Sex } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";

import { Step1, type ChangeEventLike } from "../register/components/step1";
import { Step2 } from "../register/components/step2";
import { Step3 } from "../register/components/step3";

import { mapLegacySexToSex } from "@/lib/legacy-value-mapping";
import {
  normalizeProfileFormFieldName,
  applyAddressFormField,
} from "@/lib/profile-form-fields";
import { LiffPageBg } from "@/components/liff-page-bg";
import { title } from "@/components/primitives";

type ProfileFormState = {
  id: string;
  userId: string | null;
  citizenId: string;
  prefixId: number;
  sex: Sex;
  firstName: string;
  lastName: string;
  birthDate: Date;
  ethnicity: string;
  nationality: string;
  phone: string;
  schoolId: number | null;
  gradeYear?: number | null;
  isStudent?: boolean;
  hn: string | null;
  healthcareFacilityId: string | null;
  createdAt: Date;
  updatedAt: Date;
  mainInsclCode?: string | null;
  mainInsclName?: string | null;
  subInsclCode?: string | null;
  subInsclName?: string | null;
  hmainCode?: string | null;
  hmainName?: string | null;
  hsubCode?: string | null;
  hsubName?: string | null;
  nhsoVerifiedAt?: Date | null;
};

type AddressFormState = {
  id: string;
  profileId: string;
  houseNo: string;
  villageNo: string | null;
  soi: string | null;
  road: string | null;
  provinceId: number;
  districtId: number;
  subdistrictId: number;
  postalCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EmergencyFormState = {
  id: string;
  profileId: string;
  name: string;
  phone: string;
  relation: string;
  createdAt: Date;
  updatedAt: Date;
};

const profileInitValue: ProfileFormState = {
  id: "",
  userId: "",
  citizenId: "",
  prefixId: 0,
  sex: Sex.UNSPECIFIED,
  firstName: "",
  lastName: "",
  birthDate: new Date(),
  ethnicity: "",
  nationality: "",
  phone: "",
  schoolId: 0,
  gradeYear: null,
  isStudent: false,
  hn: "",
  healthcareFacilityId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const addressInitValue: AddressFormState = {
  id: "",
  profileId: "",
  houseNo: "",
  villageNo: "",
  soi: "",
  road: "",
  provinceId: 0,
  districtId: 0,
  subdistrictId: 0,
  postalCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const emergencyContactInitValue: EmergencyFormState = {
  id: "",
  profileId: "",
  name: "",
  phone: "",
  relation: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [showAlert, setShowAlert] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [profile, setProfile] = useState<ProfileFormState>(profileInitValue);
  const [address, setAddress] = useState<AddressFormState>(addressInitValue);
  const [emergency, setEmergency] = useState<EmergencyFormState>(
    emergencyContactInitValue
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchProfileData = useCallback(async () => {
    const userId = session?.user?.id;

    if (!userId) return;
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/profile/user/${userId}`);
      const data = await response.json();

      if (data?.profile && data.profile.length > 0) {
        const profileData = data.profile[0];
        const schoolId =
          profileData.schoolId ??
          (profileData.school?.id != null
            ? Number(profileData.school.id)
            : null);

        setProfile({
          ...profileData,
          birthDate: new Date(profileData.birthDate),
          schoolId: schoolId ?? 0,
          gradeYear:
            profileData.gradeYear !== null &&
            profileData.gradeYear !== undefined
              ? Number(profileData.gradeYear)
              : null,
          isStudent: Boolean(profileData.isStudent),
          healthcareFacilityId: profileData.healthcareFacilityId ?? null,
        });

        if (data.profile[0].address && data.profile[0].address.length > 0) {
          setAddress(data.profile[0].address[0]);
        }

        if (data.profile[0].emergency && data.profile[0].emergency.length > 0) {
          setEmergency(data.profile[0].emergency[0]);
        }
      } else {
        addToast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบข้อมูลโปรไฟล์ กรุณาลงทะเบียนก่อน",
          color: "warning",
        });
        router.push("/liff/register");
      }
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง" + error,
        color: "danger",
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [session?.user?.id, router]);

  useEffect(() => {
    if (
      status !== "loading" &&
      status === "authenticated" &&
      session?.user?.id
    ) {
      fetchProfileData();
    }
  }, [session?.user?.id, status, fetchProfileData]);

  type StepName = "Profile" | "Address" | "Emergency";

  const NextStep = useCallback(
    (name: StepName) => {
      switch (name) {
        case "Profile":
          setSelected("address");
          break;
        case "Address":
          setSelected("emergency");
          break;
        case "Emergency":
          setIsLoading(true);
          SaveToDB();
          break;
      }
    },
    [profile, address, emergency]
  );

  const BackStep = useCallback((name: StepName) => {
    switch (name) {
      case "Address":
        setSelected("profile");
        break;
      case "Emergency":
        setSelected("address");
        break;
    }
  }, []);

  const ProfileHandleChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        | ChangeEventLike
    ) => {
      const { name, value } = e.target;

      if (name === "birthday") {
        setProfile((prev) => ({
          ...prev,
          birthDate:
            value === null || value === ""
              ? prev.birthDate
              : new Date(`${String(value)}T12:00:00`),
        }));
      } else if (name === "prefix") {
        setProfile((prev) => ({ ...prev, prefixId: Number(value) }));
      } else if (name === "sex") {
        setProfile((prev) => ({
          ...prev,
          sex: mapLegacySexToSex(Number(value)),
        }));
      } else if (name === "citizenId") {
        const val = String(value);

        if (val.length <= 13) {
          setProfile((prev) => ({ ...prev, citizenId: val }));
        }
      } else if (name === "school") {
        const schoolId = Number(value) || 0;

        setProfile((prev) => ({
          ...prev,
          schoolId,
          ...(schoolId === 0 ? { gradeYear: null } : {}),
        }));
      } else if (name === "isStudent") {
        const next = value === true || value === "true" || value === 1;

        setProfile((prev) => ({
          ...prev,
          isStudent: next,
          ...(next ? {} : { schoolId: 0, gradeYear: null }),
        }));
      } else if (name === "healthcareFacilityId") {
        setProfile((prev) => ({
          ...prev,
          healthcareFacilityId:
            value != null && String(value).trim() !== "" ? String(value) : null,
        }));
      } else if (name === "gradeYear") {
        const gradeYear = value !== "" && value != null ? Number(value) : null;

        setProfile((prev) => ({ ...prev, gradeYear }));
      } else if (
        name === "firstName" ||
        name === "firstname" ||
        name === "lastName" ||
        name === "lastname" ||
        name === "phone" ||
        name === "tel" ||
        name === "ethnicity" ||
        name === "nationality" ||
        name === "hn"
      ) {
        const field =
          name === "firstname"
            ? "firstName"
            : name === "lastname"
              ? "lastName"
              : name === "tel"
                ? "phone"
                : name;

        setProfile((prev) => ({ ...prev, [field]: value }));
      } else if (
        name === "mainInsclCode" ||
        name === "mainInsclName" ||
        name === "subInsclCode" ||
        name === "subInsclName" ||
        name === "hmainCode" ||
        name === "hmainName" ||
        name === "hsubCode" ||
        name === "hsubName"
      ) {
        setProfile((prev) => ({
          ...prev,
          [name]:
            value === null || value === undefined || String(value).trim() === ""
              ? null
              : String(value),
        }));
      } else if (name === "nhsoVerifiedAt") {
        setProfile((prev) => ({
          ...prev,
          nhsoVerifiedAt:
            value === null || value === undefined || value === ""
              ? null
              : new Date(String(value)),
        }));
      } else if (value !== null) {
        setProfile((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  const AddressHandleChange = useCallback(
    (e: { target: { name: string; value: string } }) => {
      setAddress(
        (prev) =>
          applyAddressFormField(
            prev as unknown as Record<string, unknown>,
            e.target.name,
            e.target.value
          ) as unknown as typeof prev
      );
    },
    []
  );

  const EmergencyHandleChange = useCallback(
    (e: { target: { name: string; value: string } }) => {
      const field = normalizeProfileFormFieldName(e.target.name);

      setEmergency((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    },
    []
  );

  const SaveToDB = async () => {
    if (!profile.healthcareFacilityId?.trim()) {
      addToast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือกสถานพยาบาล",
        color: "danger",
      });
      setSelected("profile");

      return;
    }

    const isStudent = profile.isStudent === true;
    const hasSchool = profile.schoolId != null && Number(profile.schoolId) > 0;
    const hasGradeYear =
      profile.gradeYear != null && Number(profile.gradeYear) > 0;

    if (isStudent && !hasSchool) {
      addToast({
        title: "ข้อมูลไม่ครบ",
        description: "นักเรียนต้องระบุสถานศึกษา",
        color: "danger",
      });
      setSelected("profile");

      return;
    }

    if (hasSchool && !hasGradeYear) {
      addToast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณาเลือกชั้นปีเมื่อระบุสถานศึกษา",
        color: "danger",
      });
      setSelected("profile");

      return;
    }

    const data = JSON.stringify({
      hn: profile.hn,
      citizenId: profile.citizenId,
      prefixId: profile.prefixId,
      sex: profile.sex,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate.toISOString(),
      ethnicity: profile.ethnicity,
      nationality: profile.nationality,
      phone: profile.phone,
      isStudent,
      healthcareFacilityId: profile.healthcareFacilityId,
      schoolId:
        isStudent &&
        profile.schoolId != null &&
        profile.schoolId !== 0 &&
        Number(profile.schoolId) > 0
          ? Number(profile.schoolId)
          : null,
      gradeYear:
        isStudent &&
        profile.gradeYear !== null &&
        profile.gradeYear !== undefined
          ? profile.gradeYear
          : null,
      mainInsclCode: profile.mainInsclCode ?? null,
      mainInsclName: profile.mainInsclName ?? null,
      subInsclCode: profile.subInsclCode ?? null,
      subInsclName: profile.subInsclName ?? null,
      hmainCode: profile.hmainCode ?? null,
      hmainName: profile.hmainName ?? null,
      hsubCode: profile.hsubCode ?? null,
      hsubName: profile.hsubName ?? null,
      nhsoVerifiedAt: profile.nhsoVerifiedAt
        ? new Date(profile.nhsoVerifiedAt).toISOString()
        : null,
      addresses: {
        houseNo: address.houseNo,
        villageNo: address.villageNo,
        soi: address.soi,
        road: address.road,
        subdistrictId: address.subdistrictId,
        districtId: address.districtId,
        provinceId: address.provinceId,
      },
      emergencyContacts: {
        name: emergency.name,
        phone: emergency.phone,
        relation: emergency.relation,
      },
    });

    if (!profile.id) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลโปรไฟล์",
        color: "danger",
      });
      setIsLoading(false);

      return;
    }

    try {
      const userId = session?.user?.id;

      if (!userId) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่พบ session กรุณาล็อกอินใหม่",
          color: "danger",
        });
        setIsLoading(false);

        return;
      }
      const res = await fetch(`/api/profile/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });

      const val = await res.json();

      if (val.success) {
        setShowAlert(true);
        setIsSubmitted(true);
        addToast({
          title: "อัพเดทข้อมูลสำเร็จ",
          description: "ข้อมูลของคุณได้รับการอัพเดทเรียบร้อยแล้ว",
          color: "success",
        });
        setTimeout(() => {
          router.push("/liff");
        }, 2000);
      } else {
        throw new Error(val.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัพเดทข้อมูลได้ กรุณาลองใหม่อีกครั้ง " + error,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return null;
  }

  return (
    <section className="relative isolate flex flex-col w-full min-h-screen items-center gap-4 pt-10 px-8 py-8 pb-14 md:py-10 overflow-hidden">
      <LiffPageBg blur />
      <Suspense>
        <div className="flex items-center my-3 absolute top-5 right-5">
          <Alert
            color={"success"}
            isVisible={showAlert}
            title={"อัพเดทข้อมูลเรียบร้อย"}
            variant="faded"
          />
        </div>
        <div className="flex flex-col gap-5 items-center w-full max-w-2xl">
          <div className="flex flex-row items-center justify-center w-full gap-4">
            <h1 className={`${title({ fullWidth: true })} text-center flex-1`}>
              แก้ไขข้อมูลส่วนตัว
            </h1>
          </div>
          <div className="flex flex-col w-full min-h-[calc(100vh_-_350px)]">
            <Tabs
              aria-label="Options"
              color="primary"
              fullWidth={true}
              selectedKey={selected}
              variant="underlined"
            >
              <Tab key="profile" title="ข้อมูลส่วนตัว">
                <Step1
                  HandleChange={ProfileHandleChange}
                  NextStep={NextStep}
                  Result={profile}
                  primaryAction="cancel"
                  onCancel={() => router.push("/liff")}
                />
              </Tab>
              <Tab key="address" title="ที่อยู่อาศัย">
                <Step2
                  BackStep={BackStep}
                  HandleChange={AddressHandleChange}
                  NextStep={NextStep}
                  Result={address}
                />
              </Tab>
              <Tab key="emergency" title="ผู้ติดต่อในกรณีฉุกเฉิน">
                <Step3
                  BackStep={BackStep}
                  HandleChange={EmergencyHandleChange}
                  NextStep={NextStep}
                  Result={emergency}
                  isLoading={isLoading}
                  isSubmitted={isSubmitted}
                />
              </Tab>
            </Tabs>
          </div>
        </div>
      </Suspense>
    </section>
  );
}
