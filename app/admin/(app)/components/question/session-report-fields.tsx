"use client";

import type { TreatmentNoteDraft } from "@/lib/treatment-note-rounds";

import {
  Checkbox,
  CheckboxGroup,
  Input,
  Radio,
  RadioGroup,
} from "@heroui/react";

import {
  consultationChoiceGroupClassNames,
  consultationChoiceItemClassNames,
  consultationFieldClassNames,
} from "./consultation-ui";

import {
  AFTER_CARE_PLAN_OPTIONS,
  INTERVENTION_OPTIONS,
  PRESENTING_TOPIC_OPTIONS,
  PSYCH_RISK_OPTIONS,
  SESSION_OUTCOME_OPTIONS,
  SESSION_SELF_HARM_RISK_OPTIONS,
  type AfterCarePlanCode,
  type InterventionCode,
  type PresentingTopicCode,
  type PsychRiskSeverity,
  type SessionOutcomeCode,
  type SessionSelfHarmRiskCode,
} from "@/lib/session-report";

type Props = {
  note: TreatmentNoteDraft;
  isDisabled: boolean;
  onChange: (patch: Partial<TreatmentNoteDraft>) => void;
};

export function SessionReportFields({ note, isDisabled, onChange }: Props) {
  const topics = Array.isArray(note.presentingTopics)
    ? note.presentingTopics
    : [];
  const interventions = Array.isArray(note.interventions)
    ? note.interventions
    : [];

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-default-200 bg-default-50/50 p-4 text-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          บันทึกการติดตามและให้คำปรึกษา
        </h3>
        <p className="mt-1 text-sm text-default-500">
          กรอกเมื่อพูดคุยกับผู้รับบริการได้แล้ว (บังคับก่อนบันทึกรอบ)
        </p>
      </div>

      <CheckboxGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="มาปรึกษาเรื่องอะไร"
        value={topics}
        onValueChange={(vals) =>
          onChange({ presentingTopics: vals as PresentingTopicCode[] })
        }
      >
        {PRESENTING_TOPIC_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            className="max-w-full items-start"
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
      {topics.includes("OTHER") && (
        <Input
          classNames={consultationFieldClassNames}
          isDisabled={isDisabled}
          isRequired={!isDisabled}
          value={note.presentingTopicsOther ?? ""}
          variant="bordered"
          onValueChange={(v) => onChange({ presentingTopicsOther: v })}
        />
      )}

      <RadioGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="พบความเสี่ยงต่อการทำร้ายตนเองหรือฆ่าตัวตายหรือไม่"
        value={note.sessionSelfHarmRisk ?? undefined}
        onValueChange={(v) =>
          onChange({
            sessionSelfHarmRisk: v as SessionSelfHarmRiskCode,
          })
        }
      >
        {SESSION_SELF_HARM_RISK_OPTIONS.map((opt) => (
          <Radio
            key={opt.value}
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>

      <RadioGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="ระดับความเสี่ยงที่นักจิตประเมิน"
        value={note.psychRisk ?? undefined}
        onValueChange={(v) => onChange({ psychRisk: v as PsychRiskSeverity })}
      >
        {PSYCH_RISK_OPTIONS.map((opt) => (
          <Radio
            key={opt.value}
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>

      <CheckboxGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="การดูแล/การช่วยเหลือที่ได้ดำเนินการ"
        value={interventions}
        onValueChange={(vals) =>
          onChange({ interventions: vals as InterventionCode[] })
        }
      >
        {INTERVENTION_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            className="max-w-full items-start"
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
      {interventions.includes("OTHER") && (
        <Input
          classNames={consultationFieldClassNames}
          isDisabled={isDisabled}
          isRequired={!isDisabled}
          value={note.interventionsOther ?? ""}
          variant="bordered"
          onValueChange={(v) => onChange({ interventionsOther: v })}
        />
      )}

      <RadioGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="ผลหลังสิ้นสุดการพูดคุยในครั้งนี้"
        value={note.sessionOutcome ?? undefined}
        onValueChange={(v) =>
          onChange({ sessionOutcome: v as SessionOutcomeCode })
        }
      >
        {SESSION_OUTCOME_OPTIONS.map((opt) => (
          <Radio
            key={opt.value}
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>

      <RadioGroup
        classNames={consultationChoiceGroupClassNames}
        isDisabled={isDisabled}
        isRequired={!isDisabled}
        label="แผนหลังการให้คำปรึกษา"
        value={note.afterCarePlan ?? undefined}
        onValueChange={(v) =>
          onChange({ afterCarePlan: v as AfterCarePlanCode })
        }
      >
        {AFTER_CARE_PLAN_OPTIONS.map((opt) => (
          <Radio
            key={opt.value}
            classNames={consultationChoiceItemClassNames}
            value={opt.value}
          >
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>
      {note.afterCarePlan === "OTHER" && (
        <Input
          classNames={consultationFieldClassNames}
          isDisabled={isDisabled}
          isRequired={!isDisabled}
          value={note.afterCarePlanOther ?? ""}
          variant="bordered"
          onValueChange={(v) => onChange({ afterCarePlanOther: v })}
        />
      )}
    </div>
  );
}
