"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import Loading from "@/app/loading";

type LookupProfile = {
  id: string;
  firstname: string;
  lastname: string;
  birthday: string;
};

type LookupResult =
  | { status: "not_found" }
  | {
      status: "found";
      referentId: number;
      profile: LookupProfile;
    }
  | { status: "has_line"; message: string };

export default function ReferentLookupPage() {
  const router = useRouter();
  const [citizenId, setCitizenId] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [foundProfile, setFoundProfile] = useState<{
    profile: LookupProfile;
    referentId: number;
  } | null>(null);

  const {
    isOpen: isNotFoundOpen,
    onOpen: onNotFoundOpen,
    onOpenChange: onNotFoundOpenChange,
  } = useDisclosure();

  const {
    isOpen: isHasLineOpen,
    onOpen: onHasLineOpen,
    onOpenChange: onHasLineOpenChange,
  } = useDisclosure();

  const handleCitizenIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!/^\d*$/.test(value)) {
        return;
      }

      setCitizenId(value);
      setError("");
      setLookupResult(null);
      setFoundProfile(null);
    },
    []
  );

  const handleSearch = useCallback(async () => {
    if (citizenId.length !== 13) {
      setError("กรุณากรอกเลขบัตรประชาชน 13 หลัก");

      return;
    }

    setIsSearching(true);
    setError("");
    setLookupResult(null);
    setFoundProfile(null);

    try {
      const response = await fetch("/api/profile/lookup-by-citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId }),
        credentials: "include",
      });

      const data = (await response.json()) as LookupResult & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาดในการค้นหา");

        return;
      }

      setLookupResult(data);

      if (data.status === "not_found") {
        onNotFoundOpen();
      } else if (data.status === "has_line") {
        onHasLineOpen();
      } else if (data.status === "found") {
        setFoundProfile({
          profile: data.profile,
          referentId: data.referentId,
        });
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSearching(false);
    }
  }, [citizenId, onHasLineOpen, onNotFoundOpen]);

  const handleStartAssessment = useCallback(async () => {
    if (!foundProfile) {
      return;
    }

    const params = new URLSearchParams({
      ref: String(foundProfile.referentId),
      profileId: foundProfile.profile.id,
    });

    await router.push(`/liff/question/phqa?${params.toString()}`);
  }, [foundProfile, router]);

  const gotoRegister = useCallback(async () => {
    setIsRegisterLoading(true);
    try {
      await router.push("/liff/privacy?referent=1");
    } finally {
      setIsRegisterLoading(false);
    }
  }, [router]);

  const hasLineMessage =
    lookupResult?.status === "has_line" ? lookupResult.message : "";

  return (
    <section className="flex flex-col w-screen min-h-[calc(100vh-48px)] px-8 items-center justify-center gap-4 bg-[url(/image/BG_TEEN_MIND_2.jpg)] bg-cover bg-center bg-no-repeat">
      <Suspense fallback={<Loading />}>
        <div className="flex flex-col items-center gap-5 pt-10 pb-6 w-full max-w-sm">
          <Image
            alt="app logo"
            className="h-[calc(5vh)]"
            loading="eager"
            src="/image/logo_App.png"
          />

          <Card className="w-full bg-white/95 shadow-lg backdrop-blur-sm border border-white/80">
            <CardBody className="flex flex-col items-center gap-4 py-6 px-5">
              <p className="text-sm text-center text-default-700">
                กรอกเลขบัตรประชาชนของผู้รับการประเมิน
              </p>

              <Input
                className="w-full"
                errorMessage={error}
                isInvalid={!!error}
                label="เลขบัตรประชาชน"
                labelPlacement="inside"
                maxLength={13}
                placeholder="เลขบัตรประชาชน"
                radius="md"
                size="sm"
                type="text"
                value={citizenId}
                variant="faded"
                onChange={handleCitizenIdChange}
              />

              <Button
                className="w-40"
                color="primary"
                isDisabled={citizenId.length !== 13}
                isLoading={isSearching}
                onPress={handleSearch}
              >
                ค้นหา
              </Button>

              {foundProfile ? (
                <>
                  <p className="text-sm text-center text-default-700">
                    พบข้อมูล: {foundProfile.profile.firstname}{" "}
                    {foundProfile.profile.lastname}
                  </p>
                  <Button
                    className="w-40"
                    color="primary"
                    onPress={handleStartAssessment}
                  >
                    ทำแบบประเมิน
                  </Button>
                </>
              ) : null}

              {!foundProfile ? (
                <Button
                  className="w-40"
                  color="primary"
                  isLoading={isRegisterLoading}
                  onPress={gotoRegister}
                >
                  ลงทะเบียนใหม่
                </Button>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <Modal
          isOpen={isNotFoundOpen}
          placement="center"
          size="sm"
          onOpenChange={onNotFoundOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>ไม่พบข้อมูลในระบบ</ModalHeader>
                <ModalBody>
                  <p className="text-sm text-default-600">
                    ไม่พบผู้รับการประเมินที่มีเลขบัตรประชาชนนี้
                    กรุณาลงทะเบียนผู้รับการประเมินใหม่
                  </p>
                </ModalBody>
                <ModalFooter className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    color="primary"
                    radius="full"
                    onPress={() => {
                      onClose();
                      void gotoRegister();
                    }}
                  >
                    ลงทะเบียนใหม่
                  </Button>
                  <Button
                    className="w-full"
                    radius="full"
                    variant="light"
                    onPress={onClose}
                  >
                    ปิด
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isHasLineOpen}
          placement="center"
          size="sm"
          onOpenChange={onHasLineOpenChange}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>ไม่สามารถเพิ่มแบบประเมินได้</ModalHeader>
                <ModalBody>
                  <p className="text-sm text-default-600">{hasLineMessage}</p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    className="w-full"
                    color="primary"
                    radius="full"
                    onPress={onClose}
                  >
                    เข้าใจแล้ว
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </Suspense>
    </section>
  );
}
