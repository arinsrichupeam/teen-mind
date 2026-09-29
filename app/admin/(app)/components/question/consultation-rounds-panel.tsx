"use client";

import type { TreatmentNoteLike } from "@/lib/case-flat";
import type { Consultant } from "@/types";

import { CheckCircleIcon, PlusIcon } from "@heroicons/react/24/solid";
import {
  addToast,
  Autocomplete,
  AutocompleteItem,
  Button,
  DatePicker,
  Divider,
  Switch,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";

import { ConsultScheduleDateTimePicker } from "./consult-schedule-datetime-picker";
import {
  consultationFieldClassNames,
  consultationRoundTabClassNames,
} from "./consultation-ui";
import { SessionReportFields } from "./session-report-fields";

import {
  isEndFollowUpAfterCare,
  isSessionReportComplete,
  isTransferAfterCare,
  type AfterCarePlanCode,
} from "@/lib/session-report";
import {
  canOpenNoteRound,
  emptyTreatmentNote,
  applyDefaultConsult,
  isNoteConsultComplete,
  isNoteFollowUpComplete,
  isNoteSoapComplete,
  isNoteUnreachable,
  isNoteUnreachableDocumented,
  nextTreatmentNoteRound,
  normalizeTreatmentNotes,
  toNotesApiPayload,
  type TreatmentNoteDraft,
} from "@/lib/treatment-note-rounds";
import { dateTimePickerValueToDate, safeParseDate } from "@/utils/helper";

export type SoapSavedPrompt = "transfer" | "closeCase" | null;

export type ConsultationSaveFooterState = {
  visible: boolean;
  label: string;
  disabled: boolean;
  loading: boolean;
  color: "primary" | "success";
  variant: "solid" | "flat";
};

export type ConsultationRoundsHandle = {
  save: () => Promise<void>;
};

function parseDateForPicker(
  val: Date | string | null | undefined
): import("@internationalized/date").CalendarDate | null | undefined {
  const p = safeParseDate(val);

  return p != null && typeof p !== "string" ? p : undefined;
}

type Props = {
  caseId: string;
  notes: TreatmentNoteLike[] | null | undefined;
  consultants: Consultant[];
  /** Case assignee key (User.id preferred) — defaults empty ผู้ให้คำปรึกษา */
  defaultConsultId?: string | null;
  readOnly?: boolean;
  /** true เมื่อยังไม่มี HN หรือยังไม่รับเคส */
  locked?: boolean;
  onNotesChange?: (notes: TreatmentNoteDraft[]) => void;
  /** เรียกหลังบันทึก SOAP รอบสำเร็จ — prompt จากแผนหลังให้คำปรึกษา */
  onSoapSaved?: (result: { prompt: SoapSavedPrompt }) => void;
  onSaveFooterChange?: (state: ConsultationSaveFooterState) => void;
};

export const ConsultationRoundsPanel = forwardRef<
  ConsultationRoundsHandle,
  Props
>(function ConsultationRoundsPanel(
  {
    caseId,
    notes: notesProp,
    consultants,
    defaultConsultId = null,
    readOnly = false,
    locked = false,
    onNotesChange,
    onSoapSaved,
    onSaveFooterChange,
  },
  ref
) {
  const [notes, setNotes] = useState(() =>
    applyDefaultConsult(normalizeTreatmentNotes(notesProp), defaultConsultId)
  );
  const notesRef = useRef(notes);
  const [selectedKey, setSelectedKey] = useState(
    () =>
      `r${applyDefaultConsult(normalizeTreatmentNotes(notesProp), defaultConsultId)[0]!.round}`
  );
  const [savingRound, setSavingRound] = useState<number | null>(null);
  const [savedRounds, setSavedRounds] = useState<Record<number, boolean>>({});
  const [soapSavedRounds, setSoapSavedRounds] = useState<
    Record<number, boolean>
  >({});

  notesRef.current = notes;

  useEffect(() => {
    const normalized = normalizeTreatmentNotes(notesProp);
    const next = applyDefaultConsult(normalized, defaultConsultId);

    setNotes(next);
    // Persist flags from server notes only — default consult must not look "saved"
    setSavedRounds(
      Object.fromEntries(
        normalized
          .filter(
            (n) => isNoteConsultComplete(n) || isNoteUnreachableDocumented(n)
          )
          .map((n) => [n.round, true])
      )
    );
    setSoapSavedRounds(
      Object.fromEntries(
        normalized
          .filter(
            (n) =>
              isNoteSoapComplete(n) &&
              (isNoteUnreachable(n) || isNoteFollowUpComplete(n))
          )
          .map((n) => [n.round, true])
      )
    );
    setSelectedKey((prev) => {
      const round = Number(String(prev).replace(/^r/, ""));

      if (next.some((n) => n.round === round)) return prev;

      return `r${next[0]!.round}`;
    });
  }, [caseId, notesProp, defaultConsultId]);

  const updateNote = (round: number, patch: Partial<TreatmentNoteDraft>) => {
    const next = notesRef.current.map((n) =>
      n.round === round ? { ...n, ...patch } : n
    );

    notesRef.current = next;
    setNotes(next);
    // อย่า sync parent ตอนพิมพ์ — จะทำให้ notesProp เปลี่ยนแล้ว hydrate เป็น "บันทึกแล้ว" ก่อนกดบันทึก
  };

  const persistRound = async (round: number, kind: "consult" | "soap") => {
    if (readOnly || locked) return;

    const note = notesRef.current.find((n) => n.round === round);

    if (!note) return;

    if (kind === "consult") {
      if (isNoteUnreachable(note)) {
        if (!note.scheduleTelemed) {
          addToast({
            title: "แจ้งเตือน",
            description: "กรุณาระบุวันที่พยายามติดต่อก่อนบันทึก",
            color: "warning",
          });

          return;
        }

        if (!note.consult || String(note.consult).trim() === "") {
          addToast({
            title: "แจ้งเตือน",
            description: "กรุณาเลือกผู้รับผิดชอบติดต่อก่อนบันทึก",
            color: "warning",
          });

          return;
        }
      } else if (!isNoteConsultComplete(note)) {
        addToast({
          title: "แจ้งเตือน",
          description:
            "กรุณากรอกเวลาเริ่ม เวลาสิ้นสุด และผู้ให้คำปรึกษาให้ครบก่อนบันทึก",
          color: "warning",
        });

        return;
      }
    } else if (!isNoteUnreachable(note)) {
      if (!isNoteSoapComplete(note)) {
        addToast({
          title: "แจ้งเตือน",
          description:
            "กรุณากรอก Subjective / Objective / Assessment / Plan ให้ครบ",
          color: "warning",
        });

        return;
      }
      if (!isSessionReportComplete(note)) {
        addToast({
          title: "แจ้งเตือน",
          description:
            "กรุณากรอกแบบบันทึกการติดตามและให้คำปรึกษาให้ครบก่อนบันทึกรอบ",
          color: "warning",
        });

        return;
      }
    }

    setSavingRound(note.round);
    try {
      const res = await fetch(`/api/case/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toNotesApiPayload(note, kind)),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      }

      setSavedRounds((prev) => ({ ...prev, [note.round]: true }));
      if (kind === "soap") {
        setSoapSavedRounds((prev) => ({ ...prev, [note.round]: true }));
      }
      onNotesChange?.(notesRef.current);
      addToast({
        title: "Success",
        description:
          kind === "consult"
            ? isNoteUnreachable(note)
              ? "บันทึกข้อมูลการติดต่อไม่ได้สำเร็จ"
              : "บันทึกผู้ให้คำปรึกษาสำเร็จ"
            : `บันทึกรอบที่ ${note.round} สำเร็จ`,
        color: "success",
      });
      if (kind === "soap") {
        const plan = note.afterCarePlan as AfterCarePlanCode | null;
        let prompt: SoapSavedPrompt = null;

        if (!isNoteUnreachable(note)) {
          if (isTransferAfterCare(plan)) prompt = "transfer";
          else if (isEndFollowUpAfterCare(plan)) prompt = "closeCase";
        }
        onSoapSaved?.({ prompt });
      }
    } catch (err) {
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ",
        color: "danger",
      });
    } finally {
      setSavingRound(null);
    }
  };

  const addRound = () => {
    const nextRound = nextTreatmentNoteRound(notesRef.current);

    if (!canOpenNoteRound(notesRef.current, nextRound, savedRounds)) {
      addToast({
        title: "แจ้งเตือน",
        description: "กรุณาบันทึกรอบก่อนหน้าให้ครบก่อนเปิดรอบใหม่",
        color: "warning",
      });

      return;
    }

    const next = applyDefaultConsult(
      [...notesRef.current, emptyTreatmentNote(nextRound)],
      defaultConsultId
    );

    notesRef.current = next;
    setNotes(next);
    onNotesChange?.(next);
    setSelectedKey(`r${nextRound}`);
  };

  const hnMissing = locked;
  const nextRoundNumber = nextTreatmentNoteRound(notes);
  const canAddRound = canOpenNoteRound(notes, nextRoundNumber, savedRounds);

  const selectedRound = Number(String(selectedKey).replace(/^r/, ""));
  const selectedNote = notes.find((n) => n.round === selectedRound) ?? notes[0];

  const resolveSaveAction = (
    note: TreatmentNoteDraft | undefined
  ): { kind: "consult" | "soap"; footer: ConsultationSaveFooterState } => {
    const hidden: ConsultationSaveFooterState = {
      visible: false,
      label: "บันทึก",
      disabled: true,
      loading: false,
      color: "primary",
      variant: "solid",
    };

    if (!note || readOnly) {
      return { kind: "consult", footer: hidden };
    }

    const unreachable = isNoteUnreachable(note);
    const consultPersisted = Boolean(savedRounds[note.round]);
    const consultScheduleComplete =
      unreachable || Boolean(note.serviceEndedAt && note.scheduleTelemed);
    const consultDone = consultPersisted && consultScheduleComplete;
    const soapPersisted = Boolean(soapSavedRounds[note.round]);
    const loading = savingRound === note.round;

    if (hnMissing) {
      return {
        kind: "consult",
        footer: {
          visible: true,
          label: unreachable ? "บันทึกการติดต่อ" : "บันทึกผู้ให้คำปรึกษา",
          disabled: true,
          loading: false,
          color: "primary",
          variant: "solid",
        },
      };
    }

    if (!consultDone) {
      return {
        kind: "consult",
        footer: {
          visible: true,
          label: unreachable ? "บันทึกการติดต่อ" : "บันทึกผู้ให้คำปรึกษา",
          disabled: loading,
          loading,
          color: "primary",
          variant: "solid",
        },
      };
    }

    if (unreachable) {
      return {
        kind: "consult",
        footer: {
          visible: true,
          label: "บันทึกแล้ว",
          disabled: true,
          loading: false,
          color: "success",
          variant: "flat",
        },
      };
    }

    if (soapPersisted) {
      return {
        kind: "soap",
        footer: {
          visible: true,
          label: "บันทึกแล้ว",
          disabled: true,
          loading: false,
          color: "success",
          variant: "flat",
        },
      };
    }

    return {
      kind: "soap",
      footer: {
        visible: true,
        label: `บันทึกรอบที่ ${note.round}`,
        disabled: loading,
        loading,
        color: "primary",
        variant: "solid",
      },
    };
  };

  const saveAction = resolveSaveAction(selectedNote);
  const saveActionRef = useRef(saveAction);
  const persistRoundRef = useRef(persistRound);
  const selectedKeyRef = useRef(selectedKey);

  saveActionRef.current = saveAction;
  persistRoundRef.current = persistRound;
  selectedKeyRef.current = selectedKey;

  useEffect(() => {
    onSaveFooterChange?.(saveAction.footer);
  }, [
    onSaveFooterChange,
    saveAction.footer.visible,
    saveAction.footer.label,
    saveAction.footer.disabled,
    saveAction.footer.loading,
    saveAction.footer.color,
    saveAction.footer.variant,
  ]);

  useImperativeHandle(ref, () => ({
    save: async () => {
      const action = saveActionRef.current;
      const round = Number(String(selectedKeyRef.current).replace(/^r/, ""));
      const note = notesRef.current.find((n) => n.round === round);

      if (!note || action.footer.disabled) return;
      await persistRoundRef.current(note.round, action.kind);
    },
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-default-500">งานหลัก</p>
          <h2 className="text-sm font-semibold text-foreground">
            บันทึกการให้คำปรึกษา
          </h2>
        </div>
        {!readOnly && (
          <Button
            color="primary"
            isDisabled={hnMissing || !canAddRound}
            size="md"
            startContent={<PlusIcon className="size-4" />}
            variant="bordered"
            onPress={addRound}
          >
            เพิ่มรอบ
          </Button>
        )}
      </div>

      <Tabs
        aria-label="รอบการให้คำปรึกษา"
        className="w-full"
        classNames={consultationRoundTabClassNames}
        color="primary"
        selectedKey={selectedKey}
        size="md"
        variant="solid"
        onSelectionChange={(key) => setSelectedKey(String(key))}
      >
        {notes.map((note) => {
          const complete =
            Boolean(savedRounds[note.round]) &&
            (isNoteFollowUpComplete(note) || isNoteUnreachableDocumented(note));
          const disabled = !canOpenNoteRound(notes, note.round, savedRounds);

          return (
            <Tab
              key={`r${note.round}`}
              isDisabled={disabled}
              title={
                complete ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span>{`รอบที่ ${note.round}`}</span>
                    <CheckCircleIcon className="size-4 text-success" />
                  </span>
                ) : (
                  `รอบที่ ${note.round}`
                )
              }
            />
          );
        })}
      </Tabs>

      {notes.map((note) => {
        if (`r${note.round}` !== selectedKey) return null;

        const unreachable = isNoteUnreachable(note);
        // ล็อกเฉพาะหลังกดบันทึกจริง และเวลาเริ่ม–สิ้นสุดครบ (รอบที่คุยได้)
        const consultPersisted = Boolean(savedRounds[note.round]);
        const consultScheduleComplete =
          unreachable || Boolean(note.serviceEndedAt && note.scheduleTelemed);
        const consultFieldsLocked =
          readOnly ||
          hnMissing ||
          (consultPersisted && consultScheduleComplete);
        const soapPersisted = Boolean(soapSavedRounds[note.round]);
        const soapFieldsLocked =
          readOnly ||
          hnMissing ||
          unreachable ||
          !(consultPersisted && consultScheduleComplete) ||
          soapPersisted;

        return (
          <div key={note.round} className="mt-2 flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-lg bg-default-100/80 px-3 py-2.5">
              <Switch
                color="danger"
                isDisabled={consultFieldsLocked}
                isSelected={unreachable}
                size="sm"
                onValueChange={(selected) =>
                  updateNote(note.round, { unreachable: selected })
                }
              >
                <span className="text-sm font-medium">
                  ติดต่อผู้รับบริการไม่ได้
                </span>
              </Switch>
              <span className="text-sm text-default-500">
                ทำเครื่องหมายเมื่อไม่สามารถติดต่อผู้รับบริการได้
                ระบุวันที่พยายามติดต่อและนัดครั้งถัดไปได้ (ไม่นับเป็นการพบจริง)
              </span>
            </div>

            {unreachable ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                <ConsultScheduleDateTimePicker
                  isDisabled={consultFieldsLocked}
                  isRequired={!consultFieldsLocked}
                  label="วันที่และเวลาที่พยายามติดต่อ"
                  name={`schedule-${note.round}`}
                  value={note.scheduleTelemed}
                  onChange={(_name, value) =>
                    updateNote(note.round, {
                      scheduleTelemed: value
                        ? dateTimePickerValueToDate(value)
                        : null,
                    })
                  }
                />
                <DatePicker
                  key={`follow-${note.round}-${note.followUp?.toString() ?? ""}`}
                  showMonthAndYearPickers
                  classNames={consultationFieldClassNames}
                  defaultValue={parseDateForPicker(note.followUp)}
                  isDisabled={consultFieldsLocked}
                  label="นัดติดต่อครั้งถัดไป"
                  labelPlacement="outside"
                  selectorButtonPlacement="start"
                  variant="bordered"
                  onChange={(date) =>
                    updateNote(note.round, {
                      followUp: date
                        ? new Date(`${date.toString()}T00:00:00`)
                        : null,
                    })
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                <ConsultScheduleDateTimePicker
                  isDisabled={consultFieldsLocked}
                  isRequired={!consultFieldsLocked}
                  label="วันที่และเวลาเริ่มให้บริการ"
                  name={`schedule-${note.round}`}
                  value={note.scheduleTelemed}
                  onChange={(_name, value) =>
                    updateNote(note.round, {
                      scheduleTelemed: value
                        ? dateTimePickerValueToDate(value)
                        : null,
                    })
                  }
                />
                <ConsultScheduleDateTimePicker
                  isDisabled={consultFieldsLocked}
                  isRequired={!consultFieldsLocked}
                  label="วันที่และเวลาสิ้นสุดให้บริการ"
                  name={`ended-${note.round}`}
                  value={note.serviceEndedAt}
                  onChange={(_name, value) =>
                    updateNote(note.round, {
                      serviceEndedAt: value
                        ? dateTimePickerValueToDate(value)
                        : null,
                    })
                  }
                />
              </div>
            )}

            {!unreachable && (
              <Autocomplete
                className="w-full"
                defaultItems={consultants}
                isDisabled={consultFieldsLocked}
                isRequired={!consultFieldsLocked}
                label="ผู้ให้คำปรึกษา"
                labelPlacement="outside"
                placeholder="เลือกผู้ให้คำปรึกษา"
                radius="md"
                selectedKey={note.consult ?? undefined}
                variant="bordered"
                onSelectionChange={(val) =>
                  updateNote(note.round, {
                    consult: val != null ? String(val) : null,
                  })
                }
              >
                {(item) => (
                  <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                )}
              </Autocomplete>
            )}

            {unreachable && (
              <Autocomplete
                className="w-full"
                defaultItems={consultants}
                isDisabled={consultFieldsLocked}
                isRequired={!consultFieldsLocked}
                label="ผู้รับผิดชอบติดต่อ"
                labelPlacement="outside"
                placeholder="เลือกผู้รับผิดชอบติดต่อ"
                radius="md"
                selectedKey={note.consult ?? undefined}
                variant="bordered"
                onSelectionChange={(val) =>
                  updateNote(note.round, {
                    consult: val != null ? String(val) : null,
                  })
                }
              >
                {(item) => (
                  <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>
                )}
              </Autocomplete>
            )}

            <Divider className="bg-default-200" />

            {!readOnly && !hnMissing && !consultPersisted && !unreachable && (
              <p className="text-sm text-default-500">
                กรุณากรอกเวลาเริ่ม–สิ้นสุดและผู้ให้คำปรึกษา
                แล้วกดบันทึกที่ด้านล่าง ก่อนกรอก Discharge Summary
                และแบบบันทึกโครงการ
              </p>
            )}

            {!unreachable && (
              <SessionReportFields
                isDisabled={soapFieldsLocked}
                note={note}
                onChange={(patch) => updateNote(note.round, patch)}
              />
            )}

            <div className="flex flex-col gap-4">
              <Textarea
                classNames={consultationFieldClassNames}
                isClearable={!readOnly && !soapFieldsLocked}
                isDisabled={soapFieldsLocked}
                isRequired={!readOnly && !soapPersisted}
                label="Subjective data"
                labelPlacement="outside"
                minRows={3}
                placeholder="Description"
                value={note.subjective ?? ""}
                variant="bordered"
                onChange={(e) =>
                  updateNote(note.round, { subjective: e.target.value })
                }
                onClear={() => updateNote(note.round, { subjective: "" })}
              />
              <Textarea
                classNames={consultationFieldClassNames}
                isClearable={!readOnly && !soapFieldsLocked}
                isDisabled={soapFieldsLocked}
                isRequired={!readOnly && !soapPersisted}
                label="Objective data"
                labelPlacement="outside"
                minRows={3}
                placeholder="Description"
                value={note.objective ?? ""}
                variant="bordered"
                onChange={(e) =>
                  updateNote(note.round, { objective: e.target.value })
                }
                onClear={() => updateNote(note.round, { objective: "" })}
              />
              <Textarea
                classNames={consultationFieldClassNames}
                isClearable={!readOnly && !soapFieldsLocked}
                isDisabled={soapFieldsLocked}
                isRequired={!readOnly && !soapPersisted}
                label="Assessment"
                labelPlacement="outside"
                minRows={3}
                placeholder="Description"
                value={note.assessment ?? ""}
                variant="bordered"
                onChange={(e) =>
                  updateNote(note.round, { assessment: e.target.value })
                }
                onClear={() => updateNote(note.round, { assessment: "" })}
              />
              <Textarea
                classNames={consultationFieldClassNames}
                isClearable={!readOnly && !soapFieldsLocked}
                isDisabled={soapFieldsLocked}
                isRequired={!readOnly && !soapPersisted}
                label="Plan"
                labelPlacement="outside"
                minRows={3}
                placeholder="Description"
                value={note.plan ?? ""}
                variant="bordered"
                onChange={(e) =>
                  updateNote(note.round, { plan: e.target.value })
                }
                onClear={() => updateNote(note.round, { plan: "" })}
              />
              <Textarea
                classNames={consultationFieldClassNames}
                isClearable={!readOnly && !soapFieldsLocked}
                isDisabled={soapFieldsLocked}
                label="หมายเหตุ"
                labelPlacement="outside"
                minRows={2}
                placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                value={note.note ?? ""}
                variant="bordered"
                onChange={(e) =>
                  updateNote(note.round, { note: e.target.value })
                }
                onClear={() => updateNote(note.round, { note: "" })}
              />
              {!unreachable && (
                <DatePicker
                  key={`next-${note.round}-${note.followUp?.toString() ?? ""}`}
                  showMonthAndYearPickers
                  className="max-w-xs"
                  classNames={consultationFieldClassNames}
                  defaultValue={parseDateForPicker(note.followUp)}
                  isDisabled={soapFieldsLocked}
                  label="นัดพบครั้งถัดไป"
                  labelPlacement="outside"
                  selectorButtonPlacement="start"
                  variant="bordered"
                  onChange={(date) =>
                    updateNote(note.round, {
                      followUp: date
                        ? new Date(`${date.toString()}T00:00:00`)
                        : null,
                    })
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
