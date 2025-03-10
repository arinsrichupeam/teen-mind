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
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Roles } from "@prisma/client";

import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";

import { Sidebar } from "@/components/primitives";
import { useSidebarContext } from "@/app/admin/(app)/layout-context";
import { siteConfig } from "@/config/site";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { data: session, status } = useSession();
  const [role, setRole] = useState<Roles>();

  useEffect(() => {
    if (status !== "loading" && status === "authenticated") {
      fetch("/api/profile/admin/" + session.user?.id)
        .then((res) => res.json())
        .then((val) => {
          setRole(val.profile_admin[0].role[0]);
        });
    }
  }, [session]);

  return (
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
            <SidebarItem
              href="/admin"
              icon={<HomeIcon className="size-6" />}
              isActive={pathname === "/admin"}
              title="หน้าหลัก"
            />
            <SidebarMenu title="Main Menu">
              <SidebarItem
                href="/admin/question"
                icon={<ClipboardDocumentCheckIcon className="size-6" />}
                isActive={pathname === "/admin/question"}
                title="แบบสอบถาม"
              />
              <SidebarItem
                href="#"
                icon={<UserIcon className="size-6" />}
                isActive={pathname === "/admin/case"}
                title="เคสที่ดูแล"
              />
            </SidebarMenu>
            {role?.name === "Admin" ? (
              <SidebarMenu title="Admin Menu">
                <SidebarItem
                  href="/admin/members"
                  icon={<UserGroupIcon className="size-6" />}
                  isActive={pathname === "/admin/members"}
                  title="จัดการสมาชิก"
                />
                <SidebarItem
                  href="/admin/school"
                  icon={<HomeModernIcon className="size-6" />}
                  isActive={pathname === "/admin/school"}
                  title="รายชื่อโรงเรียน"
                />
                <SidebarItem
                  icon={<CreditCardIcon className="size-6" />}
                  isActive={pathname === "/admin/emergency"}
                  title="รายชื่อผู้รับเคสฉุกเฉิน"
                />
                <SidebarItem
                  icon={<MapIcon className="size-6" />}
                  isActive={pathname === "/admin/area"}
                  title="พื้นที่อยู่อาศัย"
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
  );
};
