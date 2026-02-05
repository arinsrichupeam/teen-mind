import React from "react";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";

interface VolunteerRow {
  id: string | number;
  prefix: string;
  firstname: string;
  lastname: string;
  affiliation?: { name: string };
  agency: string;
  question_count: number;
  status: boolean;
  [key: string]: unknown;
}

interface Props {
  data: VolunteerRow;
  columnKey: string | React.Key;
  index: number;
  viewDetail(id: string): void;
  editDetail(id: string): void;
}

export const VolunteerRenderCell = ({
  data,
  columnKey,
  viewDetail,
  editDetail,
}: Props) => {
  const cellValue = data[columnKey as keyof VolunteerRow] as unknown;

  switch (columnKey) {
    case "id":
      return (
        <div className="text-center">
          {String(cellValue ?? "").padStart(3, "0")}
        </div>
      );
    case "name":
      return <div>{`${data.prefix} ${data.firstname} ${data.lastname}`}</div>;
    case "affiliation":
      return <div>{data.affiliation?.name}</div>;
    case "agency":
      return <div>{cellValue != null ? String(cellValue) : ""}</div>;
    case "question_count":
      return (
        <div className="text-center">
          {typeof cellValue === "number" ? cellValue : Number(cellValue) || 0}
        </div>
      );
    case "status":
      return (
        <div className="text-center">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              cellValue
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {cellValue ? "ใช้งาน" : "ไม่ใช้งาน"}
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
              onPress={() => viewDetail(String(data.id))}
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
              onPress={() => editDetail(String(data.id))}
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
