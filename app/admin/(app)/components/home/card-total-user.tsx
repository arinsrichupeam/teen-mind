import React from "react";
import { Card, CardBody } from "@heroui/react";
import { DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

type props = {
  data: any[];
};

export const CardTotalUser = ({ data }: props) => {
  return (
    <Card className="xl:max-w-sm bg-gradient-to-tl from-zinc-400 to-zinc-200 rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex items-center gap-2.5 justify-start">
          <div className="flex flex-col basis-2/3">
            <span className="text-sm font-semibold">ใช้บริการผ่าน App</span>
            <span className="text-xl font-semibold">{data.length}</span>
          </div>
          <div className="flex basis-1/3 gap-2.5 py-2 items-center justify-end">
            <DevicePhoneMobileIcon className="size-8 text-primary-500" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
