import React from "react";
import { User } from "@heroui/user";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/react";

import { questionStatusOptions as options } from "../../data/optionData";

import { prefix } from "@/utils/data";

interface Props {
  data: any;
  columnKey: string | React.Key;
  index: number;
  viewDetail(id: string): void;
  editDetail(id: string): void;
}

export const RenderCell = ({
  data,
  columnKey,
  index,
  viewDetail,
  editDetail,
}: Props) => {
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
          <User
            avatarProps={{
              src: data.user.image as string,
            }}
            name={
              prefix.find((val) => val.key == data.user.profile[0].prefixId)
                ?.label +
              " " +
              data.user.profile[0].firstname +
              " " +
              data.user.profile[0].lastname
            }
          />
        </div>
      );
    case "age":
      return (
        <div>
          <span>{timeAgo(data.user.profile[0].birthday)}</span>
        </div>
      );
    case "school":
      return (
        <div>
          <span>{data.user.profile[0].school?.name.toString()}</span>
        </div>
      );
    case "result":
      return (
        <div>
          <Chip
            color={
              data.result === "Green"
                ? "success"
                : data.result === "Red"
                  ? "danger"
                  : "warning"
            }
            size="sm"
            variant="flat"
          >
            <span className="capitalize text-xs">{data.result_text}</span>
          </Chip>
        </div>
      );
    case "phqa":
      return (
        <div>
          <span>{data.phqa[0].sum}</span>
        </div>
      );
    case "date":
      return (
        <div>
          <span>
            {new Date(data.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      );
    case "status":
      return (
        <div>
          <span className="text-xs font-semibold">
            {options[data.status].name}
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
              onPress={() => viewDetail(data.id)}
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
              onPress={() => editDetail(data.id)}
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
