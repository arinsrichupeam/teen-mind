import { usePathname } from "next/navigation";
import {
  ChartPieIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  HomeIcon,
  HomeModernIcon,
  MapIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Suspense, useEffect, useState } from "react";
import clsx from "clsx";

import { ProfileAdminDataInitData } from "../../../../../types/initData";
import packageJson from "../../../../../package.json";

import { PatchNotesModal } from "./patch-notes-modal";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";

import { Sidebar } from "@/components/primitives";
import { useSidebarContext } from "@/app/admin/(app)/layout-context";
import { siteConfig } from "@/config/site";
import Loading from "@/app/loading";
import { ProfileAdminData } from "@/types";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { mobileOpen, toggleMobile, collapsed, toggleCollapsed } =
    useSidebarContext();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
        {mobileOpen ? (
          <Button className={Sidebar.Overlay()} onPress={toggleMobile} />
        ) : null}
        <div
          className={Sidebar({
            mobileOpen,
            collapsed,
          })}
        >
          <div className={Sidebar.Header({ collapsed })}>
            <Image
              alt="BKK Mind"
              className={clsx(
                "h-10 w-auto object-contain",
                collapsed && "md:hidden"
              )}
              src="/image/bkk-mind-logo.png"
            />
            <Button
              isIconOnly
              aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
              className="hidden md:flex shrink-0"
              size="sm"
              variant="light"
              onPress={toggleCollapsed}
            >
              {collapsed ? (
                <ChevronDoubleRightIcon className="size-5" />
              ) : (
                <ChevronDoubleLeftIcon className="size-5" />
              )}
            </Button>
          </div>
          <div className="flex flex-col justify-between h-full">
            <div className={Sidebar.Body({ collapsed })}>
              {/* Main Menu - แสดงสำหรับทุก role */}
              <SidebarMenu title="Main Menu">
                <SidebarItem
                  href="/admin"
                  icon={<HomeIcon className="size-6 shrink-0" />}
                  isActive={pathname === "/admin"}
                  title="หน้าหลัก"
                />
                <SidebarItem
                  href="/admin/dashboard-productivity"
                  icon={<ChartPieIcon className="size-6 shrink-0" />}
                  isActive={pathname === "/admin/dashboard-productivity"}
                  title="ประสิทธิภาพการทำงาน"
                />
                {(profile.roleId === 3 || profile.roleId === 4) && (
                  <SidebarItem
                    href="/admin/question"
                    icon={
                      <ClipboardDocumentCheckIcon className="size-6 shrink-0" />
                    }
                    isActive={pathname === "/admin/question"}
                    title="เคส"
                  />
                )}
                {(profile.roleId === 3 || profile.roleId === 4) && (
                  <SidebarItem
                    href="/admin/mycase"
                    icon={<UserIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/mycase"}
                    title="เคสที่ดูแล"
                  />
                )}
                <SidebarItem
                  href="/admin/map"
                  icon={<MapIcon className="size-6 shrink-0" />}
                  isActive={pathname === "/admin/map"}
                  title="แผนที่"
                />
                {profile.roleId === 4 && (
                  <SidebarItem
                    href="/admin/report"
                    icon={<DocumentChartBarIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/report"}
                    title="รายงาน"
                  />
                )}
                {(profile.roleId === 2 || profile.roleId === 3) && (
                  <SidebarItem
                    href="/admin/user"
                    icon={<UserGroupIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/user"}
                    title="ผู้ใช้งาน (User)"
                  />
                )}
              </SidebarMenu>

              {/* Admin Menu - แสดงเฉพาะ role 4 */}
              {profile.roleId === 4 && (
                <SidebarMenu title="Admin Menu">
                  <SidebarItem
                    href="/admin/members"
                    icon={<UserGroupIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/members"}
                    title="ผู้ใช้งาน (Admin)"
                  />
                  <SidebarItem
                    href="/admin/user"
                    icon={<UserGroupIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/user"}
                    title="ผู้ใช้งาน (User)"
                  />
                  <SidebarItem
                    href="/admin/school"
                    icon={<HomeModernIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/school"}
                    title="รายชื่อโรงเรียน"
                  />
                  <SidebarItem
                    href="/admin/volunteer"
                    icon={<CreditCardIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/volunteer"}
                    title="รายชื่อ อสท."
                  />
                  <SidebarItem
                    href="/admin/org"
                    icon={<MapIcon className="size-6 shrink-0" />}
                    isActive={pathname === "/admin/org"}
                    title="สังกัด / Zone / หน่วยงาน"
                  />
                  {/* <SidebarItem
                    href="/admin/recalculate-phqa"
                    icon={<CalculatorIcon className="size-6" />}
                    isActive={pathname === "/admin/recalculate-phqa"}
                    title="Re-calculate"
                  /> */}
                </SidebarMenu>
              )}
            </div>
            <div className={Sidebar.Footer({ collapsed })}>
              <div
                className={clsx(
                  "flex flex-col items-center gap-1 text-sm",
                  collapsed && "md:hidden"
                )}
              >
                <Link
                  isExternal
                  className="flex flex-col items-center gap-1"
                  href={siteConfig.links.rpp}
                  title="RPP hospital homepage"
                >
                  <span className="text-default-600">Powered by</span>
                  <p className="text-primary">โรงพยาบาลราชพิพัฒน์</p>
                  <p className="text-primary">(ฝ่ายวิชาการ)</p>
                </Link>
                <Button
                  className="min-w-0 h-auto px-0 text-primary"
                  variant="light"
                  onPress={onOpen}
                >
                  v{packageJson.version}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <PatchNotesModal isOpen={isOpen} onOpenChange={onOpenChange} />
      </aside>
    </Suspense>
  );
};
