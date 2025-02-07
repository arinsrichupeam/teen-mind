"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Address, EmergencyContact, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@heroui/alert";

import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { Step3 } from "./components/step3";

import { title } from "@/components/primitives";

const profileInitValue: Profile = {
  id: "",
  userId: "",
  citizenId: "",
  prefix: 0,
  sex: 0,
  firstname: "",
  lastname: "",
  birthday: new Date(),
  ethnicity: "",
  nationality: "",
  tel: "",
  school: "",
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

  const SaveToDB = async () => {
    // await fetch("/api/register", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     register_profile: profile,
    //     register_address: address,
    //     register_emergency: emergency,
    //   }),
    // }).then((res) => {
    //   if (res.status === 200) {
        setShowAlert(true);
    //     setTimeout(() => {
    //       router.push("/liff/question");
    //     }, 3000);
    //   }
    // });
  };

  const NextStep = (name: any) => {
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
  };

  const BackStep = (name: any) => {
    switch (name) {
      case "Address":
        setSelected("profile");
        break;
      case "Emergency":
        setSelected("address");
        break;
    }
  };

  const ProfileHandleChange = (e: any) => {
    if (e.target.name === "birthday") {
      setProfile((prev: any) => ({
        ...prev,
        birthday: e.target.value,
      }));
    } else if (e.target.name === "prefix") {
      setProfile((prev: any) => ({
        ...prev,
        prefix: parseInt(e.target.value),
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
    } else {
      setProfile((prev: any) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  };

  const AddressHandleChange = (e: any) => {
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const EmergencyHandleChange = (e: any) => {
    setEmergency((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setProfile((prev) => ({
        ...prev,
        userId: session?.user?.id as string,
      }));
    }
  }, [session]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 px-2">
      <div className="flex items-center my-3 absolute top-5 right-5">
        <Alert
          color={"success"}
          isVisible={showAlert}
          title={"ลงทะเบียนเรียบร้อย"}
          variant="faded"
        />
      </div>
      <div className="flex flex-col gap-5 pt-8">
        <h1 className={title()}>ลงทะเบียน</h1>
        <div className="flex flex-col w-full min-h-[calc(100vh_-_135px)]">
          <Tabs
            aria-label="Options"
            className="max-w-sm"
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
    </section>
  );
}
