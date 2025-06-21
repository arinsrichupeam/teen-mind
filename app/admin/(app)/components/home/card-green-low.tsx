import React from "react";
import { Card, CardBody } from "@heroui/react";

import { QuestionsData } from "@/types";

type props = {
  data: QuestionsData[];
};

export const CardGreenLow = ({ data }: props) => {
  return (
    <Card className="xl:max-w-sm bg-green-300 rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex items-center gap-2.5 justify-start">
          <div className="flex flex-col basis-2/3">
            <span className="font-semibold text-green-600 whitespace-nowrap">
              พบความเสี่ยงเล็กน้อย
            </span>
            <span className=" text-xl font-semibold">{data.length}</span>
          </div>
          {/* <div className="flex basis-1/3 gap-2.5 py-2 items-center justify-end">
            <UsersIcon className="size-8 text-green-600" />
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
