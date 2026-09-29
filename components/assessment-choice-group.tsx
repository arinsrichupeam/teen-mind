"use client";

export type AssessmentChoiceOption = {
  value: string;
  label: string;
};

type AssessmentChoiceGroupProps = {
  label: string;
  options: AssessmentChoiceOption[];
  value: string;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
};

/**
 * Pressable answer choices for one-question-per-screen LIFF screening.
 * Uses <div> (not <button>) so it can sit inside HeroUI Tabs without nested buttons.
 * Unlike Radio, re-tapping the selected option still fires onSelect (needed after Back).
 */
export function AssessmentChoiceGroup({
  label,
  options,
  value,
  onSelect,
  isDisabled = false,
}: AssessmentChoiceGroupProps) {
  return (
    <div
      aria-label={label}
      className="flex w-full flex-col gap-2"
      role="radiogroup"
    >
      <p className="text-sm text-default-500">{label}</p>
      {options.map((option) => {
        const selected = value !== "" && value === option.value;

        return (
          <div
            key={option.value}
            aria-checked={selected}
            aria-disabled={isDisabled || undefined}
            className={`min-h-12 w-full cursor-pointer rounded-xl border px-4 py-3 text-start text-sm transition-colors ${
              selected
                ? "border-primary bg-primary-50 font-medium text-primary-700"
                : "border-default-200 bg-content1 text-foreground"
            } ${isDisabled ? "pointer-events-none opacity-50" : "active:scale-[0.99]"}`}
            role="radio"
            tabIndex={isDisabled ? -1 : 0}
            onClick={() => {
              if (!isDisabled) onSelect(option.value);
            }}
            onKeyDown={(event) => {
              if (isDisabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(option.value);
              }
            }}
          >
            {option.label}
          </div>
        );
      })}
    </div>
  );
}

export const YES_NO_OPTIONS: AssessmentChoiceOption[] = [
  { value: "0", label: "ไม่ใช่" },
  { value: "1", label: "ใช่" },
];

export const FREQUENCY_OPTIONS: AssessmentChoiceOption[] = [
  { value: "0", label: "ไม่มีเลย" },
  { value: "1", label: "มีบางวัน" },
  { value: "2", label: "มีมากกว่า 7 วัน" },
  { value: "3", label: "มีแทบทุกวัน" },
];
