import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractAdminRegisterPayload } from "./admin-register-payload";

describe("extractAdminRegisterPayload", () => {
  it("reads profile_admin from the client body (regression)", () => {
    // Client sends { profile_admin }; API previously read data.profileAdmins → 500
    const payload = extractAdminRegisterPayload({
      profile_admin: { userId: "u1", firstName: "สมชาย", lastName: "ใจดี" },
    });

    assert.ok(payload);
    assert.equal(payload.firstName, "สมชาย");
    assert.equal(payload.userId, "u1");
  });

  it("accepts profileAdmin / profileAdmins object aliases", () => {
    assert.equal(
      extractAdminRegisterPayload({
        profileAdmin: { firstName: "A" },
      })?.firstName,
      "A"
    );
    assert.equal(
      extractAdminRegisterPayload({
        profileAdmins: { firstName: "B" },
      })?.firstName,
      "B"
    );
  });

  it("returns null when payload is missing or an array", () => {
    assert.equal(extractAdminRegisterPayload({}), null);
    assert.equal(
      extractAdminRegisterPayload({ profileAdmins: [{ firstName: "X" }] }),
      null
    );
    assert.equal(extractAdminRegisterPayload(null), null);
  });
});
