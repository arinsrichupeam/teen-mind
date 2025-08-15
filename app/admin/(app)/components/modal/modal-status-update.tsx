"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  addToast,
  Autocomplete,
  AutocompleteItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Selection,
  Card,
  CardBody,
} from "@heroui/react";
import { useState } from "react";
import useSWR, { mutate } from "swr";

import { calculatePhqaRiskLevel } from "@/utils/helper";
import { prefix } from "@/utils/data";

interface ModalStatusUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  onDataUpdate?: () => void;
}

export const ModalStatusUpdate = ({
  isOpen,
  onClose,
  data,
  onDataUpdate,
}: ModalStatusUpdateProps) => {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedPhqa, setSelectedPhqa] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayedItems, setDisplayedItems] = useState<number>(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [newStatus, setNewStatus] = useState<string>("");

  // ตัวเลือก PHQA
  const phqaOptions = [
    { label: "ไม่พบความเสี่ยง", value: "Green" },
    { label: "พบความเสี่ยงเล็กน้อย", value: "Green-Low" },
  ];

  // กรองข้อมูลตามโรงเรียนและ PHQA ที่เลือก
  const filteredData = data.filter((item) => {
    // ตรวจสอบโรงเรียน
    let itemSchool = null;

    if (item.school) {
      itemSchool = item.school;
    } else if (item.profile?.school) {
      itemSchool = item.profile.school;
    } else if (item.user?.school) {
      itemSchool = item.user.school;
    }

    let schoolName = null;

    if (typeof itemSchool === "object" && itemSchool !== null) {
      schoolName = itemSchool.name;
    } else if (typeof itemSchool === "string") {
      schoolName = itemSchool;
    }

    const matchesSchool = !selectedSchool || schoolName === selectedSchool;

    // ตรวจสอบ PHQA
    const phqaRiskLevel = calculatePhqaRiskLevel(item);
    const matchesPhqa = !selectedPhqa || phqaRiskLevel === selectedPhqa;

    // กรองเฉพาะข้อมูลที่มีระดับความเสี่ยง "ไม่พบความเสี่ยง" และ "พบความเสี่ยงเล็กน้อย"
    const allowedRiskLevels = ["Green", "Green-Low"];
    const isAllowedRiskLevel = allowedRiskLevels.includes(phqaRiskLevel);

    return matchesSchool && matchesPhqa && isAllowedRiskLevel;
  });

  // ดึงข้อมูลโรงเรียน
  const { data: schoolsData } = useSWR(
    "/api/data/school",
    async (url) => {
      try {
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch schools");

        return res.json();
      } catch (error) {
        addToast({
          title: "Error fetching schools",
          description: error as string,
          color: "danger",
        });

        return [];
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const handleStatusUpdate = async () => {
    const hasSelection =
      selectedKeys === "all" ||
      (selectedKeys instanceof Set && selectedKeys.size > 0);

    if (!hasSelection) {
      addToast({
        title: "ไม่พบข้อมูลที่เลือก",
        description: "กรุณาเลือกข้อมูลที่ต้องการอัปเดตสถานะ",
        color: "warning",
      });

      return;
    }

    if (!newStatus) {
      addToast({
        title: "ไม่พบสถานะใหม่",
        description: "กรุณาเลือกสถานะใหม่ที่ต้องการอัปเดต",
        color: "warning",
      });

      return;
    }

    setIsLoading(true);

    try {
      // ดึงข้อมูลที่เลือก
      const selectedItems =
        selectedKeys === "all"
          ? filteredData
          : filteredData.filter(
              (item) =>
                selectedKeys instanceof Set &&
                selectedKeys.has(item.id.toString())
            );

      // ดึง ID ของรายการที่เลือก
      const selectedIds = selectedItems.map((item) => item.id.toString());

      // เรียก API เพื่ออัปเดตสถานะ
      const response = await fetch("/api/question/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedIds,
          newStatus: parseInt(newStatus),
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "สำเร็จ",
          description: result.message,
          color: "success",
        });

        // อัปเดตข้อมูลโดยไม่ต้อง refresh หน้า
        if (onDataUpdate) {
          onDataUpdate();
        } else {
          // Fallback: mutate ข้อมูลที่เกี่ยวข้อง
          mutate("/api/question");
        }

        onClose();
        setSelectedSchool("");
        setSelectedPhqa("");
        setDisplayedItems(10);
        setSelectedKeys(new Set([]));
        setNewStatus("");
      } else {
        addToast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถอัปเดตสถานะได้",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "เกิดข้อผิดพลาด",
        description:
          "ไม่สามารถอัปเดตสถานะได้: " +
          (error instanceof Error ? error.message : "ไม่ระบุ"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasSelection =
    selectedKeys === "all" ||
    (selectedKeys instanceof Set && selectedKeys.size > 0);

  const handleClose = () => {
    setSelectedSchool("");
    setSelectedPhqa("");
    setDisplayedItems(10);
    setSelectedKeys(new Set([]));
    setNewStatus("");
    onClose();
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลเพิ่มเมื่อ scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // เมื่อ scroll ถึง 80% ของความสูง
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      loadMoreData();
    }
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลเพิ่ม
  const loadMoreData = () => {
    if (displayedItems < filteredData.length && !isLoadingMore) {
      setIsLoadingMore(true);

      // จำลองการโหลดข้อมูล
      setTimeout(() => {
        setDisplayedItems((prev) => Math.min(prev + 10, filteredData.length));
        setIsLoadingMore(false);
      }, 500);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "h-[95vh] max-w-[95vw]",
        body: "h-[calc(95vh-180px)] overflow-hidden",
      }}
      isOpen={isOpen}
      placement="center"
      size="5xl"
      onClose={handleClose}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex flex-col">
              <div>
                <h3 className="text-lg font-semibold">ปรับสถานะ</h3>
              </div>
            </ModalHeader>
            <ModalBody className="h-full overflow-hidden">
              <div className="h-full flex flex-col space-y-4">
                <Card className="min-h-[100px]">
                  <CardBody className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Autocomplete
                        className="w-full"
                        label="โรงเรียน"
                        labelPlacement="outside"
                        placeholder="เลือกโรงเรียน"
                        selectedKey={selectedSchool}
                        size="md"
                        variant="bordered"
                        onSelectionChange={(key) => {
                          setSelectedSchool(key as string);
                          setDisplayedItems(10); // รีเซ็ตจำนวนรายการที่แสดง
                        }}
                      >
                        {schoolsData?.map((school: any) => (
                          <AutocompleteItem key={school.name}>
                            {school.name}
                          </AutocompleteItem>
                        ))}
                      </Autocomplete>

                      <Select
                        className="w-full"
                        label="ระดับความเสี่ยง PHQA"
                        labelPlacement="outside"
                        placeholder="เลือกระดับความเสี่ยง"
                        selectedKeys={selectedPhqa ? [selectedPhqa] : []}
                        size="md"
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;

                          setSelectedPhqa(selected || "");
                          setDisplayedItems(10); // รีเซ็ตจำนวนรายการที่แสดง
                        }}
                      >
                        {phqaOptions.map((option) => (
                          <SelectItem key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </CardBody>
                </Card>
                {filteredData.length === 0 && (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            clipRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          ไม่พบข้อมูล
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            ไม่พบข้อมูลที่มีระดับความเสี่ยง
                            &quot;ไม่พบความเสี่ยง&quot; หรือ
                            &quot;พบความเสี่ยงเล็กน้อย&quot;
                            {selectedSchool && ` ในโรงเรียน ${selectedSchool}`}
                            {selectedPhqa &&
                              ` ที่มีระดับความเสี่ยง ${phqaOptions.find((opt) => opt.value === selectedPhqa)?.label}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <Card className="flex-1">
                  <CardBody className="h-full flex flex-col">
                    {filteredData.length > 0 && (
                      <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-3 shadow-sm">
                          <div>
                            <h5 className="font-medium text-blue-800">
                              รายการที่มีระดับความเสี่ยงต่ำ
                            </h5>
                            {filteredData.length > 0 && (
                              <span className="text-sm text-gray-600">
                                แสดง {displayedItems} จาก {filteredData.length}{" "}
                                รายการ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {hasSelection && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  เลือกแล้ว:{" "}
                                  {selectedKeys === "all"
                                    ? filteredData.length
                                    : selectedKeys instanceof Set
                                      ? selectedKeys.size
                                      : 0}{" "}
                                  รายการ
                                </span>
                                <Select
                                  className="w-48"
                                  placeholder="เลือกสถานะใหม่"
                                  selectedKeys={newStatus ? [newStatus] : []}
                                  size="md"
                                  variant="bordered"
                                  onSelectionChange={(keys) => {
                                    const selected = Array.from(
                                      keys
                                    )[0] as string;

                                    setNewStatus(selected || "");
                                  }}
                                >
                                  <SelectItem key="0">รอระบุ HN</SelectItem>
                                  <SelectItem key="1">
                                    รอจัดนัด Telemed
                                  </SelectItem>
                                  <SelectItem key="2">
                                    รอสรุปผลการให้คำปรึกษา
                                  </SelectItem>
                                  <SelectItem key="3">เสร็จสิ้น</SelectItem>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className="max-h-[400px] overflow-y-auto border rounded-2xl  scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                          onScroll={handleScroll}
                        >
                          <Table
                            isStriped
                            aria-label="รายการที่เลือก"
                            className="w-full"
                            selectedKeys={selectedKeys}
                            selectionMode="multiple"
                            onSelectionChange={setSelectedKeys}
                          >
                            <TableHeader>
                              <TableColumn className="text-center">
                                ลำดับ
                              </TableColumn>
                              <TableColumn className="text-center">
                                ชื่อ-นามสกุล
                              </TableColumn>
                              <TableColumn className="text-center">
                                โรงเรียน
                              </TableColumn>
                              <TableColumn className="text-center">
                                PHQA
                              </TableColumn>
                              <TableColumn className="text-center">
                                2Q
                              </TableColumn>
                              <TableColumn className="text-center">
                                Addon
                              </TableColumn>
                              <TableColumn className="text-center">
                                สถานะ
                              </TableColumn>
                            </TableHeader>
                            <TableBody>
                              {filteredData
                                .slice(0, displayedItems)
                                .map((item, index) => {
                                  // ฟังก์ชันสำหรับดึงชื่อโรงเรียน
                                  const getSchoolName = (item: any) => {
                                    let itemSchool = null;

                                    if (item.school) {
                                      itemSchool = item.school;
                                    } else if (item.profile?.school) {
                                      itemSchool = item.profile.school;
                                    } else if (item.user?.school) {
                                      itemSchool = item.user.school;
                                    }

                                    if (
                                      typeof itemSchool === "object" &&
                                      itemSchool !== null
                                    ) {
                                      return itemSchool.name;
                                    } else if (typeof itemSchool === "string") {
                                      return itemSchool;
                                    }

                                    return "ไม่ระบุ";
                                  };

                                  // ฟังก์ชันสำหรับแสดงผล PHQA
                                  const renderPHQA = (item: any) => {
                                    const phqaRiskLevel =
                                      calculatePhqaRiskLevel(item);

                                    const getPHQAColor = (level: string) => {
                                      switch (level) {
                                        case "Green":
                                          return "success";
                                        case "Green-Low":
                                          return "success";
                                        case "Yellow":
                                          return "warning";
                                        case "Orange":
                                          return "warning";
                                        case "Red":
                                          return "danger";
                                        default:
                                          return "default";
                                      }
                                    };

                                    const getPHQALabel = (level: string) => {
                                      switch (level) {
                                        case "Green":
                                          return "ไม่พบความเสี่ยง";
                                        case "Green-Low":
                                          return "พบความเสี่ยงเล็กน้อย";
                                        case "Yellow":
                                          return "พบความเสี่ยงปานกลาง";
                                        case "Orange":
                                          return "พบความเสี่ยงมาก";
                                        case "Red":
                                          return "พบความเสี่ยงรุนแรง";
                                        default:
                                          return "ไม่ระบุ";
                                      }
                                    };

                                    return (
                                      <Chip
                                        className="capitalize text-xs"
                                        color={getPHQAColor(phqaRiskLevel)}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {getPHQALabel(phqaRiskLevel)}
                                      </Chip>
                                    );
                                  };

                                  // ฟังก์ชันสำหรับแสดงผล 2Q
                                  const render2Q = (item: any) => {
                                    if (
                                      Array.isArray(item.q2) &&
                                      item.q2.length > 0
                                    ) {
                                      const q2Data = item.q2[0];
                                      const hasRisk =
                                        q2Data.q1 === 1 || q2Data.q2 === 1;

                                      return (
                                        <Chip
                                          className="capitalize text-xs"
                                          color={hasRisk ? "danger" : "success"}
                                          size="sm"
                                          variant="flat"
                                        >
                                          {hasRisk
                                            ? "พบความเสี่ยง"
                                            : "ไม่พบความเสี่ยง"}
                                        </Chip>
                                      );
                                    }

                                    return "-";
                                  };

                                  // ฟังก์ชันสำหรับแสดงผล Addon
                                  const renderAddon = (item: any) => {
                                    if (
                                      Array.isArray(item.addon) &&
                                      item.addon.length > 0
                                    ) {
                                      const addonData = item.addon[0];
                                      const hasRisk =
                                        addonData.q1 === 1 ||
                                        addonData.q2 === 1;

                                      return (
                                        <Chip
                                          className="capitalize text-xs"
                                          color={hasRisk ? "danger" : "success"}
                                          size="sm"
                                          variant="flat"
                                        >
                                          {hasRisk
                                            ? "พบความเสี่ยง"
                                            : "ไม่พบความเสี่ยง"}
                                        </Chip>
                                      );
                                    }

                                    return "-";
                                  };

                                  // ฟังก์ชันสำหรับแสดงผลสถานะ
                                  const renderStatus = (status: any) => {
                                    const getStatusLabel = (status: any) => {
                                      switch (status) {
                                        case 0:
                                          return "รอระบุ HN";
                                        case 1:
                                          return "รอจัดนัด Telemed";
                                        case 2:
                                          return "รอสรุปผลการให้คำปรึกษา";
                                        case 3:
                                          return "เสร็จสิ้น";
                                        default:
                                          return (
                                            status?.toString() || "ไม่ระบุ"
                                          );
                                      }
                                    };

                                    const getStatusColor = (status: any) => {
                                      switch (status) {
                                        case 0:
                                          return "default";
                                        case 1:
                                          return "primary";
                                        case 2:
                                          return "warning";
                                        case 3:
                                          return "success";
                                        default:
                                          return "default";
                                      }
                                    };

                                    return (
                                      <Chip
                                        className="capitalize text-xs"
                                        color={getStatusColor(status)}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {getStatusLabel(status)}
                                      </Chip>
                                    );
                                  };

                                  return (
                                    <TableRow key={item.id || index}>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        {(() => {
                                          const firstname =
                                            item.profile?.firstname ||
                                            item.user?.firstname ||
                                            "";
                                          const lastname =
                                            item.profile?.lastname ||
                                            item.user?.lastname ||
                                            "";
                                          const prefixId =
                                            item.profile?.prefixId ||
                                            item.user?.prefixId;

                                          // หาคำนำหน้าจาก prefixId
                                          const prefixLabel =
                                            prefix.find(
                                              (p) =>
                                                p.key === prefixId?.toString()
                                            )?.label || "";

                                          const fullName =
                                            `${prefixLabel} ${firstname} ${lastname}`.trim();

                                          return fullName || "ไม่ระบุ";
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {getSchoolName(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderPHQA(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {render2Q(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderAddon(item)}
                                      </TableCell>
                                      <TableCell className="text-center whitespace-nowrap">
                                        {renderStatus(item.status)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* แสดงปุ่มโหลดข้อมูลเพิ่มเมื่อยังมีข้อมูลที่ไม่ได้แสดง */}
                        {displayedItems < filteredData.length &&
                          !isLoadingMore && (
                            <div className="flex justify-center items-center py-4">
                              <Button
                                color="primary"
                                variant="bordered"
                                onPress={loadMoreData}
                              >
                                โหลดข้อมูลเพิ่ม ({displayedItems} /{" "}
                                {filteredData.length})
                              </Button>
                            </div>
                          )}

                        {/* แสดง loading indicator เมื่อกำลังโหลดข้อมูลเพิ่ม */}
                        {isLoadingMore && (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            <span className="ml-2 text-sm text-gray-600">
                              กำลังโหลดข้อมูลเพิ่ม...
                            </span>
                          </div>
                        )}

                        {/* แสดงข้อความเมื่อโหลดข้อมูลครบแล้ว */}
                        {displayedItems >= filteredData.length &&
                          filteredData.length > 0 && (
                            <div className="text-center py-2 text-sm text-gray-500">
                              แสดงข้อมูลครบทั้งหมดแล้ว ({filteredData.length}{" "}
                              รายการ)
                            </div>
                          )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                isDisabled={!hasSelection || !newStatus}
                isLoading={isLoading}
                onPress={handleStatusUpdate}
              >
                ยืนยัน
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
