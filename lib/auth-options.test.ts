import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authOptions } from "./auth-options";

describe("authOptions.jwt", () => {
  const secret = process.env.NEXTAUTH_SECRET || "t7W1+FxpDTsYlQawROskmlponqnxk3jbRyYx7YAZhLk=";

  it("never includes double-dash (--) in generated tokens", async () => {
    const encode = authOptions.jwt?.encode;
    assert.ok(encode, "encode function should be defined");

    const token = { sub: "user-test-123", name: "Tester", email: "test@example.com" };

    // Test 100 generated tokens to verify '--' is never present
    for (let i = 0; i < 100; i++) {
      const encoded: string = await encode({ token, secret, maxAge: 86400 });
      assert.strictEqual(
        encoded.includes("--"),
        false,
        `Token should not contain '--': ${encoded}`
      );
    }
  });

  it("successfully decodes encoded token", async () => {
    const encode = authOptions.jwt?.encode;
    const decode = authOptions.jwt?.decode;
    assert.ok(encode && decode, "encode and decode should be defined");

    const payload = { sub: "user-xyz", role: "admin" };
    const encoded = await encode({ token: payload, secret, maxAge: 86400 });
    const decoded = await decode({ token: encoded, secret });

    assert.ok(decoded, "decoded token should exist");
    assert.strictEqual(decoded.sub, "user-xyz");
  });

  it("returns null for malformed or empty token", async () => {
    const decode = authOptions.jwt?.decode;
    assert.ok(decode, "decode should be defined");

    assert.strictEqual(await decode({ token: "", secret }), null);
    assert.strictEqual(await decode({ token: "   ", secret }), null);
    assert.strictEqual(await decode({ token: "<html>bad</html>", secret }), null);
    assert.strictEqual(await decode({ token: "invalid.jwt.token", secret }), null);
  });
});
