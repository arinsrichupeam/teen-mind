"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Address, EmergencyContact, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";

import { Step1, type ChangeEventLike } from "./components/step1";
import { Step2 } from "./components/step2";
import { Step3 } from "./components/step3";

import { title } from "@/components/primitives";
import Loading from "@/app/loading";

const profileInitValue: Profile & { gradeYear?: number | null } = {
  id: "",
  userId: "",
  citizenId: "",
  prefixId: 0,
  sex: 0,
  firstname: "",
  lastname: "",
  birthday: new Date(),
  ethnicity: "",
  nationality: "",
  tel: "",
  schoolId: 0,
  gradeYear: null,
  hn: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const addressInitValue: Address = {
  id: "",
  profileId: "",
  houseNo: "",
  villageNo: "",
  soi: "",
  road: "",
  province: 0,
  district: 0,
  subdistrict: 0,
};

const emergencyContactInitValue: EmergencyContact = {
  id: "",
  profileId: "",
  name: "",
  tel: "",
  relation: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [showAlert, setShowAlert] = useState(false);

  const [profile, setProfile] = useState<
    Profile & { gradeYear?: number | null }
  >(profileInitValue);
  const [address, setAddress] = useState<Address>(addressInitValue);
  const [emergency, setEmergency] = useState<EmergencyContact>(
    emergencyContactInitValue
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const profileRef = useRef(profile);
  const addressRef = useRef(address);
  const emergencyRef = useRef(emergency);

  profileRef.current = profile;
  addressRef.current = address;
  emergencyRef.current = emergency;

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setProfile((prev) => ({
        ...prev,
        userId: session?.user?.id as string,
      }));
    }
  }, [session]);

  const SaveToDB = useCallback(async () => {
    const currentProfile = profileRef.current;
    const currentAddress = addressRef.current;
    const currentEmergency = emergencyRef.current;
    const userId = session?.user?.id ?? currentProfile.userId;

    if (!userId) {
      addToast({
        title: "กรุณารอสักครู่",
        description: "กำลังโหลดข้อมูลการเข้าสู่ระบบ กรุณากดส่งอีกครั้ง",
        color: "warning",
      });

      return;
    }

    const payload = {
      register_profile: { ...currentProfile, userId },
      register_address: currentAddress,
      register_emergency: currentEmergency,
    };

    try {
      setIsLoading(true);
      const res = await fetch("/api/register/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const val = await res.json();

      if (!res.ok) {
        addToast({
          title: "ลงทะเบียนไม่สำเร็จ",
          description: val?.error ?? `เกิดข้อผิดพลาด (${res.status})`,
          color: "danger",
        });

        return;
      }

      if (val.ref === "" || !val.ref) {
        setShowAlert(true);
        setIsSubmitted(true);
        setTimeout(() => {
          router.push("/liff/question");
        }, 3000);
      } else {
        setShowAlert(true);
        setIsSubmitted(true);
        setTimeout(() => {
          const refId =
            val.ref && typeof val.ref === "object" ? val.ref.id : val.ref;
          const referentId = ref || refId;

          router.push(
            `/liff/question/phqa?ref=${referentId}&profileId=${val.profile?.id ?? ""}`
          );
        }, 3000);
      }
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description:
          "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง " +
          (error instanceof Error ? error.message : String(error)),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, ref, session?.user?.id]);

  type StepName = "Profile" | "Address" | "Emergency";
  type RegisterProfileState = Profile & { gradeYear?: number | null };

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
    [SaveToDB]
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
        setProfile((prev: RegisterProfileState) => ({
          ...prev,
          birthday:
            value === null || value === ""
              ? prev.birthday
              : new Date(String(value)),
        }));
      } else if (name === "prefix") {
        setProfile((prev: RegisterProfileState) => ({
          ...prev,
          prefixId: parseInt(String(value), 10),
        }));
      } else if (name === "sex") {
        setProfile((prev: RegisterProfileState) => ({
          ...prev,
          sex: parseInt(String(value), 10),
        }));
      } else if (name === "citizenId") {
        const val = String(value);

        if (val.length <= 13) {
          setProfile((prev: RegisterProfileState) => ({
            ...prev,
            [name]: val,
          }));
        }
      } else if (name === "school") {
        const schoolId = parseInt(String(value), 10) || 0;

        setProfile((prev: RegisterProfileState) => ({
          ...prev,
          schoolId,
          ...(schoolId === 0 ? { gradeYear: null } : {}),
        }));
      } else if (name === "gradeYear") {
        const gradeYear =
          value !== "" && value != null ? parseInt(String(value), 10) : null;

        setProfile((prev: RegisterProfileState) => ({ ...prev, gradeYear }));
      } else {
        setProfile((prev: RegisterProfileState) => ({
          ...prev,
          [name]: String(value),
        }));
      }
    },
    []
  );

  const AddressHandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setAddress((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const EmergencyHandleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setEmergency((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  return (
    <section className="flex flex-col w-[calc(100vw)] min-h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10">
      <Suspense fallback={<Loading />}>
        <div className="flex items-center my-3 absolute top-5 right-5">
          <Alert
            color={"success"}
            isVisible={showAlert}
            title={"ลงทะเบียนเรียบร้อย"}
            variant="faded"
          />
        </div>
        <div className="flex flex-col gap-5">
          <h1 className={title()}>ลงทะเบียน</h1>
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
