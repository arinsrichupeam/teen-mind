import { usePathname } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  HomeIcon,
  HomeModernIcon,
  MapIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { Suspense, useEffect, useState } from "react";
import { CalculatorIcon } from "@heroicons/react/24/outline";

import { ProfileAdminDataInitData } from "../../../../../types/initData";

import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";

import { Sidebar } from "@/components/primitives";
import { useSidebarContext } from "@/app/admin/(app)/layout-context";
import { siteConfig } from "@/config/site";
import Loading from "@/app/loading";
import { ProfileAdminData } from "@/types";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();
  const [profile, setProfile] = useState<ProfileAdminData>(
    ProfileAdminDataInitData
  );

  useEffect(() => {
    GetProfile();
  }, [sessionStorage]);

  const GetProfile = async () => {
    const data = sessionStorage.getItem("adminProfile");

    if (data) {
      setProfile(JSON.parse(data));
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <aside className="h-screen z-[20] sticky top-0">
        {collapsed ? (
          <Button className={Sidebar.Overlay()} onPress={setCollapsed} />
        ) : null}
        <div
          className={Sidebar({
            collapsed: collapsed,
          })}
        >
          <div className={Sidebar.Header()}>
            <Image src="/image/logo_App.png" />
          </div>
          <div className="flex flex-col justify-between h-full">
            <div className={Sidebar.Body()}>
              {profile.roleId === 2 ? (
                <SidebarMenu title="Referent Menu">
                  <SidebarItem
                    href="/referent/question"
                    icon={<ClipboardDocumentCheckIcon className="size-6" />}
                    isActive={pathname === "/referent/question"}
                    title="แบบสอบถาม"
                  />
                </SidebarMenu>
              ) : (
                <SidebarMenu title="Main Menu">
                  <SidebarItem
                    href="/admin"
                    icon={<HomeIcon className="size-6" />}
                    isActive={pathname === "/admin"}
                    title="หน้าหลัก"
                  />
                  <SidebarItem
                    href="/admin/question"
                    icon={<ClipboardDocumentCheckIcon className="size-6" />}
                    isActive={pathname === "/admin/question"}
                    title="แบบสอบถาม"
                  />
                  <SidebarItem
                    href="/admin/mycase"
                    icon={<UserIcon className="size-6" />}
                    isActive={pathname === "/admin/mycase"}
                    title="เคสที่ดูแล"
                  />
                </SidebarMenu>
              )}

              {profile.roleId === 4 ? (
                <SidebarMenu title="Admin Menu">
                  <SidebarItem
                    href="/admin/members"
                    icon={<UserGroupIcon className="size-6" />}
                    isActive={pathname === "/admin/members"}
                    title="ผู้ใช้งาน (Admin)"
                  />
                  <SidebarItem
                    href="/admin/user"
                    icon={<UserGroupIcon className="size-6" />}
                    isActive={pathname === "/admin/user"}
                    title="ผู้ใช้งาน (User)"
                  />
                  <SidebarItem
                    href="/admin/school"
                    icon={<HomeModernIcon className="size-6" />}
                    isActive={pathname === "/admin/school"}
                    title="รายชื่อโรงเรียน"
                  />
                  <SidebarItem
                    href="/admin/volunteer"
                    icon={<CreditCardIcon className="size-6" />}
                    isActive={pathname === "/admin/volunteer"}
                    title="รายชื่อ อสท."
                  />
                  <SidebarItem
                    icon={<MapIcon className="size-6" />}
                    isActive={pathname === "/admin/area"}
                    title="พื้นที่อยู่อาศัย"
                  />
                  <SidebarItem
                    icon={<CalculatorIcon className="size-6" />}
                    isActive={pathname === "/admin/recalculate-phqa"}
                    title="คำนวณคะแนน PHQA"
                  />
                </SidebarMenu>
              ) : (
                <></>
              )}
            </div>
            <div className={Sidebar.Footer()}>
              <Link
                isExternal
                className="flex flex-col items-center gap-1 text-sm"
                href={siteConfig.links.rpp}
                title="heroui.com homepage"
              >
                <span className="text-default-600">Powered by</span>
                <p className="text-primary">โรงพยาบาลราชพิพัฒน์</p>
                <p className="text-primary">(ฝ่ายวิชาการ)</p>
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </Suspense>
  );
};
