/**
 * Map HTML form `name` aliases to Profile / Volunteer / Profile_Admin / Address state keys.
 * Inputs historically used short names (`firstname`, `tel`, `province`) while state uses camelCase IDs.
 */
export function normalizeProfileFormFieldName(name: string): string {
  switch (name) {
    case "firstname":
      return "firstName";
    case "lastname":
      return "lastName";
    case "tel":
      return "phone";
    case "province":
      return "provinceId";
    case "district":
      return "districtId";
    case "subdistrict":
      return "subdistrictId";
    default:
      return name;
  }
}

const GEO_ID_FIELDS = new Set(["provinceId", "districtId", "subdistrictId"]);

/** Apply a form field change onto a profile-like state object. */
export function applyProfileFormField<T extends Record<string, unknown>>(
  prev: T,
  name: string,
  value: unknown
): T {
  const field = normalizeProfileFormFieldName(name);

  return { ...prev, [field]: value };
}

/**
 * Apply an address form field change, mapping short geo names to *Id keys
 * and coercing geo IDs to numbers (empty → 0).
 */
export function applyAddressFormField<T extends Record<string, unknown>>(
  prev: T,
  name: string,
  value: unknown
): T {
  const field = normalizeProfileFormFieldName(name);

  if (GEO_ID_FIELDS.has(field)) {
    if (value === "" || value == null) {
      return { ...prev, [field]: 0 };
    }

    const id = typeof value === "number" ? value : parseInt(String(value), 10);

    return { ...prev, [field]: Number.isNaN(id) || id < 0 ? 0 : id };
  }

  return { ...prev, [field]: value };
}
