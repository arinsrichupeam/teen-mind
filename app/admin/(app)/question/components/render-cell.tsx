import React from "react";
import { User } from "@heroui/user";
import { Tooltip } from "@heroui/tooltip";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import moment from "moment";
import { Chip } from "@heroui/chip";

import { statusOptions } from "../data";

import { prefix } from "@/types";

interface Props {
  data: any;
  columnKey: string | React.Key;
  index: number;
  selectKey(id: String): void;
}

export const RenderCell = ({ data, columnKey, index, selectKey }: Props) => {
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
        // <User
        //   avatarProps={{
        //     src: data.User.image as string,
        //   }}
        //   name={
        //     prefix.find((val) => val.key == data.User.profile[0].prefix)
        //       ?.label +
        //     " " +
        //     data.User.profile[0].firstname +
        //     " " +
        //     data.User.profile[0].lastname
        //   }
        // />
        <></>
      );
    case "age":
      return (
        <div>
          {/* <span>{timeAgo(data.User.profile[0].birthday)}</span> */}
        </div>
      );
    case "school":
      return (
        <div>
          {/* <span>{data.User.profile[0].school?.name.toString()}</span> */}
        </div>
      );
    case "result":
      return (
        // <Chip
        //   color={
        //     data.result === "Green"
        //       ? "success"
        //       : data.result === "Red"
        //         ? "danger"
        //         : "warning"
        //   }
        //   size="sm"
        //   variant="flat"
        // >
        //   <span className="capitalize text-xs">{data.result}</span>
        // </Chip>
        <></>
      );
    case "phqa":
      return (
        // <span>{data.phqa[0].sum}</span>
        <></>
      );
    case "date":
      return (
        <div>
          {/* <span>
            {new Date(data.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span> */}
        </div>
      );
    case "status":
      return (
        // <span className="text-xs font-semibold">
        //   {statusOptions[data.status].name}
        // </span>
        <></>
      );
    case "actions":
      return (
        <div className="flex gap-4">
          {/* <div>
            <Tooltip content="Details">
              <button onClick={() => selectKey(data.id)}>
                <EyeIcon className="size-6 text-primary-400" />
              </button>
            </Tooltip>
          </div>
          <div>
            <Tooltip color="secondary" content="Edit user">
              <button onClick={() => console.log("Edit user", data.id)}>
                <PencilIcon className="size-6 text-warning-400" />
              </button>
            </Tooltip>
          </div>
          <div>
            <Tooltip
              color="danger"
              content="Delete user"
              onClick={() => console.log("Delete user", data.id)}
            >
              <button>
                <TrashIcon className="size-6 text-danger-500" />
              </button>
            </Tooltip>
          </div> */}
        </div>
      );
    default:
      return cellValue;
  }
};
