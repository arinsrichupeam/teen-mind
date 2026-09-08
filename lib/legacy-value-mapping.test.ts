import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Sex, ScreeningResult } from "@prisma/client";

import {
  mapLegacyRiskColorToScreeningResult,
  mapLegacySexToSex,
} from "./legacy-value-mapping";

describe("mapLegacyRiskColorToScreeningResult", () => {
  it("maps each legacy color to ScreeningResult per ADR 0002", () => {
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Green"),
      ScreeningResult.NEGATIVE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Green-Low"),
      ScreeningResult.POSITIVE_LOW
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Yellow"),
      ScreeningResult.POSITIVE_MODERATE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Orange"),
      ScreeningResult.POSITIVE_HIGH
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Red"),
      ScreeningResult.POSITIVE_SEVERE
    );
  });

  it("maps empty or unknown colors to INCOMPLETE", () => {
    assert.equal(
      mapLegacyRiskColorToScreeningResult(null),
      ScreeningResult.INCOMPLETE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult(undefined),
      ScreeningResult.INCOMPLETE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult(""),
      ScreeningResult.INCOMPLETE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("   "),
      ScreeningResult.INCOMPLETE
    );
    assert.equal(
      mapLegacyRiskColorToScreeningResult("Unknown"),
      ScreeningResult.INCOMPLETE
    );
  });
});

describe("mapLegacySexToSex", () => {
  it("maps 1 to MALE and 2 to FEMALE", () => {
    assert.equal(mapLegacySexToSex(1), Sex.MALE);
    assert.equal(mapLegacySexToSex(2), Sex.FEMALE);
    assert.equal(mapLegacySexToSex("1"), Sex.MALE);
    assert.equal(mapLegacySexToSex("2"), Sex.FEMALE);
  });

  it("maps null, empty, and other values to UNSPECIFIED", () => {
    assert.equal(mapLegacySexToSex(null), Sex.UNSPECIFIED);
    assert.equal(mapLegacySexToSex(undefined), Sex.UNSPECIFIED);
    assert.equal(mapLegacySexToSex(""), Sex.UNSPECIFIED);
    assert.equal(mapLegacySexToSex(0), Sex.UNSPECIFIED);
    assert.equal(mapLegacySexToSex(3), Sex.UNSPECIFIED);
    assert.equal(mapLegacySexToSex("x"), Sex.UNSPECIFIED);
  });
});
