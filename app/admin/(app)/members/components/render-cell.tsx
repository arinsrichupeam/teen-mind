"use client";

import React from "react";
import {
  BellAlertIcon,
  BellIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button, Chip, User } from "@heroui/react";
import { Affiliation } from "@prisma/client";

import { userStatusOptions as statusOptions } from "../../data/optionData";

import { adminDataScopeLabel } from "@/lib/admin-data-scope";
import { prefix } from "@/utils/data";

/** แถวสมาชิกที่แสดงในตาราง (ProfileAdmin + user, role จาก API) */
interface MemberRow extends Record<string, unknown> {
  id: string;
  userId?: string;
  prefixId: number;
  firstName: string;
  lastName: string;
  professional?: string | null;
  profession?: string | null;
  affiliationId: number | null;
  agency?: string;
  healthcareFacilityId?: string | null;
  healthcareFacility?: { name?: string } | null;
  scopeLevel?: string | null;
  effectiveScopeLevel?: string | null;
  facilitatedZoneName?: string | null;
  status: number | string;
  receiveAlert: boolean;
  user?: { image: string };
  role?: { name: string };
}

interface Props {
  data: MemberRow;
  affiliationList: Affiliation[];
  columnKey: string | React.Key;
  index: number;
  viewDetail(id: string): void;
  editDetail(id: string): void;
}

export const RenderCell = ({
  data,
  affiliationList,
  columnKey,
  index,
  viewDetail,
  editDetail,
}: Props) => {
  const affiliationData = affiliationList;

  const cellValue = data[columnKey.toString()];

  switch (columnKey) {
    case "id":
      return (
        <div>
          <span>{index}</span>
        </div>
      );
    case "name":
      return (
        <div>
          <User
            avatarProps={{
              src: (data.user?.image as string) ?? "",
            }}
            name={
              prefix.find((val) => val.key == data.prefixId.toString())?.label +
              " " +
              data.firstName +
              " " +
              data.lastName
            }
          />
        </div>
      );
    case "professional":
      return (
        <div>
          <span>{data.profession ?? data.professional ?? ""}</span>
        </div>
      );
    case "affiliation":
      return (
        <div>
          <span>
            {affiliationData.find((x) => x.id === data.affiliationId)?.name}
          </span>
        </div>
      );
    case "agency":
      return (
        <div>
          <span>{data.healthcareFacility?.name ?? data.agency ?? ""}</span>
        </div>
      );
    case "scope": {
      const effective = data.effectiveScopeLevel ?? data.scopeLevel;
      const isMaeZone =
        effective === "ZONE" &&
        data.scopeLevel === "FACILITY" &&
        Boolean(data.facilitatedZoneName);

      return (
        <div className="flex flex-col items-center gap-0.5">
          <Chip color="primary" size="sm" variant="flat">
            <span className="text-xs font-semibold">
              {adminDataScopeLabel(effective)}
            </span>
          </Chip>
          {isMaeZone ? (
            <span className="text-[10px] text-default-400">
              แม่ {data.facilitatedZoneName}
            </span>
          ) : null}
        </div>
      );
    }
    case "role":
      return (
        <div>
          <span>{data.role?.name ?? ""}</span>
        </div>
      );
    case "status":
      return (
        <div>
          <Chip
            color={
              cellValue == "1"
                ? "success"
                : cellValue == "2"
                  ? "danger"
                  : "warning"
            }
            size="sm"
            variant="flat"
          >
            <span className="text-xs font-semibold">
              {
                statusOptions.find((x) => x.uid === data.status.toString())
                  ?.name
              }
            </span>
          </Chip>
        </div>
      );
    case "alert":
      return (
        <div className="flex justify-center">
          <span>
            {data.receiveAlert ? (
              <BellAlertIcon className="size-6 text-red-500" />
            ) : (
              <BellIcon className="size-6 text-gray-400" />
            )}
          </span>
        </div>
      );
    case "actions":
      return (
        <div className="flex justify-center gap-2">
          <div>
            <Button
              isIconOnly
              name="Detail"
              size="sm"
              variant="light"
              onPress={() => viewDetail(String(data.userId ?? data.id))}
            >
              <EyeIcon className="size-6 text-primary-400" />
            </Button>
          </div>
          <div>
            <Button
              isIconOnly
              name="Edit"
              size="sm"
              variant="light"
              onPress={() => editDetail(String(data.userId ?? data.id))}
            >
              <PencilIcon className="size-6 text-warning-400" />
            </Button>
          </div>
          <div>
            <Button isIconOnly size="sm" variant="light">
              <TrashIcon className="size-6 text-danger-500" />
            </Button>
          </div>
        </div>
      );
    default:
      return cellValue != null ? String(cellValue) : null;
  }
};
