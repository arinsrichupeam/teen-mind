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
}

function PatchNoteCard({
  version,
  date,
  changes,
  featured,
}: PatchNoteCardProps) {
  const titleClass = featured
    ? "text-lg font-semibold text-default-900"
    : "text-base font-semibold text-default-900";

  return (
    <div className="rounded-xl border border-default-200 bg-content1 p-4">
      {featured ? (
        <h2 className={titleClass}>v{version}</h2>
      ) : (
        <h3 className={titleClass}>v{version}</h3>
      )}
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

export function PatchNotesModal({
  isOpen,
  onOpenChange,
}: PatchNotesModalProps) {
  const allPatchNotes = patchNotes as PatchNoteItem[];
  const latestPatchNote =
    allPatchNotes.find((item) => item.version === packageJson.version) ??
    allPatchNotes[0];

  const olderPatchNotes = allPatchNotes.filter(
    (item) => item.version !== latestPatchNote?.version
  );

  return (
    <Modal isOpen={isOpen} size="lg" onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Patch Note</ModalHeader>
        <ModalBody className="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain pb-6">
          <p className="text-default-600">
            รายการอัปเดตของระบบ Teen Mind ในแต่ละเวอร์ชัน
          </p>
          <div className="space-y-3">
            {latestPatchNote ? (
              <PatchNoteCard
                featured
                changes={latestPatchNote.changes}
                date={latestPatchNote.date}
                version={latestPatchNote.version}
              />
            ) : null}
            {olderPatchNotes.map((patch) => (
              <PatchNoteCard
                key={patch.version}
                changes={patch.changes}
                date={patch.date}
                version={patch.version}
              />
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
