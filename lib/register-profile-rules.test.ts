import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertCitizenRegisterProfile } from "./register-profile-rules";

describe("register-profile-rules", () => {
  it("requires HealthcareFacility", () => {
    assert.throws(
      () =>
        assertCitizenRegisterProfile({
          healthcareFacilityId: null,
          isStudent: false,
          schoolId: null,
        }),
      /สถานพยาบาล/
    );
  });

  it("requires School when Student", () => {
    assert.throws(
      () =>
        assertCitizenRegisterProfile({
          healthcareFacilityId: "fac-1",
          isStudent: true,
          schoolId: null,
        }),
      /โรงเรียน/
    );

    assert.doesNotThrow(() =>
      assertCitizenRegisterProfile({
        healthcareFacilityId: "fac-1",
        isStudent: true,
        schoolId: 12,
      })
    );
  });

  it("allows non-student without School", () => {
    assert.doesNotThrow(() =>
      assertCitizenRegisterProfile({
        healthcareFacilityId: "fac-1",
        isStudent: false,
        schoolId: null,
      })
    );
  });
});
