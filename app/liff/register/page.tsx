"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Address, EmergencyContact, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Alert } from "@heroui/alert";

import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { Step3 } from "./components/step3";

import { title } from "@/components/primitives";
import Loading from "@/app/loading";

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

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [showAlert, setShowAlert] = useState(false);

  const [profile, setProfile] = useState<Profile>(profileInitValue);
  const [address, setAddress] = useState<Address>(addressInitValue);
  const [emergency, setEmergency] = useState<EmergencyContact>(
    emergencyContactInitValue
  );

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setProfile((prev) => ({
        ...prev,
        userId: session?.user?.id as string,
      }));
    }
  }, [session]);

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
          SaveToDB();
          break;
      }
    },
    [selected]
  );

  const BackStep = useCallback(
    (name: any) => {
      switch (name) {
        case "Address":
          setSelected("profile");
          break;
        case "Emergency":
          setSelected("address");
          break;
      }
    },
    [selected]
  );

  const ProfileHandleChange = useCallback((e: any) => {
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
  }, []);

  const AddressHandleChange = useCallback((e: any) => {
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const EmergencyHandleChange = useCallback((e: any) => {
    setEmergency((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const SaveToDB = async () => {
    const data = JSON.stringify({
      register_profile: profile,
      register_address: address,
      register_emergency: emergency,
    });

    await fetch("/api/register/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    }).then((res) => {
      if (res.status === 200) {
        setShowAlert(true);
        setTimeout(() => {
          router.push("/liff/question");
        }, 3000);
      }
    });
  };

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
                />
              </Tab>
            </Tabs>
          </div>
        </div>
      </Suspense>
    </section>
  );
}
