import React from "react";
import { Card, CardBody } from "@heroui/react";
import { UserPlusIcon } from "@heroicons/react/24/outline";

import { QuestionsData } from "@/types";

type Props = {
  data: QuestionsData[];
};

export const CardTotalManual = ({ data }: Props) => {
  return (
    <Card className="bg-gradient-to-tl from-zinc-400 to-zinc-200 rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-3 overflow-hidden">
        <div className="flex items-center gap-2 justify-start">
          <div className="flex flex-col basis-2/3">
            <span className="text-xs font-semibold whitespace-nowrap">
              ใช้บริการแบบ Manual
            </span>
            <span className="text-lg font-semibold whitespace-nowrap">
              {data.length}
            </span>
          </div>
          <div className="flex basis-1/3 gap-2 py-1 items-center justify-end">
            <UserPlusIcon className="size-6 text-primary-500" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
