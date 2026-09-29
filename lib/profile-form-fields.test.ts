import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyAddressFormField,
  applyProfileFormField,
  normalizeProfileFormFieldName,
} from "./profile-form-fields";

describe("profile-form-fields", () => {
  it("maps lowercase name aliases to camelCase state keys", () => {
    assert.equal(normalizeProfileFormFieldName("firstname"), "firstName");
    assert.equal(normalizeProfileFormFieldName("lastname"), "lastName");
    assert.equal(normalizeProfileFormFieldName("tel"), "phone");
    assert.equal(normalizeProfileFormFieldName("firstName"), "firstName");
    assert.equal(normalizeProfileFormFieldName("phone"), "phone");
    assert.equal(normalizeProfileFormFieldName("province"), "provinceId");
    assert.equal(normalizeProfileFormFieldName("district"), "districtId");
    assert.equal(normalizeProfileFormFieldName("subdistrict"), "subdistrictId");
    assert.equal(normalizeProfileFormFieldName("provinceId"), "provinceId");
  });

  it("lets controlled inputs update firstName/lastName when name is lowercase", () => {
    // Regression: register forms used name="firstname" + value={state.firstName}
    // with a naive [e.target.name]: value update — typing appeared broken.
    let state = { firstName: "", lastName: "", phone: "" };

    state = applyProfileFormField(state, "firstname", "สมชาย");
    state = applyProfileFormField(state, "lastname", "ใจดี");
    state = applyProfileFormField(state, "tel", "0812345678");

    assert.equal(state.firstName, "สมชาย");
    assert.equal(state.lastName, "ใจดี");
    assert.equal(state.phone, "0812345678");
    assert.equal(
      (state as Record<string, unknown>).firstname,
      undefined,
      "must not write to the alias key"
    );
  });

  it("lets emergency contact phone update when input name is tel", () => {
    // Regression: Step3 used name="tel" + value={emergency.phone}
    // with naive EmergencyHandleChange — phone field appeared stuck.
    let emergency = { name: "", phone: "", relation: "" };

    emergency = applyProfileFormField(emergency, "tel", "0899999999");

    assert.equal(emergency.phone, "0899999999");
    assert.equal(
      (emergency as Record<string, unknown>).tel,
      undefined,
      "must not write to the alias key"
    );
  });

  it("lets province Autocomplete selection stick when name is province", () => {
    // Regression: Step2 Autocomplete onSelectionChange sent name="province"
    // while selectedKey read address.provinceId — selection appeared broken.
    let address = {
      houseNo: "ทดสอบ",
      provinceId: 0,
      districtId: 0,
      subdistrictId: 0,
    };

    address = applyAddressFormField(address, "province", "10");
    address = applyAddressFormField(address, "district", "");
    address = applyAddressFormField(address, "subdistrict", "");

    assert.equal(address.provinceId, 10);
    assert.equal(address.districtId, 0);
    assert.equal(address.subdistrictId, 0);
    assert.equal(
      (address as Record<string, unknown>).province,
      undefined,
      "must not write to the alias key"
    );
  });

  it("coerces geo id strings and clears to 0", () => {
    let address = { provinceId: 10, districtId: 20, subdistrictId: 30 };

    address = applyAddressFormField(address, "provinceId", "1");
    assert.equal(address.provinceId, 1);

    address = applyAddressFormField(address, "district", "");
    assert.equal(address.districtId, 0);
  });
});
