import React from "react";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import { Districts, School } from "@prisma/client";
import { Chip } from "@heroui/react";

interface Props {
  data: School;
  columnKey: string | React.Key;
  index: number;
  district: Districts[];
  viewSchool(id: number): void;
  editSchool(id: number): void;
}

export const SchoolRenderCell = ({
  data,
  columnKey,
  index,
  district,
  viewSchool,
  editSchool,
  // deleteSchool,
}: Props) => {
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
          <span>
            {district.find((val) => val.id === data.districtId)?.nameInThai}
          </span>
        </div>
      );
    case "screeningDate":
      return (
        <div>
          <span>
            {data.screeningDate
              ? new Date(data.screeningDate).toLocaleDateString("th-TH")
              : "-"}
          </span>
        </div>
      );
    case "status":
      return (
        <div>
          <Chip
            color={data.status === true ? "success" : "danger"}
            size="sm"
            variant="flat"
          >
            <span className="capitalize text-xs">
              {data.status === true ? "ใช้งาน" : "ไม่ใช้งาน"}
            </span>
          </Chip>
        </div>
      );
    case "actions":
      return (
        <div className="flex gap-4 justify-center">
          <div>
            <button onClick={() => viewSchool(data.id)}>
              <EyeIcon className="size-6 text-primary-400" />
            </button>
          </div>
          <div>
            <button onClick={() => editSchool(data.id)}>
              <PencilIcon className="size-6 text-warning-400" />
            </button>
          </div>
          {/* <div>
            <button>
              <TrashIcon className="size-6 text-danger-500" />
            </button>
          </div> */}
        </div>
      );
    default:
      return cellValue;
  }
};
