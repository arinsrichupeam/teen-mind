import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertCitizenCaseCreate,
  OPEN_CASE_STATUSES,
} from "./case-create-rules";

describe("case-create-rules", () => {
  it("lists open CaseStatus values for one-open-Case checks", () => {
    assert.deepEqual(OPEN_CASE_STATUSES, [
      "PENDING",
      "IN_PROGRESS",
      "TRANSFER_PENDING",
    ]);
  });

  it("rejects missing facility, non-DEPRESSION package, or an existing open Case", () => {
    assert.throws(
      () =>
        assertCitizenCaseCreate({
          healthcareFacilityId: null,
          packageName: "DEPRESSION",
          hasOpenCase: false,
        }),
      /facility/i
    );

    assert.throws(
      () =>
        assertCitizenCaseCreate({
          healthcareFacilityId: "fac-1",
          packageName: "FULL",
          hasOpenCase: false,
        }),
      /DEPRESSION/
    );

    assert.throws(
      () =>
        assertCitizenCaseCreate({
          healthcareFacilityId: "fac-1",
          packageName: "DEPRESSION",
          hasOpenCase: true,
        }),
      /เคสที่ยังไม่ปิด/
    );
  });

  it("accepts DEPRESSION with facility and no open Case", () => {
    assert.doesNotThrow(() =>
      assertCitizenCaseCreate({
        healthcareFacilityId: "fac-1",
        packageName: "DEPRESSION",
        hasOpenCase: false,
      })
    );
  });
});
