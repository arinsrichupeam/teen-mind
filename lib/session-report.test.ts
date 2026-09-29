import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertSessionReportForSoapSave,
  isSessionReportComplete,
  isTransferAfterCare,
  type SessionReportFields,
} from "./session-report";

function completeReachedNote(
  overrides: Partial<SessionReportFields> = {}
): SessionReportFields {
  return {
    unreachable: false,
    serviceEndedAt: new Date("2026-09-09T11:00:00"),
    sessionSelfHarmRisk: "NOT_FOUND",
    psychRisk: "NONE",
    presentingTopics: ["FAMILY"],
    presentingTopicsOther: null,
    interventions: ["SUPPORTIVE_COUNSELING"],
    interventionsOther: null,
    sessionOutcome: "IMPROVED",
    afterCarePlan: "END_FOLLOWUP",
    afterCarePlanOther: null,
    followUp: null,
    subjective: "s",
    objective: "o",
    assessment: "a",
    plan: "p",
    ...overrides,
  };
}

describe("session-report", () => {
  it("treats unreachable notes as complete without session report", () => {
    assert.equal(isSessionReportComplete({ unreachable: true }), true);
  });

  it("requires full session report on reached notes", () => {
    assert.equal(isSessionReportComplete({ unreachable: false }), false);
    assert.equal(isSessionReportComplete(completeReachedNote()), true);
  });

  it("requires PsychRisk on every reached session report", () => {
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          psychRisk: null,
        })
      ),
      false
    );
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          sessionSelfHarmRisk: "NOT_FOUND",
          psychRisk: "NONE",
        })
      ),
      true
    );
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          sessionSelfHarmRisk: "FOUND",
          psychRisk: "HIGH",
        })
      ),
      true
    );
  });

  it("requires followUp for psychologist after-care", () => {
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          afterCarePlan: "PSYCHOLOGIST_FOLLOWUP",
          followUp: null,
        })
      ),
      false
    );
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          afterCarePlan: "PSYCHOLOGIST_FOLLOWUP",
          followUp: new Date("2026-09-16"),
        })
      ),
      true
    );
  });

  it("requires Other free text when OTHER is selected", () => {
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          presentingTopics: ["OTHER"],
          presentingTopicsOther: null,
        })
      ),
      false
    );
    assert.equal(
      isSessionReportComplete(
        completeReachedNote({
          presentingTopics: ["OTHER"],
          presentingTopicsOther: "อื่นๆ",
        })
      ),
      true
    );
  });

  it("assertSessionReportForSoapSave skips incomplete SOAP", () => {
    assert.doesNotThrow(() =>
      assertSessionReportForSoapSave({
        unreachable: false,
        subjective: "s",
      })
    );
  });

  it("assertSessionReportForSoapSave throws when SOAP complete but report missing", () => {
    assert.throws(
      () =>
        assertSessionReportForSoapSave({
          unreachable: false,
          subjective: "s",
          objective: "o",
          assessment: "a",
          plan: "p",
        }),
      /ระดับความเสี่ยง|แบบบันทึกการติดตาม/
    );
  });

  it("flags transfer after-care for UX prompt", () => {
    assert.equal(isTransferAfterCare("TRANSFER_FACILITY"), true);
    assert.equal(isTransferAfterCare("TRANSFER_EMERGENCY"), true);
    assert.equal(isTransferAfterCare("END_FOLLOWUP"), false);
  });
});
