"use client";

import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Loading from "../loading";

export default function LiffHome() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const checkProfile = async (id: string) => {
    await fetch(`/api/profile/user/${id}`).then((res) =>
      res.json().then((val) => {
        if (val === null) {
          signOut();
        } else if (val.profile?.length === 0) {
          // send to register
          router.push("/liff/privacy");
        } else {
          if (val.isReferent) {
            router.push("/liff/referent");
          } else {
            if (val.questions?.length === 0) {
              router.push("/liff/question");
            } else {
              router.push("/liff/question/list");
            }
          }
        }
      })
    );
  };

  useEffect(() => {
    if (status !== "loading") {
      if (status === "unauthenticated") {
        signIn();
      } else {
        checkProfile(session?.user?.id as string);
      }
    }
<<<<<<< HEAD
  }, [status]);
=======
  }, [session, router]);
<<<<<<< HEAD
>>>>>>> 8363a4a (ปรับปรุงการจัดการการตรวจสอบโปรไฟล์ในฟังก์ชัน LiffHome โดยเพิ่มการตรวจสอบ session ใน useEffect เพื่อให้การทำงานมีความถูกต้องและมีประสิทธิภาพมากขึ้น)
=======
>>>>>>> ca1cc6bdbc074119eb62f1d3398b0a9332463798
>>>>>>> d90d159b6cecbe508d9b1847abea9cf5bf6958c5

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] w-screen">
      <Loading />
    </div>
  );
}
