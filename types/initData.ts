import { Referent } from "@prisma/client";

import { ProfileAdminData } from "@/types";

export const ProfileAdminDataInitData: ProfileAdminData = {
  id: "",
  userId: "",
  providerAccountId: "",
  image: "",
  name: "",
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  tel: "",
  affiliationId: 0,
  agency: "",
  employeeTypeId: 0,
  professional: "",
  license: "",
  status: 0,
  alert: false,
  createdAt: "",
  updatedAt: "",
  roleId: 0,
};

export const referentInitValue: Referent = {
  id: 0,
  citizenId: "",
  prefixId: 0,
  firstname: "",
  lastname: "",
  email: "",
  tel: "",
  volunteer_type_id: 0,
  employee_type_id: 0,
  affiliation_id: 0,
  agency: "",
  status: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
