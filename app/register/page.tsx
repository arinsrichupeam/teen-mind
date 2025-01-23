"use client"

import { title } from "@/components/primitives";
import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { Step3 } from "./components/step3";
import { useEffect, useState } from "react";
import { Address, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, Tab, Tabs } from "@heroui/react";

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
  createdAt: new Date(),
  updatedAt: new Date()
}

const addressInitValue: Address = {
  id: "",
  profileId: "",
  houseNo: "",
  villageNo: "",
  soi: "",
  road: "",
  province: 0,
  district: 0,
  subdistrict: 0
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [showAlert, setShowAlert] = useState(false);

  const [profile, setProfile] = useState<Profile>(profileInitValue);
  const [address, setAddress] = useState<Address>(addressInitValue);

  const SaveToDB = async () => {
    // Save to DB
    console.log("Save to DB");

    await fetch("/api/register", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ register_profile: profile, register_address: address })
    }).then((res) => {
      if (res.status === 200) {
        setShowAlert(true);
        setTimeout(() => {
          router.push("/question");
        }, 3000)
      }
    });
  }

  const NextStep = (name: any) => {
    switch (name) {
      case "Profile":
        setSelected("address");
        break;
      case "Address":
        setSelected("confirm");
        break;
      case "Confirm":
        SaveToDB();
        break;
    }
  }

  const BackStep = (name: any) => {
    switch (name) {
      case "Address":
        setSelected("profile");
        break;
      case "Confirm":
        setSelected("address");
        break;
    }
  }

  const ProfileHandleChange = (e: any) => {
    if (e.target.name === "birthday") {
      setProfile((prev: any) => ({
        ...prev,
        "birthday": e.target.value,
      }));
    }
    else if (e.target.name === "prefix") {
      setProfile((prev: any) => ({
        ...prev,
        "prefix": parseInt(e.target.value),
      }));
    }
    else if (e.target.name === "sex") {
      setProfile((prev: any) => ({
        ...prev,
        "sex": parseInt(e.target.value),
      }));
    }
    else if (e.target.name === "citizenId") {
      const val = e.target.value;
      if (val.length <= 13) {
        setProfile((prev: any) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
      }
    }
    else {
      setProfile((prev: any) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
    }
  }

  const AddressHandleChange = (e: any) => {
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setProfile((prev) => ({
        ...prev,
        userId: session?.user?.id as string,
      }));
    }
  }, [session]);

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className="flex items-center my-3 absolute top-5 right-5">
        <Alert color={"success"} title={"ลงทะเบียนเรียบร้อย"} variant="faded" isVisible={showAlert} />
      </div>
      <h1 className={title()}>ลงทะเบียน</h1>
      <div className="flex w-full flex-col">
        <Tabs aria-label="Options" selectedKey={selected} className="max-w-sm" variant="light" color="primary">
          <Tab key="profile" title="ข้อมูลส่วนตัว">
            <Step1 NextStep={NextStep} Result={profile} HandleChange={ProfileHandleChange} />
          </Tab>
          <Tab key="address" title="ที่อยู่อาศัย">
            <Step2 NextStep={NextStep} BackStep={BackStep} Result={address} HandleChange={AddressHandleChange} />
          </Tab>
          <Tab key="confirm" title="ยืนยันข้อมูล">
            <Step3 NextStep={NextStep} BackStep={BackStep} Profile={profile} Address={address} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
