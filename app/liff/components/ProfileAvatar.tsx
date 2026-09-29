"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  addToast,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Affiliation, Volunteer, VolunteerType } from "@prisma/client";
import { useDisclosure } from "@heroui/react";

import { ReferentQRCode } from "./ReferentQRCode";

import { referentInitValue } from "@/types/initData";

const ProfileAvatar = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReferent, setIsReferent] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [referent, setReferent] = useState<Volunteer>(referentInitValue);
  const [volunteerType, setVolunteerType] = useState<VolunteerType[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [isQRCodeLoading, setIsQRCodeLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState(true);

  const {
    isOpen: isOpenQRCodeModal,
    onOpen: onOpenQRCodeModal,
    onClose: onCloseQRCodeModal,
  } = useDisclosure();

  // ตรวจสอบ referent + admin และโหลดชื่อจาก profile ในครั้งเดียว (Promise.all ลด waterfall)
  useEffect(() => {
    if (!session?.user?.id || status !== "authenticated") {
      setDisplayName(session?.user?.name ?? "");
      setIsDisplayNameLoading(false);

      return;
    }

    let cancelled = false;

    setIsDisplayNameLoading(true);

    const profileUrl = `/api/profile/user/${session.user.id}`;
    const adminUrl = `/api/profile/admin/${session.user.id}`;

    Promise.all([fetch(profileUrl), fetch(adminUrl)])
      .then(async ([profileRes, adminRes]) => {
        if (cancelled) return;
        const [profileData, adminData] = await Promise.all([
          profileRes.json(),
          adminRes.json(),
        ]);

        if (cancelled) return;
        setIsReferent(!!profileData?.referent);
        setIsAdmin(adminData !== null);

        const userProfile = profileData?.profile?.[0];

        if (userProfile?.firstName || userProfile?.lastName) {
          const fullName = `${userProfile.firstName ?? ""} ${
            userProfile.lastName ?? ""
          }`.trim();

          setDisplayName(fullName || (session?.user?.name ?? ""));
        } else if (session?.user?.name) {
          setDisplayName(session.user.name);
        } else {
          setDisplayName("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          addToast({
            title: "เกิดข้อผิดพลาด",
            description:
              "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง" + error,
            color: "danger",
          });
          setIsReferent(false);
          setIsAdmin(false);
          setDisplayName(session?.user?.name ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setIsDisplayNameLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.user?.name, status]);

  const loadVolunteerType = useCallback(async () => {
    const res = await fetch("/api/data/volunteer");

    if (!res.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลประเภทอาสาสมัครได้");
    }
    const data = await res.json();

    setVolunteerType(data);
  }, []);

  const loadAffiliation = useCallback(async () => {
    const res = await fetch("/api/data/affiliation");

    if (!res.ok) {
      throw new Error("ไม่สามารถดึงข้อมูลหน่วยงานได้");
    }
    const data = await res.json();

    setAffiliation(data);
  }, []);

  const handleOpenQRCode = useCallback(async () => {
    if (!session?.user?.id || status !== "authenticated") {
      addToast({
        title: "ไม่พบข้อมูลผู้ใช้",
        description: "กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง",
        color: "danger",
      });

      return;
    }

    setIsQRCodeLoading(true);
    try {
      const res = await fetch(`/api/profile/user/${session.user.id}`);

      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      }
      const data = await res.json();

      setReferent(data.referent);
      await Promise.all([loadAffiliation(), loadVolunteerType()]);
      onOpenQRCodeModal();
      setIsProfileMenuOpen(false);
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description:
          "ไม่สามารถโหลดข้อมูล QR Code ได้ กรุณาลองใหม่อีกครั้ง" + error,
        color: "danger",
      });
    } finally {
      setIsQRCodeLoading(false);
    }
  }, [
    session?.user?.id,
    status,
    loadAffiliation,
    loadVolunteerType,
    onOpenQRCodeModal,
    setIsProfileMenuOpen,
  ]);

  // แสดงเฉพาะเมื่อ authenticated แล้วเท่านั้น
  if (status !== "authenticated" || !session) {
    return null;
  }

  const image = (session?.user as { image?: string } | undefined)?.image;

  const initials = isDisplayNameLoading
    ? "…"
    : displayName
        .split(" ")
        .filter((part) => part.length > 0)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "TM";

  return (
    <>
      <Dropdown
        isOpen={isProfileMenuOpen}
        placement="bottom-end"
        onOpenChange={setIsProfileMenuOpen}
      >
        <DropdownTrigger>
          <button
            aria-label={
              isDisplayNameLoading
                ? "เมนูโปรไฟล์"
                : `เมนูโปรไฟล์ของ ${displayName || "ผู้ใช้"}`
            }
            className="rounded-full outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary"
            type="button"
          >
            <Avatar
              className="border border-default-200 shadow-sm"
              name={initials}
              size="sm"
              src={image}
            />
          </button>
        </DropdownTrigger>
        <DropdownMenu aria-label="เมนูโปรไฟล์" className="min-w-[200px]">
          <DropdownItem
            key="display-name"
            isReadOnly
            className="cursor-default opacity-100 data-[hover=true]:bg-transparent"
            textValue={displayName || "ผู้ใช้"}
          >
            <p className="truncate text-sm font-medium text-default-700">
              {isDisplayNameLoading ? "กำลังโหลด..." : displayName || "ผู้ใช้"}
            </p>
          </DropdownItem>
          {isAdmin ? (
            <DropdownItem key="admin" onPress={() => router.push("/admin")}>
              ไปหน้าแอดมิน
            </DropdownItem>
          ) : null}
          <DropdownItem
            key="profile"
            onPress={() => router.push("/liff/profile")}
          >
            ข้อมูลส่วนตัว
          </DropdownItem>
          {isReferent ? (
            <DropdownItem
              key="qrcode"
              closeOnSelect={false}
              isDisabled={isQRCodeLoading}
              onPress={handleOpenQRCode}
            >
              {isQRCodeLoading ? "กำลังโหลด QR Code..." : "QR Code อสท."}
            </DropdownItem>
          ) : null}
          <DropdownItem
            key="my-tests"
            onPress={() => router.push("/liff/question/list")}
          >
            แบบทดสอบของฉัน
          </DropdownItem>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            onPress={() => signOut({ callbackUrl: "/liff/auth" })}
          >
            ออกจากระบบ
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ReferentQRCode
        affiliation={affiliation}
        data={referent}
        isOpen={isOpenQRCodeModal}
        volunteerType={volunteerType}
        onClose={onCloseQRCodeModal}
      />
    </>
  );
};

export default ProfileAvatar;
