"use client";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Divider,
  Chip,
  Card,
  CardBody,
  CardFooter,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { ModalEditProfile } from "../../components/modal/modal-edit-profile";
import { ModalAddQuestion } from "../../components/modal/modal-add-question";

import { LineIcon } from "@/components/icons";
import { prefix } from "@/utils/data";
import {
  formatThaiDateTime,
  formatThaiDate,
  getPhqaRiskLevel,
  getPhqaRiskText,
  getNineQRiskLevel,
  getNineQRiskText,
} from "@/utils/helper";

interface Province {
  id: number;
  nameInThai: string;
}

interface District {
  id: number;
  nameInThai: string;
  provinceId: number;
}

interface Subdistrict {
  id: number;
  nameInThai: string;
  districtId: number;
}

interface UserData {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  prefixId: number;
  sex: number | string;
  citizenId: string;
  phone: string;
  school: {
    id: number;
    name: string;
  } | null;
  healthcareFacility?: {
    id: string;
    name: string;
  } | null;
  cases: {
    id: string;
    createdAt: string;
    result: string;
    questions2Q?: { q1: number; q2: number }[];
    questionsPhqa?: { sum: number }[];
    questionsPhqaAddon?: { q1: number; q2: number }[];
    questions9Q?: { sum: number }[];
    questions8Q?: { sum: number }[];
    volunteer?: {
      id: string;
      firstName: string;
      lastName: string;
      affiliation: {
        name: string;
      };
    } | null;
  }[];
  birthDate?: string;
  birthday?: string;
  ethnicity?: string;
  nationality?: string;
  addresses?: {
    houseNo?: string;
    villageNo?: string;
    soi?: string;
    road?: string;
    subdistrictId?: number;
    districtId?: number;
    provinceId?: number;
    subdistrict?: number;
    district?: number;
    province?: number;
  }[];
  address?: {
    houseNo?: string;
    villageNo?: string;
    soi?: string;
    road?: string;
    subdistrictId?: number;
    districtId?: number;
    provinceId?: number;
    subdistrict?: number;
    district?: number;
    province?: number;
  }[];
  emergencyContacts?: {
    name?: string;
    phone?: string;
    tel?: string;
    relation?: string;
  }[];
  emergency?: {
    name?: string;
    phone?: string;
    tel?: string;
    relation?: string;
  }[];
  user?: {
    name: string | null;
    image: string | null;
    accounts: {
      providerAccountId: string;
    }[];
  } | null;
}

interface UserDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  mode?: "view" | "edit";
  onRefresh?: () => void;
  onMutate?: () => Promise<void>;
}

export default function UserDetailDrawer({
  isOpen,
  onClose,
  user,
  mode,
  onRefresh,
  onMutate,
}: UserDetailDrawerProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isResetLineModalOpen, setIsResetLineModalOpen] = useState(false);
  const [isResettingLine, setIsResettingLine] = useState(false);

  const isLineLinked = Boolean(user?.user?.accounts?.length);
  const cases = user?.cases ?? [];
  const rawAddress = user?.addresses?.[0] ?? user?.address?.[0];
  const address = rawAddress
    ? {
        houseNo: rawAddress.houseNo,
        villageNo: rawAddress.villageNo,
        soi: rawAddress.soi,
        road: rawAddress.road,
        subdistrictId: rawAddress.subdistrictId ?? rawAddress.subdistrict,
        districtId: rawAddress.districtId ?? rawAddress.district,
        provinceId: rawAddress.provinceId ?? rawAddress.province,
      }
    : undefined;
  const emergency = user?.emergencyContacts?.[0] ?? user?.emergency?.[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงข้อมูลจังหวัด
        const provincesRes = await fetch("/api/data/provinces");
        const provincesData = await provincesRes.json();

        setProvinces(provincesData);

        // ดึงข้อมูลอำเภอ
        const districtsRes = await fetch("/api/data/districts");
        const districtsData = await districtsRes.json();

        setDistricts(districtsData);

        // ดึงข้อมูลตำบล
        const subdistrictsRes = await fetch("/api/data/subdistricts");
        const subdistrictsData = await subdistrictsRes.json();

        setSubdistricts(subdistrictsData);
      } catch (error) {
        addToast({
          title: "ผิดพลาด",
          description:
            "ไม่สามารถดึงข้อมูลจากระบบ" +
            (error instanceof Error ? error.message : "ไม่ระบุข้อมูล"),
          color: "danger",
        });
      }
    };

    fetchData();
  }, []);

  // ฟังก์ชันสำหรับหาชื่อจากรหัส
  const getProvinceName = (provinceId: string | number) => {
    const province = provinces.find(
      (p) => p.id === parseInt(provinceId.toString())
    );

    return province?.nameInThai || provinceId;
  };

  const getDistrictName = (districtId: string | number) => {
    const district = districts.find(
      (d) => d.id === parseInt(districtId.toString())
    );

    return district?.nameInThai || districtId;
  };

  const getSubdistrictName = (subdistrictId: string | number) => {
    const subdistrict = subdistricts.find(
      (s) => s.id === parseInt(subdistrictId.toString())
    );

    return subdistrict?.nameInThai || subdistrictId;
  };

  const handleResetLine = async () => {
    if (!user) return;

    setIsResettingLine(true);

    try {
      const response = await fetch(`/api/profile/user/${user.id}/reset-line`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "ไม่สามารถรีเซ็ตการเชื่อมต่อ LINE ได้"
        );
      }

      addToast({
        title: "สำเร็จ",
        description: "รีเซ็ตการเชื่อมต่อ LINE แล้ว",
        color: "success",
      });

      setIsResetLineModalOpen(false);

      if (onMutate) {
        await onMutate();
      }
    } catch (error) {
      addToast({
        title: "ผิดพลาด",
        description:
          error instanceof Error
            ? error.message
            : "ไม่สามารถรีเซ็ตการเชื่อมต่อ LINE ได้",
        color: "danger",
      });
    } finally {
      setIsResettingLine(false);
    }
  };

  const resultToColor = (
    result: string
  ): "success" | "warning" | "danger" | "default" => {
    switch (result) {
      case "Green":
      case "Green-Low":
        return "success";
      case "Yellow":
      case "Orange":
        return "warning";
      case "Red":
        return "danger";
      default:
        return "default";
    }
  };

  if (!user) return null;

  return (
    <Drawer
      closeButton={false}
      isOpen={isOpen}
      placement="right"
      size="4xl"
      onClose={onClose}
    >
      <DrawerContent>
        <DrawerHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {mode === "view" ? "รายละเอียดผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}
          </h3>
        </DrawerHeader>
        <Divider />
        <DrawerBody>
          <div className="space-y-6">
            {/* ข้อมูลส่วนตัว */}
            <Card className="mb-4">
              <CardBody>
                <h4 className="text-md font-semibold mb-3 text-primary">
                  ข้อมูลส่วนตัว
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <span className="text-default-500">ชื่อ-นามสกุล:</span>
                    <span className="font-medium ml-2">
                      {
                        prefix.find(
                          (val) => val.key == user.prefixId.toString()
                        )?.label
                      }{" "}
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">เลขบัตรประชาชน:</span>
                    <span className="font-medium ml-2">{user.citizenId}</span>
                  </div>
                  <div>
                    <span className="text-default-500">เพศ:</span>
                    <span className="font-medium ml-2">
                      {user.sex === 1
                        ? "ชาย"
                        : user.sex === 2
                          ? "หญิง"
                          : "ไม่ระบุ"}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">วัน/เดือน/ปี เกิด:</span>
                    <span className="font-medium ml-2">
                      {formatThaiDate(user.birthDate || user.birthday || "")}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">เชื้อชาติ:</span>
                    <span className="font-medium ml-2">
                      {user.ethnicity || "-"}
                    </span>
                    <span className="text-default-500 ml-4">สัญชาติ:</span>
                    <span className="font-medium ml-2">
                      {user.nationality || "-"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-default-500">ที่อยู่:</span>
                    {address ? (
                      <span className="font-medium ml-2">
                        {address.houseNo ? `${address.houseNo} ` : ""}
                        {address.villageNo
                          ? `หมู่ที่ ${address.villageNo} `
                          : ""}
                        {address.soi ? `ซอย ${address.soi} ` : ""}
                        {address.road ? `ถนน ${address.road} ` : ""}
                        {address.subdistrictId
                          ? `ตำบล${getSubdistrictName(address.subdistrictId)} `
                          : ""}
                        {address.districtId
                          ? `อำเภอ${getDistrictName(address.districtId)} `
                          : ""}
                        {address.provinceId
                          ? `จังหวัด${getProvinceName(address.provinceId)}`
                          : ""}
                      </span>
                    ) : (
                      <span className="font-medium ml-2">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-default-500">เบอร์โทรศัพท์:</span>
                    <span className="font-medium ml-2">
                      {user.phone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">หน่วยงาน:</span>
                    <span className="font-medium ml-2">
                      {user.healthcareFacility?.name?.trim() || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-default-500">โรงเรียน:</span>
                    <span className="font-medium ml-2">
                      {user.school?.name || "-"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-default-500">ผู้ติดต่อฉุกเฉิน:</span>
                    {emergency ? (
                      <>
                        <span className="font-medium ml-2">
                          {emergency.name || "-"}
                        </span>
                        <span className="text-default-500 ml-4">โทรศัพท์:</span>
                        <span className="font-medium ml-2">
                          {emergency.phone || emergency.tel || "-"}
                        </span>
                        <span className="text-default-500 ml-4">
                          ความสัมพันธ์:
                        </span>
                        <span className="font-medium ml-2">
                          {emergency.relation || "-"}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium ml-2">-</span>
                    )}
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-default-500 shrink-0">LINE:</span>
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <LineIcon
                          className={
                            isLineLinked
                              ? "shrink-0"
                              : "shrink-0 grayscale opacity-40"
                          }
                          size={20}
                        />
                        <span className="font-medium truncate">
                          {isLineLinked
                            ? user.user?.name || "เชื่อมต่อแล้ว"
                            : "ยังไม่เชื่อมต่อ"}
                        </span>
                      </span>
                    </div>
                    {mode === "edit" && isLineLinked && (
                      <Button
                        className="shrink-0"
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={() => setIsResetLineModalOpen(true)}
                      >
                        รีเซ็ตการเชื่อมต่อ
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
              {mode === "edit" && (
                <CardFooter className="flex justify-end">
                  <Button
                    color="warning"
                    size="md"
                    variant="flat"
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    แก้ไขข้อมูล
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Divider />

            {/* ข้อมูลแบบประเมิน */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold mb-3 text-primary">
                  ข้อมูลแบบประเมิน
                </h4>
                {mode === "edit" && (
                  <Button
                    color="success"
                    size="md"
                    startContent={
                      <PlusIcon className="size-6 text-success-500" />
                    }
                    variant="flat"
                    onClick={() => {
                      setIsAddQuestionModalOpen(true);
                    }}
                  >
                    เพิ่มแบบประเมิน
                  </Button>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-default-500">จำนวนเคส:</span>
                <Chip
                  color={cases.length > 0 ? "primary" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {cases.length} รายการ
                </Chip>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                {cases.length > 0 ? (
                  cases.map((caseItem) => {
                    const formattedDate = formatThaiDateTime(
                      caseItem.createdAt
                    );
                    const q2 = caseItem.questions2Q;
                    const phqa = caseItem.questionsPhqa;
                    const addon = caseItem.questionsPhqaAddon;
                    const q9 = caseItem.questions9Q;
                    const q8 = caseItem.questions8Q;

                    return (
                      <div
                        key={caseItem.id}
                        className="flex flex-col md:flex-row items-start justify-between gap-2 p-2 bg-default-100 rounded-md border border-default-200"
                      >
                        <div className="flex flex-col flex-1 gap-1">
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <span className="text-sm text-default-600">
                              {formattedDate}
                            </span>
                            {caseItem.volunteer && (
                              <span className="text-xs text-default-500">
                                อาสาสมัคร: {caseItem.volunteer.firstName}{" "}
                                {caseItem.volunteer.lastName}
                                {caseItem.volunteer.affiliation && (
                                  <span className="ml-1">
                                    ({caseItem.volunteer.affiliation.name})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {q2?.length ||
                          phqa?.length ||
                          addon?.length ||
                          q9?.length ||
                          q8?.length ? (
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {q2?.[0] &&
                                (() => {
                                  const score = q2[0].q1 + q2[0].q2;

                                  return (
                                    <Chip
                                      color={
                                        score === 0 ? "success" : "warning"
                                      }
                                      size="sm"
                                      variant="flat"
                                    >
                                      2Q: {score} คะแนน
                                      {" · "}
                                      {score === 0
                                        ? "ไม่พบความเสี่ยง"
                                        : "พบความเสี่ยง"}
                                    </Chip>
                                  );
                                })()}
                              {q9?.[0] ? (
                                <Chip
                                  color={resultToColor(
                                    getNineQRiskLevel(q9[0].sum)
                                  )}
                                  size="sm"
                                  variant="flat"
                                >
                                  9Q: {q9[0].sum} คะแนน
                                  {" · "}
                                  {getNineQRiskText(q9[0].sum)}
                                </Chip>
                              ) : (
                                <>
                                  {phqa?.[0] && (
                                    <Chip
                                      color={resultToColor(
                                        getPhqaRiskLevel(phqa[0].sum)
                                      )}
                                      size="sm"
                                      variant="flat"
                                    >
                                      PHQ-A: {phqa[0].sum} คะแนน
                                      {" · "}
                                      {getPhqaRiskText(phqa[0].sum)}
                                    </Chip>
                                  )}
                                  {addon?.[0] &&
                                    (() => {
                                      const score = addon[0].q1 + addon[0].q2;

                                      return (
                                        <Chip
                                          color={
                                            score === 0 ? "success" : "warning"
                                          }
                                          size="sm"
                                          variant="flat"
                                        >
                                          Addon: {score} คะแนน
                                          {" · "}
                                          {score === 0
                                            ? "ไม่พบความเสี่ยง"
                                            : "พบความเสี่ยง"}
                                        </Chip>
                                      );
                                    })()}
                                </>
                              )}
                              {q8?.[0] && (
                                <Chip
                                  color={q8[0].sum > 0 ? "danger" : "success"}
                                  size="sm"
                                  variant="flat"
                                >
                                  8Q: {q8[0].sum} คะแนน
                                  {" · "}
                                  {q8[0].sum > 0
                                    ? "พบความเสี่ยง"
                                    : "ไม่พบความเสี่ยง"}
                                </Chip>
                              )}
                            </div>
                          ) : null}
                        </div>
                        {mode === "edit" && (
                          <Button
                            isIconOnly
                            className="text-default-400"
                            variant="light"
                            onClick={() => {}}
                          >
                            <PencilIcon className="size-6 text-warning-400" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-default-400 italic">ไม่มีเคส</span>
                )}
              </div>
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button color="danger" size="md" variant="flat" onClick={onClose}>
            ปิด
          </Button>
        </DrawerFooter>
      </DrawerContent>

      <ModalEditProfile
        data={{
          profile: {
            ...user,
            address: user.addresses ?? user.address ?? [],
            emergency: user.emergencyContacts ?? user.emergency ?? [],
          },
        }}
        isOpen={isModalOpen}
        mode={"edit"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSuccess={() => {
          // รีเฟรชข้อมูลหลังจากบันทึกสำเร็จ
          if (onRefresh) {
            onRefresh();
          }
        }}
      />
      <ModalAddQuestion
        birthday={user.birthDate || user.birthday}
        isOpen={isAddQuestionModalOpen}
        userId={user.id}
        onClose={() => {
          setIsAddQuestionModalOpen(false);
        }}
        onSuccess={() => {
          // รีเฟรชข้อมูลหลังจากบันทึกสำเร็จ
          if (onRefresh) {
            onRefresh();
          }
        }}
      />

      <Modal
        isOpen={isResetLineModalOpen}
        placement="center"
        onClose={() => setIsResetLineModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>รีเซ็ตการเชื่อมต่อ LINE</ModalHeader>
          <ModalBody>
            <p>
              ต้องการยกเลิกการเชื่อมต่อ LINE ของ{" "}
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>{" "}
              ใช่หรือไม่?
            </p>
            <p className="text-small text-default-500 mt-2">
              ผู้ใช้งานจะต้องเชื่อมต่อ LINE ใหม่ผ่านแอปก่อนใช้งานต่อ
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={() => setIsResetLineModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              color="danger"
              isLoading={isResettingLine}
              onPress={handleResetLine}
            >
              ยืนยันรีเซ็ต
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Drawer>
  );
}
