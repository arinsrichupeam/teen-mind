import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dateTimePickerValueToDate,
  formatThaiDateTimeAtThailand,
  isLegacyDateOnlyUtc,
  safeParseDateTimeForPicker,
} from "./helper";

describe("consult schedule datetime helpers", () => {
  it("detects legacy date-only UTC values", () => {
    assert.equal(
      isLegacyDateOnlyUtc(new Date("2026-07-10T00:00:00.000Z")),
      true
    );
    assert.equal(
      isLegacyDateOnlyUtc(new Date("2026-07-10T07:30:00.000Z")),
      false
    );
  });

  it("round-trips Thailand wall clock through picker value", () => {
    const stored = dateTimePickerValueToDate("2026-07-10T14:30");

    assert.equal(stored?.toISOString(), "2026-07-10T07:30:00.000Z");

    const pickerValue = safeParseDateTimeForPicker(stored);

    assert.equal(pickerValue?.toString().slice(0, 16), "2026-07-10T14:30");
  });

  it("defaults legacy date-only records to 09:00 Thailand in picker", () => {
    const pickerValue = safeParseDateTimeForPicker(
      new Date("2026-07-10T00:00:00.000Z")
    );

    assert.equal(pickerValue?.toString().slice(0, 16), "2026-07-10T09:00");
  });

  it("formats datetime in Thailand timezone", () => {
    assert.equal(
      formatThaiDateTimeAtThailand("2026-07-10T07:30:00.000Z"),
      "10 กรกฎาคม 2569 14:30 น."
    );
  });
});
