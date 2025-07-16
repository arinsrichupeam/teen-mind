import { Card, CardBody, AvatarGroup, Avatar } from "@heroui/react";
import React from "react";

type props = {
  data: any[];
};

export const CardAgents = ({ data }: props) => {
  return (
    <Card className="bg-default-50 rounded-xl shadow-md px-3 py-4 w-full">
      <CardBody className="py-3 gap-4">
        <div className="flex gap-2 justify-center">
          <div className="flex flex-col border-dashed border-2 border-divider py-2 px-4 rounded-xl">
            <span className="text-default-900 text-base font-semibold">
              {" "}
              {"⭐"}รอยืนยันการใช้งาน
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-col">
          <span className="text-xs text-center">
            ผู้ใช้งานใหม่ อยู่ระหว่างรอผลการพิจารณา
          </span>
          <AvatarGroup isBordered size="sm">
            {data.map((val, index) => (
              <Avatar key={index} size="sm" src={val.user.image} />
            ))}
          </AvatarGroup>
        </div>
      </CardBody>
    </Card>
  );
};
