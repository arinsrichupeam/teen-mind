import React from "react";
import { Card, CardBody } from "@heroui/react";

import { QuestionsData } from "@/types";

type props = {
  data: QuestionsData[];
  total: number;
};

export const CardGreen = ({ data, total }: props) => {
  return (
    <Card className="xl:max-w-sm bg-success-200 rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex items-center gap-2.5 justify-start">
          <div className="flex flex-col basis-2/3">
            <span className="font-semibold text-success-700 whitespace-nowrap">
              ไม่พบความเสี่ยง
            </span>
            <span className=" text-xl font-semibold">
              {data.length} <span className="text-xs text-success-600">
                ({total > 0 ? ((data.length / total) * 100).toFixed(1) : 0}%)
              </span>
            </span>
          </div>
          {/* <div className="flex basis-1/3 gap-2.5 py-2 items-center justify-end">
            <UsersIcon className="size-8 text-success-700" />
          </div> */}
        </div>
        <div className="flex flex-row items-center gap-2">
          <div className="basis-1/2">
            <span className="text-xs ">ดำเนินการ</span>
            <div>
              <span className="font-semibold ">
                {data.filter((val) => val.status !== 3).length}
              </span>
            </div>
          </div>

          <div className="basis-1/2">
            <span className=" text-xs ">เสร็จสิ้น</span>
            <div>
              <span className="font-semibold">
                {data.filter((val) => val.status === 3).length}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
