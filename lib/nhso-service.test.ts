import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapNhsoRealPersonToRights } from "./nhso-service";

describe("mapNhsoRealPersonToRights", () => {
  it("maps RealPerson insurance + nested hospital fields", () => {
    const mapped = mapNhsoRealPersonToRights({
      mainInscl: "UCS",
      mainInsclCode: "UCS",
      mainInsclName: "สิทธิหลักประกันสุขภาพแห่งชาติ",
      subInscl: "WEL",
      subInsclCode: "WEL",
      subInsclName: "สิทธิผู้มีรายได้น้อย",
      hospMainNew: { hcode: "10660", hname: "โรงพยาบาลศิริราช" },
      hospSubNew: { hcode: "13756", hname: "รพ.สต.ตัวอย่าง" },
    });

    assert.deepEqual(mapped, {
      mainInsclCode: "UCS",
      mainInsclName: "สิทธิหลักประกันสุขภาพแห่งชาติ",
      subInsclCode: "WEL",
      subInsclName: "สิทธิผู้มีรายได้น้อย",
      hmainCode: "10660",
      hmainName: "โรงพยาบาลศิริราช",
      hsubCode: "13756",
      hsubName: "รพ.สต.ตัวอย่าง",
    });
  });

  it("falls back to mainInscl/subInscl when *Code fields are missing", () => {
    const mapped = mapNhsoRealPersonToRights({
      mainInscl: "SSS",
      mainInsclName: "ประกันสังคม",
      subInscl: "SSO",
      subInsclName: "ผู้ประกันตน",
      hospMain: { code: "11111", name: "รพ.หลัก" },
      hospSub: { code: "22222", name: "รพ.ย่อย" },
    });

    assert.equal(mapped.mainInsclCode, "SSS");
    assert.equal(mapped.subInsclCode, "SSO");
    assert.equal(mapped.hmainCode, "11111");
    assert.equal(mapped.hsubCode, "22222");
  });

  it("trims empty strings to undefined", () => {
    const mapped = mapNhsoRealPersonToRights({
      mainInsclCode: "  ",
      mainInsclName: "",
      hospMainNew: { hcode: " ", hname: "" },
    });

    assert.equal(mapped.mainInsclCode, undefined);
    assert.equal(mapped.mainInsclName, undefined);
    assert.equal(mapped.hmainCode, undefined);
    assert.equal(mapped.hmainName, undefined);
  });
});
