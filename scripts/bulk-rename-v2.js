/**
 * One-shot mechanical renames for Prisma v2 cutover (dev).
 * Run: node scripts/bulk-rename-v2.js
 */
const fs = require("fs");
const path = require("path");

const roots = ["app", "lib", "types", "utils", "components"].filter((d) =>
  fs.existsSync(path.join(process.cwd(), d))
);

const exts = new Set([".ts", ".tsx"]);

/** order matters for some overlapping patterns */
const replacements = [
  // Prisma type imports / names
  [/Profile_Admin/g, "ProfileAdmin"],
  [/Questions_Master/g, "Case"],
  [/Questions_PHQA_Addon/g, "QuestionPhqaAddon"],
  [/Questions_PHQA/g, "QuestionPhqa"],
  [/Questions_9Q/g, "Question9Q"],
  [/Questions_8Q/g, "Question8Q"],
  [/Questions_2Q/g, "Question2Q"],
  [/Questions_Problem/g, "QuestionProblem"],
  [/Volunteer_Type/g, "VolunteerType"],
  [/Employee_Type/g, "EmployeeType"],
  [/School_Screening/g, "SchoolScreening"],
  [/\bReferent\b/g, "Volunteer"],
  [/\bDistricts\b/g, "District"],
  [/\bProvinces\b/g, "Province"],
  [/\bSubdistricts\b/g, "Subdistrict"],
  [/\bRoles\b/g, "Role"],

  // common property access / literals in TSX (careful)
  [/\.firstname\b/g, ".firstName"],
  [/\.lastname\b/g, ".lastName"],
  [/\.birthday\b/g, ".birthDate"],
  [/\.receiveAlert\b/g, ".receiveAlert"], // no-op keep
  [/\.alert\b/g, ".receiveAlert"],
  // tel on profile/emergency - risky for other tel fields
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === ".next" ||
      ent.name === "scripts"
    )
      continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    let src = fs.readFileSync(file, "utf8");
    const orig = src;
    for (const [re, to] of replacements) {
      src = src.replace(re, to);
    }
    // initData / object keys
    src = src.replace(/\bfirstname:/g, "firstName:");
    src = src.replace(/\blastname:/g, "lastName:");
    src = src.replace(/\bbirthday:/g, "birthDate:");
    src = src.replace(/\balert:/g, "receiveAlert:");
    // address geo keys in objects (not CSS)
    src = src.replace(/\bprovince:/g, "provinceId:");
    src = src.replace(/\bdistrict:/g, "districtId:");
    src = src.replace(/\bsubdistrict:/g, "subdistrictId:");
    // property access
    src = src.replace(/\.province\b(?!Id)/g, ".provinceId");
    src = src.replace(/\.district\b(?!Id)/g, ".districtId");
    src = src.replace(/\.subdistrict\b(?!Id)/g, ".subdistrictId");
    // tel → phone for common patterns
    src = src.replace(/\.tel\b/g, ".phone");
    src = src.replace(/\btel:/g, "phone:");

    if (src !== orig) {
      fs.writeFileSync(file, src);
      changed += 1;
      console.log("updated", file);
    }
  }
}
console.log("files changed:", changed);
