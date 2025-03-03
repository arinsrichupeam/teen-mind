
import React from "react";
import { Tooltip } from "@heroui/tooltip";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { School } from "@prisma/client";



interface Props {
  data: School;
  columnKey: string | React.Key;
  index: number;
}

export const SchoolRenderCell = ({ data, columnKey,index}:Props) => {
  // function timeAgo(date: string) {
  //   moment.updateLocale("th", {
  //     relativeTime: {
  //       future: "in %s",
  //       past: "%s",
  //       s: (number) => number + "s ago",
  //       ss: "%ds ago",
  //       m: "1m ago",
  //       mm: "%dm ago",
  //       h: "1h ago",
  //       hh: "%dh ago",
  //       d: "1d ago",
  //       dd: "%dd ago",
  //       M: "a month ago",
  //       MM: "%d months ago",
  //       y: "a year ago",
  //       yy: "%d ปี",
  //     },
  //   });

  //   return moment(date).fromNow();
  // }

  // @ts-ignore
  const cellValue = data[columnKey];

  switch (columnKey) {
    case "id":
      return (
        <div>
          <span>{index}</span>
        </div>
      );
    case "school":
      return (
        <div>
          <span>{data.name}</span>
        </div>
      );
    case "area":
      return (
        <div>
          <span>{data.districtId}</span>
        </div>
      );
    case "status":
      return (
        <div>
          {/* <span>ใช้งาน</span> */}
        </div>
      );
    case "actions":
      return (
        <div className="flex gap-4">
          <div>
            <Tooltip content="Details">
              <button>
                <EyeIcon className="size-6 text-primary-400" />
              </button>
            </Tooltip>
          </div>
          <div>
            <Tooltip color="secondary" content="Edit user">
              <button >
                <PencilIcon className="size-6 text-warning-400" />
              </button>
            </Tooltip>
          </div>
          <div>
            <Tooltip
              color="danger"
              content="Delete user"
            
            >
              <button>
                <TrashIcon className="size-6 text-danger-500" />
              </button>
            </Tooltip>
          </div>
        </div>
      );
    default:
      return cellValue;
  }
};
