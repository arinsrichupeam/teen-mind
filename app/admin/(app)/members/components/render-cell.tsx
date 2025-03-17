"use client";

import React from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Chip } from "@heroui/react";
import { Affiliation } from "@prisma/client";

import { statusOptions } from "../data";

import { prefix } from "@/utils/data";

interface Props {
  data: any;
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
          <span>
            {prefix.find((val) => val.key == data.prefixId.toString())?.label +
              " " +
              data.firstname +
              " " +
              data.lastname}
          </span>
        </div>
      );
    case "professional":
      return (
        <div>
          <span>{data.professional}</span>
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
          <span>{data.agency}</span>
        </div>
      );
    case "role":
      return (
        <div>
          <span>
            {/* {Roles.find((x) => x.id === parseInt(data.role))?.name} */}
            {data.role[0].name}
          </span>
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
    case "actions":
      return (
        <div className="flex justify-center gap-2">
          <div>
            <Button
              isIconOnly
              name="Detail"
              size="sm"
              variant="light"
              onPress={() => viewDetail(data.userId)}
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
              onPress={() => editDetail(data.userId)}
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
      return cellValue;
  }
};
