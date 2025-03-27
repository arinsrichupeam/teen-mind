import { Card, CardBody, AvatarGroup, Avatar } from "@heroui/react";
import React from "react";

type props = {
  data: any[];
};

export const CardAgents = ({ data }: props) => {
  return (
    <Card className=" bg-default-50 rounded-xl shadow-md px-4 py-6 w-full">
      <CardBody className="py-5 gap-6">
        <div className="flex gap-2.5 justify-center">
          <div className="flex flex-col border-dashed border-2 border-divider py-2 px-6 rounded-xl">
            <span className="text-default-900 text-xl font-semibold">
              {" "}
              {"⭐"}รอยืนยันการใช้งาน
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-col">
          <span className="text-xs">
            ผู้ใช้งานใหม่ อยู่ระหว่างรอผลการพิจารณา
          </span>
          <AvatarGroup isBordered>
            {data.map((val, index) => (
              <Avatar key={index} src={val.user.image} />
            ))}
          </AvatarGroup>
        </div>
      </CardBody>
    </Card>
  );
};
