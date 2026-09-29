import { Volunteer } from "@prisma/client";

import { ProfileAdminData } from "@/types";

export const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstName: "",
  lastName: "",
  phone: "",
  affiliationId: 0,
  healthcareFacilityId: "",
  facilityUnitId: null,
  scopeLevel: "FACILITY",
  zoneId: null,
  employeeTypeId: 0,
  profession: "",
  license: "",
  status: 0,
  receiveAlert: false,
  createdAt: "",
  updatedAt: "",
  roleId: 0,
  roleName: "",
  roleCode: "",
};

export const referentInitValue: Volunteer = {
  id: 0,
  citizenId: "",
  prefixId: 0,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  volunteerTypeId: 0,
  employeeTypeId: 0,
  affiliationId: 0,
  healthcareFacilityId: "",
  facilityUnitId: null,
  status: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
