import type { ProfileAdminData } from "@/types";

import { userRoles } from "@/app/admin/(app)/data/optionData";

/** อ่าน ProfileAdmin จาก sessionStorage (hydrate ก่อน SWR โหลดเสร็จ) */
export function readStoredAdminProfile(): ProfileAdminData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem("adminProfile");

    if (!raw) return null;

    return JSON.parse(raw) as ProfileAdminData;
  } catch {
    return null;
  }
}

/** ชื่อ role สำหรับแสดงใน UI */
export function getAdminRoleLabel(
  profile: Pick<ProfileAdminData, "roleId" | "roleName"> | null | undefined
): string {
  if (!profile) return "";

  const fromApi = profile.roleName?.trim();

  if (fromApi) return fromApi;

  return (
    userRoles.find((role) => role.id === Number(profile.roleId))?.name ?? ""
  );
}
