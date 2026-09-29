"use client";

import { useEffect, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import moment from "moment";
import { Button, Image, Input, Link } from "@heroui/react";

import { CaseLocationMap, toMapCoord } from "./case-location-map";
import {
  CaseServiceHistoryModal,
  fetchHasPriorClosedCases,
} from "./case-service-history-modal";
import { consultationToolbarBtnClass } from "./consultation-ui";

import { QuestionsData } from "@/types";
import { prefix } from "@/utils/data";

type ConsultationCitizenHeaderProps = {
  data: QuestionsData;
  questionData: QuestionsData;
  mode: string;
  expanded: boolean;
  onToggleExpanded: () => void;
  addressLine: string;
  hnLoading: boolean;
  nhsoLoading: boolean;
  sendMessageLoading: boolean;
  onHnChange: (value: string) => void;
  onSaveHn: () => void;
  onNhsoChange: (value: string) => void;
  onSaveNhso: () => void;
  onSearchAndSave: (opts: { hn: boolean; nhso: boolean }) => void;
  onSendLine: () => void;
  onEditProfile: () => void;
};

export function ConsultationCitizenHeader({
  data,
  questionData,
  mode,
  expanded,
  onToggleExpanded,
  addressLine,
  hnLoading,
  nhsoLoading,
  sendMessageLoading,
  onHnChange,
  onSaveHn,
  onNhsoChange,
  onSaveNhso,
  onSearchAndSave,
  onSendLine,
  onEditProfile,
}: ConsultationCitizenHeaderProps) {
  const profile = questionData?.profile ?? data?.profile;
  const currentCaseId = questionData?.id ?? data?.id;
  const profileId = profile?.id;
  const caseFacilityName =
    (
      questionData?.healthcareFacility ?? data?.healthcareFacility
    )?.name?.trim() || "";
  const persistedHn = Boolean(String(profile?.hn ?? "").trim());
  const draftHn = questionData?.hn || profile?.hn || "";
  const nhsoDraft = questionData?.nhsoDraft;
  const persistedInsurance =
    profile?.mainInsclName?.trim() || profile?.mainInsclCode?.trim() || "";
  const draftInsurance =
    nhsoDraft?.mainInsclName?.trim() || nhsoDraft?.mainInsclCode?.trim() || "";
  const insuranceLabel = persistedInsurance || draftInsurance;
  const fullName = `${
    prefix.find((val) => val.key == profile?.prefixId)?.label ?? ""
  }${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();
  const mapLat =
    toMapCoord(questionData?.latitude) ?? toMapCoord(data?.latitude);
  const mapLng =
    toMapCoord(questionData?.longitude) ?? toMapCoord(data?.longitude);
  const hasMap =
    mapLat != null && mapLng != null && !(mapLat === 0 && mapLng === 0);
  const emergency = profile?.emergency?.[0];
  const emergencyLine = emergency
    ? [
        emergency.name || null,
        emergency.phone || null,
        emergency.relation ? `(${emergency.relation})` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const needsHn = !persistedHn && mode === "edit-consultation";
  const needsNhso = !persistedInsurance && mode === "edit-consultation";
  const needsLookup = needsHn || needsNhso;
  const lookupLoading = hnLoading || nhsoLoading;
  const lookupButtonLabel =
    needsHn && needsNhso
      ? "ค้นหาและบันทึก"
      : needsHn
        ? "ค้นหาและบันทึก HN"
        : "ค้นหาและบันทึกสิทธิ";
  const mapHref = `https://www.google.co.th/maps/place/${mapLat},${mapLng}`;

  const [hasHistory, setHasHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!profileId || !currentCaseId) {
      setHasHistory(false);

      return;
    }

    let cancelled = false;

    void fetchHasPriorClosedCases(profileId, currentCaseId).then((ok) => {
      if (!cancelled) setHasHistory(ok);
    });

    return () => {
      cancelled = true;
    };
  }, [profileId, currentCaseId]);

  const compactMeta = [
    draftHn ? `HN ${draftHn}` : null,
    profile?.phone || null,
    insuranceLabel ? `สิทธิ ${insuranceLabel}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="shrink-0 border-b border-default-200 bg-content1 px-3 py-2.5 sm:px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <button
            className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg text-left outline-none transition-colors hover:bg-default-100/80 focus-visible:ring-2 focus-visible:ring-primary"
            type="button"
            onClick={onToggleExpanded}
          >
            <Image
              key={`compact-image-${profile?.id || data?.id}`}
              alt={`รูปภาพ ${fullName || "ผู้รับบริการ"}`}
              className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover"
              fallbackSrc="https://placehold.co/40x40?text=—"
              height={40}
              loading="eager"
              src={profile?.user?.image ? profile.user.image : undefined}
              width={40}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                  {fullName || "—"}
                </p>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-default-400 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </div>
              <p className="truncate text-xs text-default-500 sm:text-sm">
                {compactMeta || "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-primary sm:text-xs">
                {expanded ? "ย่อรายละเอียด" : "กดเพื่อดูข้อมูลเต็ม"}
              </p>
            </div>
          </button>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {hasHistory && profileId && currentCaseId && (
              <Button
                isIconOnly
                aria-label="ประวัติการรับบริการ"
                className="h-8 min-w-8"
                color="default"
                size="sm"
                title="ประวัติการรับบริการ"
                variant="bordered"
                onPress={() => setHistoryOpen(true)}
              >
                <ClockIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              className="h-8 min-w-0 bg-[#06C755] px-2.5 text-xs text-white data-[hover=true]:bg-[#05b34c]"
              isDisabled={sendMessageLoading}
              isLoading={sendMessageLoading}
              size="sm"
              startContent={
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-semibold leading-none">
                  LINE
                </span>
              }
              onPress={onSendLine}
            >
              ข้อความ
            </Button>
            {mode === "edit-consultation" && (
              <Button
                className="h-8 min-w-0 px-2.5 text-xs"
                color="default"
                size="sm"
                variant="bordered"
                onPress={onEditProfile}
              >
                แก้ไขโปรไฟล์
              </Button>
            )}
            {hasMap && (
              <Button
                isExternal
                isIconOnly
                aria-label="แผนที่"
                as={Link}
                className="h-8 min-w-8"
                color="default"
                href={mapHref}
                size="sm"
                title="แผนที่"
                variant="bordered"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {needsLookup && (
          <div className="flex flex-col gap-2 rounded-lg border border-primary-200 bg-primary-50/50 p-2 dark:border-primary-400/30 dark:bg-primary-400/10 sm:flex-row sm:items-end">
            {needsHn && (
              <Input
                aria-label="HN"
                className="min-w-0 flex-1"
                classNames={{
                  inputWrapper: "bg-content1",
                }}
                name="hn"
                placeholder="กรอก HN (หรือกดค้นหา)"
                size="sm"
                value={draftHn}
                variant="bordered"
                onChange={(e) => onHnChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSaveHn();
                  }
                }}
              />
            )}
            {needsNhso && (
              <Input
                aria-label="สิทธิการรักษา"
                className="min-w-0 flex-1"
                classNames={{
                  inputWrapper: "bg-content1",
                }}
                name="insurance"
                placeholder="กรอกสิทธิ (หรือกดค้นหา)"
                size="sm"
                value={
                  nhsoDraft?.mainInsclName ?? nhsoDraft?.mainInsclCode ?? ""
                }
                variant="bordered"
                onChange={(e) => onNhsoChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSaveNhso();
                  }
                }}
              />
            )}
            <Button
              className={`${consultationToolbarBtnClass} w-full shrink-0 sm:w-auto`}
              color="primary"
              isLoading={lookupLoading}
              size="sm"
              type="button"
              onPress={() => onSearchAndSave({ hn: needsHn, nhso: needsNhso })}
            >
              {lookupButtonLabel}
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-2.5 space-y-3 rounded-lg bg-default-50 px-3 py-3 text-sm text-default-700">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p>
                <span className="text-default-500">เลขบัตรประชาชน: </span>
                <span className="font-medium text-foreground">
                  {profile?.citizenId || "—"}
                </span>
              </p>
              {profile?.user?.name && (
                <p>
                  <span className="text-default-500">LINE: </span>
                  <span className="font-medium text-foreground">
                    {profile.user.name}
                  </span>
                </p>
              )}
              <p>
                <span className="text-default-500">สิทธิการรักษา: </span>
                <span className="font-medium text-foreground">
                  {insuranceLabel || "—"}
                  {profile?.subInsclName?.trim()
                    ? ` · ${profile.subInsclName.trim()}`
                    : profile?.subInsclCode?.trim()
                      ? ` · ${profile.subInsclCode.trim()}`
                      : ""}
                </span>
              </p>
              {(profile?.hmainName || profile?.hmainCode) && (
                <p>
                  <span className="text-default-500">รพ.หลักตามสิทธิ: </span>
                  <span className="font-medium text-foreground">
                    {profile.hmainName?.trim() || profile.hmainCode}
                  </span>
                </p>
              )}
              <p>
                <span className="text-default-500">วันเกิด: </span>
                <span className="font-medium text-foreground">
                  {profile?.birthDate
                    ? moment(profile.birthDate)
                        .add(543, "year")
                        .locale("th-TH")
                        .format("DD/MM/YYYY")
                    : "—"}
                </span>
              </p>
              <p>
                <span className="text-default-500">เชื้อชาติ / สัญชาติ: </span>
                <span className="font-medium text-foreground">
                  {profile?.ethnicity || "—"} / {profile?.nationality || "—"}
                </span>
              </p>
              <p>
                <span className="text-default-500">หน่วยงานเจ้าของเคส: </span>
                <span className="font-medium text-foreground">
                  {caseFacilityName || "—"}
                </span>
              </p>
              {typeof profile?.school === "object" && profile.school?.name ? (
                <p>
                  <span className="text-default-500">สถานศึกษา: </span>
                  <span className="font-medium text-foreground">
                    {profile.school.name}
                  </span>
                </p>
              ) : null}
              <p>
                <span className="text-default-500">ที่อยู่: </span>
                <span className="font-medium text-foreground">
                  {addressLine || "—"}
                </span>
              </p>
            </div>
            <div className="space-y-1.5 rounded-md border border-danger-100 bg-danger-50/50 px-3 py-2">
              <p className="font-semibold text-danger-700">ผู้ติดต่อฉุกเฉิน</p>
              <p>
                <span className="text-default-500">ชื่อ: </span>
                <span className="font-medium text-foreground">
                  {emergency?.name || "—"}
                </span>
              </p>
              <p>
                <span className="text-default-500">โทรศัพท์: </span>
                <span className="font-medium text-foreground">
                  {emergency?.phone || "—"}
                </span>
              </p>
              <p>
                <span className="text-default-500">ความสัมพันธ์: </span>
                <span className="font-medium text-foreground">
                  {emergency?.relation || "—"}
                </span>
              </p>
              {!emergencyLine && (
                <p className="text-default-400">
                  ยังไม่มีข้อมูลผู้ติดต่อฉุกเฉิน
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">ตำแหน่งที่ประเมิน</p>
            {hasMap ? (
              <>
                <div className="h-[220px] w-full overflow-hidden rounded-md border border-default-200 bg-default-100">
                  <CaseLocationMap
                    invalidateOnMount
                    height="100%"
                    label={fullName || "ตำแหน่งที่ประเมิน"}
                    lat={mapLat!}
                    lng={mapLng!}
                    mapKey={`consult-map-${data?.id}-${mapLat}-${mapLng}-${expanded}`}
                  />
                </div>
                <Link
                  isExternal
                  showAnchorIcon
                  className="text-sm"
                  href={mapHref}
                >
                  ดูบนแผนที่
                </Link>
              </>
            ) : (
              <p className="text-default-500">ไม่มีพิกัดตำแหน่งของเคสนี้</p>
            )}
          </div>
        </div>
      )}

      {profileId && currentCaseId && (
        <CaseServiceHistoryModal
          currentCaseId={currentCaseId}
          isOpen={historyOpen}
          profileId={profileId}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
