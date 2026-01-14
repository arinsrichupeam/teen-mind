"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Address, EmergencyContact, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Alert } from "@heroui/alert";
import { addToast } from "@heroui/toast";

import { Step1 } from "../register/components/step1";
import { Step2 } from "../register/components/step2";
import { Step3 } from "../register/components/step3";

import { title } from "@/components/primitives";

const profileInitValue: Profile = {
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

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [showAlert, setShowAlert] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [profile, setProfile] = useState<Profile>(profileInitValue);
  const [address, setAddress] = useState<Address>(addressInitValue);
  const [emergency, setEmergency] = useState<EmergencyContact>(
    emergencyContactInitValue
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (
      status !== "loading" &&
      status === "authenticated" &&
      session?.user?.id
    ) {
      fetchProfileData();
    }
  }, [session, status]);

  const fetchProfileData = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch(`/api/profile/user/${session?.user?.id}`);
      const data = await response.json();

      if (data?.profile && data.profile.length > 0) {
        const profileData = data.profile[0];

        setProfile({
          ...profileData,
          birthday: new Date(profileData.birthday),
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
  };

  const NextStep = useCallback(
    (name: any) => {
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

  const BackStep = useCallback((name: any) => {
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
    (e: any) => {
      if (e.target.name === "birthday") {
        setProfile((prev: any) => ({
          ...prev,
          birthday: e.target.value,
        }));
      } else if (e.target.name === "prefix") {
        setProfile((prev: any) => ({
          ...prev,
          prefixId: parseInt(e.target.value),
        }));
      } else if (e.target.name === "sex") {
        setProfile((prev: any) => ({
          ...prev,
          sex: parseInt(e.target.value),
        }));
      } else if (e.target.name === "citizenId") {
        const val = e.target.value;

        if (val.length <= 13) {
          setProfile((prev: any) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }));
        }
      } else if (e.target.name === "school") {
        setProfile((prev: any) => ({
          ...prev,
          schoolId: parseInt(e.target.value),
        }));
      } else {
        setProfile((prev: any) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      }
    },
    [profile]
  );

  const AddressHandleChange = useCallback(
    (e: any) => {
      setAddress((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    },
    [address]
  );

  const EmergencyHandleChange = useCallback(
    (e: any) => {
      setEmergency((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    },
    [emergency]
  );

  const SaveToDB = async () => {
    const data = JSON.stringify({
      hn: profile.hn,
      citizenId: profile.citizenId,
      prefixId: profile.prefixId,
      sex: profile.sex,
      firstname: profile.firstname,
      lastname: profile.lastname,
      birthday: profile.birthday.toISOString(),
      ethnicity: profile.ethnicity,
      nationality: profile.nationality,
      tel: profile.tel,
      schoolId: profile.schoolId || null,
      address: {
        houseNo: address.houseNo,
        villageNo: address.villageNo,
        soi: address.soi,
        road: address.road,
        subdistrict: address.subdistrict,
        district: address.district,
        province: address.province,
      },
      emergency: {
        name: emergency.name,
        tel: emergency.tel,
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
      const res = await fetch(`/api/profile/user/${profile.id}`, {
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
    <section className="flex flex-col w-full min-h-[calc(100vh-48px)] items-center gap-4 pt-10 px-8 py-8 md:py-10 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat bg-fixed">
      <Suspense>
        <div className="flex items-center my-3 absolute top-5 right-5">
          <Alert
            color={"success"}
            isVisible={showAlert}
            title={"อัพเดทข้อมูลเรียบร้อย"}
            variant="faded"
          />
        </div>
        <div className="flex flex-col gap-5 items-center">
          <h1 className={`${title({ fullWidth: true })} text-center`}>
            แก้ไขข้อมูลส่วนตัว
          </h1>
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
