"use client";

import React from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import { Button, Chip } from "@heroui/react";
import { Affiliation } from "@prisma/client";

import { statusOptions } from "../data";

import { prefix } from "@/types";

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

  function timeAgo(date: string) {
    moment.updateLocale("th", {
      relativeTime: {
        future: "in %s",
        past: "%s",
        s: (number) => number + "s ago",
        ss: "%ds ago",
        m: "1m ago",
        mm: "%dm ago",
        h: "1h ago",
        hh: "%dh ago",
        d: "1d ago",
        dd: "%dd ago",
        M: "a month ago",
        MM: "%d months ago",
        y: "a year ago",
        yy: "%d ปี",
      },
    });

    return moment(date).fromNow();
  }

  // @ts-ignore
  const cellValue = data[columnKey];

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
