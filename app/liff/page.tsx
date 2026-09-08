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
        } else if (!val.profile?.length) {
          // send to register
          router.push("/liff/privacy");
        } else {
          if (!val.questions?.length) {
            router.push("/liff/question");
          } else {
            router.push("/liff/question/list");
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
  }, [status]);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] w-screen">
      <Loading />
    </div>
  );
}
