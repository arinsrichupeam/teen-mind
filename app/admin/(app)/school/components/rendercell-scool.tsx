import React from "react"
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid"
import { Tooltip } from "@heroui/react";


interface Props {
  data: any;
  columnKey: string | React.Key;
  index: number;
}


export const SchoolRenderCell = ({ data, columnKey, index, }: Props) => {

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
          <span>{data.User.profile[0].school}</span>
        </div>
      );
    case "actions":
      return (
        <div className="flex gap-4">
          <div>
            <Tooltip content="Details">
              <button >
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
          </div>
        </div>
      );
    default:
      return cellValue;
  }
};