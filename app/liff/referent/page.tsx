"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Suspense, useCallback, useState } from "react";
import { useDisclosure } from "@heroui/react";
import { Affiliation, Referent, Volunteer_Type } from "@prisma/client";
import { useSession } from "next-auth/react";

import { ReferentQRCodeModal } from "../register/referent/components";

import Loading from "@/app/loading";
import { referentInitValue } from "@/types/initData";

export default function QuestionPage() {
  const router = useRouter();
  const [referent, setReferent] = useState<Referent>(referentInitValue);
  const [volunteerType, setvolunteerType] = useState<Volunteer_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState({
    privacy: false,
    qrcode: false,
    list: false,
  });
  const { data: session } = useSession();
  const {
    isOpen: isOpenModal4,
    onOpen: onOpenModal4,
    onClose: onCloseModal4,
  } = useDisclosure();

  const GotoList = async () => {
    setIsLoading((prev) => ({ ...prev, list: true }));
    try {
      await router.push("/liff/question/list");
    } finally {
      setIsLoading((prev) => ({ ...prev, list: false }));
    }
  };

  const GotoPrivacy = async () => {
    setIsLoading((prev) => ({ ...prev, privacy: true }));
    try {
      await router.push("/liff/privacy");
    } finally {
      setIsLoading((prev) => ({ ...prev, privacy: false }));
    }
  };

  const GetvolunteerType = useCallback(async () => {
    await fetch("/api/data/volunteer")
      .then((res) => res.json())
      .then((data) => {
        setvolunteerType(data);
      });
  }, [volunteerType]);

  const GetAffiliation = useCallback(async () => {
    await fetch("/api/data/affiliation")
      .then((res) => res.json())
      .then((data) => {
        setAffiliation(data);
      });
  }, [affiliation]);

  const GetReferentQRCode = async () => {
    setIsLoading((prev) => ({ ...prev, qrcode: true }));
    try {
      const data = await fetch("/api/profile/user/" + session?.user?.id).then(
        (res) => res.json()
      );

      setReferent(data.referent);
      await GetAffiliation();
      await GetvolunteerType();
      onOpenModal4();
    } finally {
      setIsLoading((prev) => ({ ...prev, qrcode: false }));
    }
  };

  return (
    <section className="flex flex-col w-screen min-h-[calc(100vh-48px)] px-8 items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center gap-5 pt-10 pb-0">
          <Image
            alt="app logo"
            className="h-[calc(5vh)]"
            loading="lazy"
            src="../image/Logo_App.png"
          />
          <Button
            className="w-40"
            color="primary"
            isLoading={isLoading.privacy}
            onPress={GotoPrivacy}
          >
            เพิ่มแบบทดสอบ
          </Button>
          <Button
            className="w-40"
            color="primary"
            isLoading={isLoading.qrcode}
            onPress={GetReferentQRCode}
          >
            แสดง QR Code
          </Button>
          <Button
            className="w-40"
            color="primary"
            isLoading={isLoading.list}
            onPress={GotoList}
          >
            แบบทดสอบของฉัน
          </Button>
        </div>
        <ReferentQRCodeModal
          affiliation={affiliation}
          data={referent}
          isOpen={isOpenModal4}
          volunteerType={volunteerType}
          onClose={onCloseModal4}
        />
      </Suspense>
    </section>
  );
}
