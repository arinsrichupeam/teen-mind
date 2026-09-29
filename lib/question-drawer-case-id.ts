/**
 * Case id for drawer fetch/actions.
 * Prop id (table selection) wins over local draft state so switching
 * rows cannot refresh/overwrite with the previously opened case.
 */
export function resolveDrawerCaseId(
  propId: string | undefined | null,
  localId: string | undefined | null
): string | undefined {
  if (propId) return propId;
  if (localId) return localId;

  return undefined;
}
