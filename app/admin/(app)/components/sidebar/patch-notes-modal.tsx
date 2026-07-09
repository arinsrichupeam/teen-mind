import { Chip } from "@heroui/chip";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";

import packageJson from "../../../../../package.json";

import patchNotes from "./patch-notes.json";

export interface PatchNoteItem {
  version: string;
  date?: string;
  changes: string[];
}

interface PatchNotesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatchNoteCardProps {
  version: string;
  date?: string;
  changes: string[];
  featured?: boolean;
  showCurrentVersionChip?: boolean;
}

function PatchNoteCard({
  version,
  date,
  changes,
  featured,
  showCurrentVersionChip,
}: PatchNoteCardProps) {
  if (featured) {
    return (
      <div className="rounded-xl border-2 border-primary bg-primary-50 dark:bg-primary-950/20 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-default-900">v{version}</h2>
          <Chip color="primary" size="sm" variant="flat">
            ล่าสุด
          </Chip>
          {showCurrentVersionChip ? (
            <Chip color="secondary" size="sm" variant="flat">
              Current Version
            </Chip>
          ) : null}
        </div>
        {date ? (
          <p className="mt-1 text-xs text-default-500">วันที่อัปเดต: {date}</p>
        ) : null}
        <ul className="mt-3 list-disc space-y-2 pl-5 text-default-700">
          {changes.map((change) => (
            <li key={`${version}-${change}`}>{change}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-default-200 bg-content1 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-default-700">v{version}</h3>
        {showCurrentVersionChip ? (
          <Chip color="secondary" size="sm" variant="flat">
            Current Version
          </Chip>
        ) : null}
      </div>
      {date ? (
        <p className="mt-1 text-xs text-default-400">วันที่อัปเดต: {date}</p>
      ) : null}
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-default-600">
        {changes.map((change) => (
          <li key={`${version}-${change}`}>{change}</li>
        ))}
      </ul>
    </div>
  );
}

export function PatchNotesModal({
  isOpen,
  onOpenChange,
}: PatchNotesModalProps) {
  const allPatchNotes = [...(patchNotes as PatchNoteItem[])];
  const sortedPatchNotes = allPatchNotes.sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true })
  );
  const currentVersion = packageJson.version;
  const latestPatchNote = sortedPatchNotes[0];
  const hasCurrentVersionPatchNote = sortedPatchNotes.some(
    (item) => item.version === currentVersion
  );

  const olderPatchNotes = sortedPatchNotes.filter(
    (item) => item.version !== latestPatchNote?.version
  );

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      size="lg"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Patch Notes</ModalHeader>
        <ModalBody className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain pb-6">
          <p className="text-sm text-default-500">
            รายการอัปเดตของระบบ Teen Mind ในแต่ละเวอร์ชัน
          </p>
          {!hasCurrentVersionPatchNote ? (
            <p className="text-xs text-warning-600 dark:text-warning-400">
              ระบบกำลังใช้งาน v{currentVersion} แต่ยังไม่มีบันทึก Patch Note
              ของเวอร์ชันนี้ (แสดงรายการล่าสุดแทน)
            </p>
          ) : null}
          <div className="space-y-3">
            {latestPatchNote ? (
              <PatchNoteCard
                featured
                changes={latestPatchNote.changes}
                date={latestPatchNote.date}
                showCurrentVersionChip={
                  latestPatchNote.version === currentVersion
                }
                version={latestPatchNote.version}
              />
            ) : null}

            {olderPatchNotes.length > 0 ? (
              <>
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-default-200" />
                  <span className="text-xs text-default-400 font-medium">
                    เวอร์ชันก่อนหน้า
                  </span>
                  <div className="h-px flex-1 bg-default-200" />
                </div>

                {olderPatchNotes.map((patch) => (
                  <PatchNoteCard
                    key={patch.version}
                    changes={patch.changes}
                    date={patch.date}
                    showCurrentVersionChip={patch.version === currentVersion}
                    version={patch.version}
                  />
                ))}
              </>
            ) : null}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
