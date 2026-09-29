/** Shared consultation drawer control sizing / tab chrome */

export const consultationRoundTabClassNames = {
  base: "w-full max-w-full",
  tabList: "gap-1.5 bg-default-100 p-1.5 w-full max-w-full",
  cursor: "bg-primary shadow-none",
  tab: "h-9 min-h-9 px-4 text-sm",
  tabContent:
    "text-sm font-medium group-data-[selected=true]:text-primary-foreground",
} as const;

/** Toolbar / secondary actions in citizen header */
export const consultationToolbarBtnClass = "h-9 min-w-[4.5rem] text-sm";

/** Footer primary row */
export const consultationFooterBtnClass =
  "h-10 min-w-[5.5rem] text-sm font-medium";

/** Outside labels + input text for consultation form controls */
export const consultationFieldClassNames = {
  label: "text-sm font-medium text-foreground",
  input: "text-sm",
} as const;

export const consultationChoiceGroupClassNames = {
  label: "text-sm font-medium text-foreground",
} as const;

export const consultationChoiceItemClassNames = {
  label: "text-sm leading-snug text-foreground",
} as const;
