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
import { Affiliation, Referent, Volunteer_Type } from "@prisma/client";
import { useDisclosure } from "@heroui/react";

import { ReferentQRCode } from "./ReferentQRCode";

import { referentInitValue } from "@/types/initData";

const ProfileAvatar = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReferent, setIsReferent] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [referent, setReferent] = useState<Referent>(referentInitValue);
  const [volunteerType, setVolunteerType] = useState<Volunteer_Type[]>([]);
  const [affiliation, setAffiliation] = useState<Affiliation[]>([]);
  const [isQRCodeLoading, setIsQRCodeLoading] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>("ผู้ใช้");

  const {
    isOpen: isOpenQRCodeModal,
    onOpen: onOpenQRCodeModal,
    onClose: onCloseQRCodeModal,
  } = useDisclosure();

  // ตรวจสอบว่าผู้ใช้เป็น referent หรือไม่ และโหลดชื่อจาก profile
  useEffect(() => {
    const checkReferentStatus = async () => {
      if (!session?.user?.id || status !== "authenticated") return;

      try {
        const response = await fetch(`/api/profile/user/${session.user.id}`);
        const data = await response.json();

        setIsReferent(!!data?.referent);

        const userProfile = data?.profile?.[0];

        if (userProfile?.firstname || userProfile?.lastname) {
          const fullName = `${userProfile.firstname ?? ""} ${
            userProfile.lastname ?? ""
          }`.trim();

          if (fullName) {
            setDisplayName(fullName);
          }
        } else if (session?.user?.name) {
          setDisplayName(session.user.name);
        }
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง" + error,
          color: "danger",
        });
        setIsReferent(false);
      }
    };

    checkReferentStatus();
  }, [session?.user?.id, session?.user?.name, status]);

  // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.id || status !== "authenticated") return;

      try {
        const response = await fetch(`/api/profile/admin/${session.user.id}`);
        const data = await response.json();

        setIsAdmin(data !== null);
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง" + error,
          color: "danger",
        });
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [session?.user?.id, status]);

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

  const initials =
    displayName
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
            className="flex items-center gap-2 rounded-full px-2 py-1 bg-white/60 hover:bg-white/90 shadow-sm"
            type="button"
          >
            <Avatar
              className="border border-default-200"
              name={initials}
              size="sm"
              src={image}
            />
            <span className="text-xs text-default-700 max-w-[140px] truncate">
              {displayName}
            </span>
          </button>
        </DropdownTrigger>
        <DropdownMenu aria-label="เมนูโปรไฟล์" className="min-w-[200px]">
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
