import { usePathname } from "next/navigation";
import {
  ChartBarIcon,
  CreditCardIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";

import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";

import { Sidebar } from "@/components/primitives";
import { useSidebarContext } from "@/app/admin/(app)/layout/layout-context";
import { siteConfig } from "@/config/site";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();

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
              icon={<ChartBarIcon className="size-6" />}
              isActive={pathname === "/admin"}
              title="หน้าหลัก"
            />
            <SidebarMenu title="Main Menu">
              <SidebarItem
                href="/admin/accounts"
                icon={<UserIcon className="size-6" />}
                isActive={pathname === "/admin/accounts"}
                title="แบบสอบถาม"
              />
              <SidebarItem
                href="/admin/accounts"
                icon={<UserIcon className="size-6" />}
                isActive={pathname === "/admin/accounts"}
                title="เคสที่ดูแล"
              />
              {/* <SidebarItem
                icon={<CreditCardIcon className="size-6" />}
                isActive={pathname === "/payments"}
                title="Payments"
              />
              <CollapseItems
                icon={<ChevronDownIcon className="size-6" />}
                items={["Banks Accounts", "Credit Cards", "Loans"]}
                title="Balances"
              />
              <SidebarItem
                icon={<UserGroupIcon className="size-6" />}
                isActive={pathname === "/customers"}
                title="Customers"
              /> */}
            </SidebarMenu>
            <SidebarMenu title="Admin Menu">
              <SidebarItem
                href="/admin/accounts"
                icon={<UserGroupIcon className="size-6" />}
                isActive={pathname === "/admin/accounts"}
                title="จัดการสมาชิก"
              />
              <SidebarItem
                href="/admin/accounts"
                icon={<UserGroupIcon className="size-6" />}
                isActive={pathname === "/admin/accounts"}
                title="รายชื่อโรงเรียน"
              />
              <SidebarItem
                icon={<CreditCardIcon className="size-6" />}
                isActive={pathname === "/payments"}
                title="รายชื่อผู้รับเคสฉุกเฉิน"
              />
              {/*<CollapseItems
                icon={<ChevronDownIcon className="size-6" />}
                items={["Banks Accounts", "Credit Cards", "Loans"]}
                title="Balances"
              />*/}
              <SidebarItem
                icon={<UserGroupIcon className="size-6" />}
                isActive={pathname === "/customers"}
                title="พื้นที่อยู่อาศัย"
              />
            </SidebarMenu>
            {/* <SidebarMenu title="General">
              <SidebarItem
                isActive={pathname === "/developers"}
                title="Developers"
              // icon={<DevIcon />}
              />
              <SidebarItem
                isActive={pathname === "/view"}
                title="View Test Data"
              // icon={<ViewIcon />}
              />
              <SidebarItem
                isActive={pathname === "/settings"}
                title="Settings"
              // icon={<SettingsIcon />}
              />
            </SidebarMenu>

            <SidebarMenu title="Updates">
              <SidebarItem
                isActive={pathname === "/changelog"}
                title="Changelog"
              // icon={<ChangeLogIcon />}
              />
            </SidebarMenu> */}
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
