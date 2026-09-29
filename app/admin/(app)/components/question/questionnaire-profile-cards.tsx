"use client";

import moment from "moment";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Image,
  Link,
} from "@heroui/react";

import { CaseLocationMap, toMapCoord } from "./case-location-map";

import { QuestionsData } from "@/types";
import { prefix } from "@/utils/data";

type QuestionnaireProfileCardsProps = {
  data: QuestionsData;
  questionData: QuestionsData;
  addressLine: string;
  districtName: string;
  provinceName: string;
  subdistrictName: string;
  sendMessageLoading: boolean;
  onSendLine: () => void;
  onEditProfile: () => void;
};

export function QuestionnaireProfileCards({
  data,
  questionData,
  addressLine: _addressLine,
  districtName,
  provinceName,
  subdistrictName,
  sendMessageLoading,
  onSendLine,
  onEditProfile,
}: QuestionnaireProfileCardsProps) {
  void _addressLine;
  const profile = questionData?.profile ?? data?.profile;
  const mapLat =
    toMapCoord(questionData?.latitude) ?? toMapCoord(data?.latitude) ?? 0;
  const mapLng =
    toMapCoord(questionData?.longitude) ?? toMapCoord(data?.longitude) ?? 0;
  const caseFacilityName =
    (
      questionData?.healthcareFacility ?? data?.healthcareFacility
    )?.name?.trim() || "";

  return (
    <div className="mx-auto flex w-full flex-col justify-center gap-5 sm:flex-row">
      <Card className="w-[400px]">
        <CardHeader className="flex gap-3">
          <Image
            key={`image-${profile?.id}-${questionData?.id || data?.id}`}
            alt={`รูปภาพ ${profile?.id}`}
            className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity min-w-[100px] h-[100px]"
            fallbackSrc="https://placehold.co/100x100?text=NO+IMAGE\\nAVAILABLE"
            height={100}
            loading="eager"
            src={profile?.user?.image || undefined}
            width={100}
          />
          <div className="flex flex-col">
            <p className="text-small">
              LINE : <b>{profile?.user?.name || "-"}</b>
            </p>
            <p className="text-md">
              {prefix.find((val) => val.key == profile?.prefixId)?.label}{" "}
              {profile?.firstName} {profile?.lastName}
            </p>
            <p className="text-small">
              เลขที่บัตรประชาชน : <b>{profile?.citizenId}</b>
            </p>
            <p className="text-small">
              วัน/เดือน/ปี เกิด :{" "}
              <b>
                {moment(profile?.birthDate)
                  .add(543, "year")
                  .locale("th-TH")
                  .format("DD/MM/YYYY")}
              </b>
            </p>
            <p className="text-small">
              เชื้อชาติ : <b>{profile?.ethnicity}</b> สัญชาติ :{" "}
              <b>{profile?.nationality}</b>
            </p>
            <p className="text-small">
              หน่วยงานเจ้าของเคส : <b>{caseFacilityName || "-"}</b>
            </p>
            {typeof profile?.school === "object" && profile.school?.name ? (
              <p className="text-small">
                สถานศึกษา : <b>{profile.school.name}</b>
              </p>
            ) : null}
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div>
            <p className="text-small">
              ที่อยู่ : <b>{profile?.address?.[0]?.houseNo || "-"}</b> หมู่ที่ :{" "}
              <b>
                {profile?.address?.[0]?.villageNo == ""
                  ? "-"
                  : profile?.address?.[0]?.villageNo || "-"}
              </b>{" "}
              ซอย : <b>{profile?.address?.[0]?.soi || "-"}</b>
            </p>
            <p className="text-small">
              ถนน : <b>{profile?.address?.[0]?.road || "-"}</b> ตำบล :{" "}
              <b>{subdistrictName || "-"}</b> อำเภอ :{" "}
              <b>{districtName || "-"}</b>
            </p>
            <p className="text-small">
              จังหวัด : <b>{provinceName || "-"}</b> โทรศัพท์ :{" "}
              <b>{profile?.phone || "-"}</b>
            </p>
          </div>
        </CardBody>
        <Divider />
        <CardBody>
          <div>
            <p className="text-small">
              ชื่อผู้ติดต่อฉุกเฉิน :{" "}
              <b>{profile?.emergency?.[0]?.name || "-"}</b>
            </p>
            <p className="text-small">
              โทรศัพท์ : <b>{profile?.emergency?.[0]?.phone || "-"}</b>{" "}
              ความสัมพันธ์ : <b>{profile?.emergency?.[0]?.relation || "-"}</b>
            </p>
          </div>
        </CardBody>
        <Divider />
        <CardFooter>
          <div className="flex flex-row gap-4 justify-center w-full">
            <Button
              color="primary"
              isDisabled={sendMessageLoading}
              isLoading={sendMessageLoading}
              startContent={
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#06C755] px-1 text-[10px] font-semibold text-white">
                  LINE
                </span>
              }
              variant="flat"
              onPress={onSendLine}
            >
              ส่งข้อความ
            </Button>
            <Button color="warning" variant="flat" onPress={onEditProfile}>
              แก้ไขข้อมูลส่วนตัว
            </Button>
          </div>
        </CardFooter>
      </Card>
      <Card className="w-[400px]">
        <CardBody>
          <div className="mx-auto w-[352px] h-[265px]">
            <CaseLocationMap
              height="100%"
              label="ตำแหน่งที่ประเมิน"
              lat={mapLat}
              lng={mapLng}
            />
          </div>
        </CardBody>
        <Divider />
        <CardFooter>
          <Link
            isExternal
            showAnchorIcon
            href={`https://www.google.co.th/maps/place/${mapLat},${mapLng}`}
          >
            ดูบนแผนที่
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
