"use client"

import { title } from "@/components/primitives";
import { Tabs, Tab } from "@nextui-org/tabs";
import { Progress } from "@nextui-org/progress";

import { Step1 } from "./components/step1";
import { Step2 } from "./components/step2";
import { useEffect, useState } from "react";
import { Address, Profile } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Register } from "@/types/register";

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
  houseNo: "78/350",
  villageNo: "",
  soi: "เพชรเกษม 106",
  road: "เพชรเกษม",
  province: 1,
  district: 1023,
  subdistrict: 102303
}

const RegisterInitValue = {
  register_profile: profileInitValue,
  register_address: addressInitValue
}

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const [selected, setSelected] = useState("profile");
  const [progress, setProgress] = useState(50);

  // const [register, setRegister] = useState<Register>(RegisterInitValue);
  const [profile, setProfile] = useState<Profile>(profileInitValue);
  const [address, setAddress] = useState<Address>(addressInitValue);

  const NextStep = async (val: any) => {
    if (val === "Profile") {
      setSelected("address");
      setProgress(100);
    }
    else if (val === "Address") {
      // console.log(profile, address);

      await fetch("/api/register", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ register_profile: profile, register_address: address })
      }).then((res) => {
        if (res.status === 200) {
          console.log("Success");
        }
      });

      // console.log(register);

      // Save to DB
      console.log("Save to DB");
    }
  }

  const BackStep = () => {
    setSelected("profile");
    setProgress(50);
  }

  const ProfileHandleChange = (e: any) => {
    if (e.target.name === "birthday") {
      setProfile((prev) => ({
        ...prev,
        birthday: e.target.value,
      }));
      // setRegister((prev) => ({
      //   ...prev,
      //   register_profile: profile
      // }));
    }
    else if (e.target.name === "citizenId") {
      const val = e.target.value;
      if (val.length <= 13) {
        setProfile((prev) => ({
          ...prev,
          [e.target.name]: e.target.value,
        }));
        // setRegister((prev) => ({
        //   ...prev,
        //   register_profile: profile
        // }));
      }
    }
    else {
      setProfile((prev) => ({
        ...prev,
        [e.target.name]: e.target.value,
      }));
      // setRegister((prev) => ({
      //   ...prev,
      //   register_profile: profile
      // }));
    }
  }

  const AddressHandleChange = (e: any) => {
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // setRegister((prev) => ({
    //   ...prev,
    //   register_address: address
    // }));
  }

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      setProfile((prev) => ({
        ...prev,
        userId: session?.user?.id as string,
      }));
      // setRegister((prev) => ({
      //   ...prev,
      //   register_profile: profile
      // }));
    }
  }, [session]);

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <Progress aria-label="Loading..." size="md" value={progress} />
      <h1 className={title()}>ลงทะเบียน</h1>
      <div className="flex w-full flex-col">
        <Tabs aria-label="Options" selectedKey={selected}>
          <Tab key="profile" title="ข้อมูลส่วนตัว">
            <Step1 NextStep={NextStep} Result={profile} HandleChange={ProfileHandleChange} />
          </Tab>
          <Tab key="address" title="ที่อยู่อาศัย">
            <Step2 NextStep={NextStep} BackStep={BackStep} Result={address} HandleChange={AddressHandleChange} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
