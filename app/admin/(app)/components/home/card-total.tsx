import React from "react";
import { Card, CardBody } from "@heroui/react";
import { UserGroupIcon } from "@heroicons/react/24/outline";

type props = {
  data: any[];
};

export const CardTotal = ({ data }: props) => {
  return (
    <Card className="xl:max-w-sm bg-gradient-to-br from-zinc-400 to-zinc-200 rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex items-center gap-2.5 justify-start">
          <div className="flex flex-col basis-2/3">
            <span className="text-sm font-semibold">ผู้รับบริการ (คน)</span>
            <span className="text-xl font-semibold">
              {
                Array.from(new Set(data.map((item: any) => item.user.id)))
                  .length
              }
            </span>
          </div>
          <div className="flex basis-1/3 gap-2.5 py-2 items-center justify-end">
            <UserGroupIcon className="size-8 text-primary-500" />
          </div>
        </div>
        {/* <div className="flex flex-row items-center gap-2">
          <div className="basis-1/2">
            <span className="text-xs">Referent</span>
            <div>
              <span className="font-semibold">
                {data.filter((val) => val.status !== 3).length}
              </span>
            </div>
          </div>

          <div className="basis-1/2">
            <span className="text-xs">Consult</span>
            <div>
              <span className="font-semibold">
                {data.filter((val) => val.status === 3).length}
              </span>
            </div>
          </div>
        </div> */}
      </CardBody>
    </Card>
  );
};
