import React, { useState } from "react";
import { Card, CardBody, Tabs, Tab } from "@heroui/react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

type ScoreCriteria = {
  range: string;
  level: string;
  color: string;
  description: string;
};

type props = {
  data?: any[];
};

export const CardScoreCriteria = ({ data: _data }: props) => {
  const [selectedTab, setSelectedTab] = useState("phqa");

  const phqaCriteria: ScoreCriteria[] = [
    {
      range: "0-4",
      level: "ไม่พบความเสี่ยง",
      color: "text-success-700",
      description: "Green",
    },
    {
      range: "5-9",
      level: "พบความเสี่ยงเล็กน้อย",
      color: "text-success-600",
      description: "Green-Low",
    },
    {
      range: "10-14",
      level: "พบความเสี่ยงปานกลาง",
      color: "text-warning-600",
      description: "Yellow",
    },
    {
      range: "15-19",
      level: "พบความเสี่ยงมาก",
      color: "text-orange-600",
      description: "Orange",
    },
    {
      range: "20-27",
      level: "พบความเสี่ยงรุนแรง",
      color: "text-danger-600",
      description: "Red",
    },
    {
      range: "ข้อที่ 9 คะแนนมากกว่า 0 คะแนน",
      level: "พบความเสี่ยง",
      color: "text-danger-600",
      description: "Red",
    },
  ];

  const twoQCriteria: ScoreCriteria[] = [
    {
      range: "ตอบ 'ไม่ใช่' ทั้ง 2 ข้อ",
      level: "ไม่พบความเสี่ยง",
      color: "text-success-700",
      description: "Green",
    },
    {
      range: "ข้อใดข้อหนึ่งเป็น 'ใช่' ",
      level: "พบความเสี่ยง",
      color: "text-danger-600",
      description: "Red",
    },
  ];

  const addOnCriteria: ScoreCriteria[] = [
    {
      range: "ตอบ 'ไม่ใช่' ทั้ง 2 ข้อ",
      level: "ไม่พบความเสี่ยง",
      color: "text-success-700",
      description: "Green",
    },
    {
      range: "ข้อใดข้อหนึ่งเป็น 'ใช่' ",
      level: "พบความเสี่ยง",
      color: "text-danger-600",
      description: "Red",
    },
  ];

  const getCurrentCriteria = () => {
    switch (selectedTab) {
      case "phqa":
        return phqaCriteria;
      case "2q":
        return twoQCriteria;
      case "addon":
        return addOnCriteria;
      default:
        return phqaCriteria;
    }
  };

  const getTabTitle = () => {
    switch (selectedTab) {
      case "phqa":
        return "เกณฑ์คะแนน PHQA";
      case "2q":
        return "เกณฑ์คะแนน 2Q";
      case "addon":
        return "เกณฑ์คะแนน Add-on";
      default:
        return "เกณฑ์คะแนน PHQA";
    }
  };

  const getLevelCount = () => {
    switch (selectedTab) {
      case "phqa":
        return "6 เกณฑ์";
      case "2q":
        return "2 เกณฑ์";
      case "addon":
        return "2 เกณฑ์";
      default:
        return "6 เกณฑ์";
    }
  };

  return (
    <Card className="xl:max-w-sm bg-gradient-to-tl rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex items-center gap-2.5 justify-start mb-4">
          <div className="flex flex-col basis-2/3">
            <span className="text-sm font-semibold">{getTabTitle()}</span>
            <span className="text-xl font-semibold">{getLevelCount()}</span>
          </div>
          <div className="flex basis-1/3 gap-2.5 py-2 items-center justify-end">
            <ChartBarIcon className="size-8 text-default-500" />
          </div>
        </div>

        <Tabs
          className="mb-4"
          selectedKey={selectedTab}
          size="sm"
          onSelectionChange={(key) => setSelectedTab(key as string)}
        >
          <Tab key="phqa" title="PHQA" />
          <Tab key="2q" title="2Q" />
          <Tab key="addon" title="Add-on" />
        </Tabs>

        <div className="space-y-2">
          {getCurrentCriteria().map((criteria, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    criteria.description === "Green"
                      ? "bg-success-500"
                      : criteria.description === "Green-Low"
                        ? "bg-success-400"
                        : criteria.description === "Yellow"
                          ? "bg-warning-500"
                          : criteria.description === "Orange"
                            ? "bg-orange-500"
                            : "bg-danger-500"
                  }`}
                />
                <span className="font-medium">{criteria.range}</span>
              </div>
              <span className={`font-semibold ${criteria.color}`}>
                {criteria.level}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};
