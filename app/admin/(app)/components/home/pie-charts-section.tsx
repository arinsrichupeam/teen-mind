"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardBody,
  Autocomplete,
  AutocompleteItem,
  addToast,
} from "@heroui/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { QuestionsData } from "@/types";

type School = {
  id: number;
  name: string;
  districtId: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type props = {
  data: QuestionsData[];
};

const COLORS = {
  phqa: {
    ไม่พบความเสี่ยง: "#22c55e", // green
    พบความเสี่ยงเล็กน้อย: "#4ade80", // green-light
    พบความเสี่ยงปานกลาง: "#eab308", // yellow
    พบความเสี่ยงมาก: "#f97316", // orange
    พบความเสี่ยงรุนแรง: "#ef4444", // red
  },
  q2: {
    ไม่พบความเสี่ยง: "#22c55e", // green
    พบความเสี่ยง: "#ef4444", // red
  },
  addon: {
    ไม่พบความเสี่ยง: "#22c55e", // green
    พบความเสี่ยง: "#ef4444", // red
  },
  status: {
    "รอระบุ HN": "#6b7280", // gray
    "รอจัดนัด Telemed": "#3b82f6", // blue
    รอสรุปผลการให้คำปรึกษา: "#f59e0b", // amber
    เสร็จสิ้น: "#10b981", // emerald
  },
};

export const PieChartsSection = ({ data }: props) => {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);

  // Fetch ข้อมูลโรงเรียน
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("/api/data/school");

        if (response.ok) {
          const schoolsData = await response.json();

          setSchools(schoolsData);
        }
      } catch (error) {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลโรงเรียนได้" + error,
          color: "danger",
        });
      }
    };

    fetchSchools();
  }, []);

  // กรองข้อมูลตามโรงเรียนที่เลือก
  const filteredData = useMemo(() => {
    if (!selectedSchool || selectedSchool === "") return data;

    const selectedSchoolId = parseInt(selectedSchool);

    return data.filter((question) => {
      const school = question.profile?.school;

      return (
        typeof school === "object" &&
        school !== null &&
        school.id === selectedSchoolId
      );
    });
  }, [data, selectedSchool]);

  // สร้างข้อมูลสำหรับ PHQA Chart
  const phqaData = useMemo(() => {
    const phqaCounts: { [key: string]: number } = {
      ไม่พบความเสี่ยง: 0,
      พบความเสี่ยงเล็กน้อย: 0,
      พบความเสี่ยงปานกลาง: 0,
      พบความเสี่ยงมาก: 0,
      พบความเสี่ยงรุนแรง: 0,
    };

    filteredData.forEach((question) => {
      if (question.phqa && question.phqa.length > 0) {
        const phqaData = question.phqa[0]; // ใช้ข้อมูล PHQA ล่าสุด
        const score = phqaData.sum;

        if (score >= 0 && score <= 4) phqaCounts["ไม่พบความเสี่ยง"]++;
        else if (score >= 5 && score <= 9) phqaCounts["พบความเสี่ยงเล็กน้อย"]++;
        else if (score >= 10 && score <= 14)
          phqaCounts["พบความเสี่ยงปานกลาง"]++;
        else if (score >= 15 && score <= 19) phqaCounts["พบความเสี่ยงมาก"]++;
        else if (score >= 20 && score <= 27) phqaCounts["พบความเสี่ยงรุนแรง"]++;
      }
    });

    return Object.entries(phqaCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS.phqa[name as keyof typeof COLORS.phqa],
      }));
  }, [filteredData]);

  // สร้างข้อมูลสำหรับ Add-on Chart
  const addonData = useMemo(() => {
    const addonCounts: { [key: string]: number } = {
      ไม่พบความเสี่ยง: 0,
      พบความเสี่ยง: 0,
    };

    filteredData.forEach((question) => {
      if (question.addon && question.addon.length > 0) {
        const addonData = question.addon[0]; // ใช้ข้อมูล Add-on ล่าสุด
        const hasRisk = addonData.q1 === 1 || addonData.q2 === 1; // สมมติว่า 1 = ใช่, 0 = ไม่ใช่

        if (hasRisk) {
          addonCounts["พบความเสี่ยง"]++;
        } else {
          addonCounts["ไม่พบความเสี่ยง"]++;
        }
      }
    });

    return Object.entries(addonCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS.addon[name as keyof typeof COLORS.addon],
      }));
  }, [filteredData]);

  // สร้างข้อมูลสำหรับ Status Chart
  const statusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {
      "รอระบุ HN": 0,
      "รอจัดนัด Telemed": 0,
      รอสรุปผลการให้คำปรึกษา: 0,
      เสร็จสิ้น: 0,
    };

    filteredData.forEach((question) => {
      const status = question.status;

      switch (status) {
        case 0:
          statusCounts["รอระบุ HN"]++;
          break;
        case 1:
          statusCounts["รอจัดนัด Telemed"]++;
          break;
        case 2:
          statusCounts["รอสรุปผลการให้คำปรึกษา"]++;
          break;
        case 3:
          statusCounts["เสร็จสิ้น"]++;
          break;
        default:
          statusCounts["รอระบุ HN"]++;
          break;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS.status[name as keyof typeof COLORS.status],
      }));
  }, [filteredData]);

  interface TooltipPayloadItem {
    name: string;
    value: number;
    color?: string;
  }

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TooltipPayloadItem[];
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">จำนวน: {payload[0].value} คน</p>
          <p className="text-sm text-gray-600">
            สัดส่วน:{" "}
            {((payload[0].value / filteredData.length) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* School Selector and Score Criteria Button */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-md p-2 shadow-md border border-gray-200">
        <div className="flex items-center gap-2">
          <Autocomplete
            allowsCustomValue={false}
            className="w-48 lg:w-64"
            placeholder="เลือกโรงเรียน"
            selectedKey={selectedSchool}
            variant="bordered"
            onSelectionChange={(key) => setSelectedSchool(key as string)}
          >
            {schools?.map((school: { id: number; name: string }) => (
              <AutocompleteItem key={school.id} textValue={school.name}>
                {school.name}
              </AutocompleteItem>
            ))}
          </Autocomplete>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* PHQA Combined Chart and Card */}
        <Card className="w-full">
          <CardBody className="p-3">
            <h3 className="text-base font-semibold mb-2 text-center">
              ผลการประเมิน PHQA
            </h3>
            <p className="text-xs text-gray-600 text-center mb-2">
              โรงเรียน:{" "}
              {selectedSchool && selectedSchool !== ""
                ? schools.find((s) => s.id.toString() === selectedSchool)?.name
                : "ทั้งหมด"}
            </p>

            {/* Chart Section */}
            <div className="mb-4">
              {phqaData.length > 0 ? (
                <ResponsiveContainer height={200} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={phqaData}
                      dataKey="value"
                      fill="#8884d8"
                      label={({ percent }) =>
                        `${((percent || 0) * 100).toFixed(1)}%`
                      }
                      labelLine={true}
                      outerRadius={60}
                    >
                      {phqaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-gray-500 italic">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="space-y-2">
              <div className="text-md">
                <p className="font-semibold text-gray-700 text-center mb-2">
                  จำนวนผู้ประเมิน:{" "}
                  {phqaData.reduce((acc, item) => acc + item.value, 0)} คน
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  {phqaData.length > 0 ? (
                    phqaData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value} คน</span>
                        <span className="text-xs text-gray-500">
                          (
                          {(
                            (item.value /
                              phqaData.reduce(
                                (acc, item) => acc + item.value,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-center">
                      ไม่พบข้อมูล
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Add-on Combined Chart and Card */}
        <Card className="w-full">
          <CardBody className="p-3">
            <h3 className="text-base font-semibold mb-2 text-center">
              ผลการประเมิน Add-on
            </h3>
            <p className="text-xs text-gray-600 text-center mb-2">
              โรงเรียน:{" "}
              {selectedSchool && selectedSchool !== ""
                ? schools.find((s) => s.id.toString() === selectedSchool)?.name
                : "ทั้งหมด"}
            </p>

            {/* Chart Section */}
            <div className="mb-4">
              {addonData.length > 0 ? (
                <ResponsiveContainer height={200} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={addonData}
                      dataKey="value"
                      fill="#8884d8"
                      label={({ percent }) =>
                        `${((percent || 0) * 100).toFixed(1)}%`
                      }
                      labelLine={true}
                      outerRadius={60}
                    >
                      {addonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-gray-500 italic">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="space-y-2">
              <div className="text-md">
                <p className="font-semibold text-gray-700 text-center mb-2">
                  จำนวนผู้ประเมิน:{" "}
                  {addonData.reduce((acc, item) => acc + item.value, 0)} คน
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  {addonData.length > 0 ? (
                    addonData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value} คน</span>
                        <span className="text-xs text-gray-500">
                          (
                          {(
                            (item.value /
                              addonData.reduce(
                                (acc, item) => acc + item.value,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-center">
                      ไม่พบข้อมูล
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Status Chart */}
        <Card className="w-full">
          <CardBody className="p-3">
            <h3 className="text-base font-semibold mb-2 text-center">
              สถานะการดำเนินการ
            </h3>
            <p className="text-xs text-gray-600 text-center mb-2">
              โรงเรียน:{" "}
              {selectedSchool && selectedSchool !== ""
                ? schools.find((s) => s.id.toString() === selectedSchool)?.name
                : "ทั้งหมด"}
            </p>

            {/* Chart Section */}
            <div className="mb-4">
              {statusData.length > 0 ? (
                <ResponsiveContainer height={200} width="100%">
                  <PieChart>
                    <Pie
                      cx="50%"
                      cy="50%"
                      data={statusData}
                      dataKey="value"
                      fill="#8884d8"
                      label={({ percent }) =>
                        `${((percent || 0) * 100).toFixed(1)}%`
                      }
                      labelLine={true}
                      outerRadius={60}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-gray-500 italic">
                  ไม่พบข้อมูล
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="space-y-2">
              <div className="text-md">
                <p className="font-semibold text-gray-700 text-center mb-2">
                  จำนวนผู้ประเมิน:{" "}
                  {statusData.reduce((acc, item) => acc + item.value, 0)} คน
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  {statusData.length > 0 ? (
                    statusData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}:</span>
                        <span>{item.value} คน</span>
                        <span className="text-xs text-gray-500">
                          (
                          {(
                            (item.value /
                              statusData.reduce(
                                (acc, item) => acc + item.value,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic text-center">
                      ไม่พบข้อมูล
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
