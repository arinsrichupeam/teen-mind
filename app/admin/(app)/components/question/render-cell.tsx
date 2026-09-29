import React from "react";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/react";

import { QuestionTableStatusCell } from "./question-table-status-cell";

import { ProfileSchool, QuestionsData } from "@/types";
import { prefix } from "@/utils/data";
import { formatThaiDateTime, calculateAge } from "@/utils/helper";

function getSchoolName(school: ProfileSchool): string {
  if (typeof school === "string") return school;

  return typeof school === "object" && school !== null ? school.name : "";
}

interface Props {
  data: QuestionsData;
  columnKey: string | React.Key;
  index: number;
  viewDetail(id: string, type: "view-consultation"): void;
  editDetail(id: string, type: "edit-consultation"): void;
}

export const RenderCell = ({
  data,
  columnKey,
  index,
  viewDetail,
  editDetail,
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
    case "name":
      return (
        <div className="flex flex-col gap-0.5">
          <p>
            {prefix.find((val) => val.key == data.profile.prefixId)?.label +
              " " +
              data.profile.firstName +
              " " +
              data.profile.lastName}
          </p>
          {data.healthcareFacility?.name?.trim() ? (
            <p className="text-tiny text-default-500">
              {data.healthcareFacility.name}
            </p>
          ) : null}
        </div>
      );
    case "age":
      return (
        <div>
          <span>{calculateAge(data.profile.birthDate, data.createdAt)} ปี</span>
        </div>
      );
    case "school":
      return (
        <div>
          <span>{getSchoolName(data.profile?.school) || "-"}</span>
        </div>
      );
    case "result":
      return (
        <div>
          <span>{data.phqa[0].sum}</span>
        </div>
      );

    case "phqa":
      return (
        <div>
          <Chip
            color={
              data.result === "Green"
                ? "success"
                : data.result === "Green-Low"
                  ? "success"
                  : data.result === "Yellow"
                    ? "warning"
                    : data.result === "Orange"
                      ? "warning"
                      : "danger"
            }
            size="sm"
            variant="flat"
          >
            <span className="capitalize text-xs">{data.result_text}</span>
          </Chip>
        </div>
      );
    case "date":
    case "createdAt":
      return (
        <div>
          <span>{formatThaiDateTime(data.createdAt)}</span>
        </div>
      );
    case "status":
      return <QuestionTableStatusCell row={data} />;
    case "actions":
      return (
        <div className="flex justify-center gap-2">
          <Button
            isIconOnly
            name="Detail"
            size="sm"
            variant="light"
            onPress={() => viewDetail(data.id, "view-consultation")}
          >
            <EyeIcon className="size-6 text-primary-400" />
          </Button>
          <Button
            isIconOnly
            name="Edit"
            size="sm"
            variant="light"
            onPress={() => editDetail(data.id, "edit-consultation")}
          >
            <DocumentTextIcon className="size-6 text-warning-400" />
          </Button>
        </div>
      );
    default:
      return cellValue;
  }
};
