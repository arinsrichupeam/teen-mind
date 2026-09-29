import { AdminStatus, CaseStatus, type Prisma } from "@prisma/client";

/**
 * Cases in transfer queue for a facility: inbound (target) or outbound (owner).
 * Without a facility id, returns all TRANSFER_PENDING (system-wide / no home).
 */
export function buildTransferPendingQueueWhere(
  facilityId: string | null | undefined
): Prisma.CaseWhereInput {
  if (facilityId?.trim()) {
    const id = facilityId.trim();

    return {
      status: CaseStatus.TRANSFER_PENDING,
      OR: [{ transferToFacilityId: id }, { healthcareFacilityId: id }],
    };
  }

  return { status: CaseStatus.TRANSFER_PENDING };
}

type ClaimableCase = {
  status: CaseStatus | string;
  healthcareFacilityId: string | null;
};

type ClaimAdmin = {
  id: string;
  healthcareFacilityId: string;
  status: AdminStatus | string;
};

/** ปิด / รอรับ / รอส่งต่อ — ห้าม EMR / ปิด / ขอส่งต่อ */
export function assertCaseMutable(status: CaseStatus | string): void {
  if (status === CaseStatus.CLOSED || status === "CLOSED") {
    throw new Error("case is CLOSED");
  }
  if (status === CaseStatus.PENDING || status === "PENDING") {
    throw new Error("case is PENDING — claim first");
  }
  if (status === CaseStatus.TRANSFER_PENDING || status === "TRANSFER_PENDING") {
    throw new Error(
      "case is TRANSFER_PENDING — accept, reject, or cancel first"
    );
  }
}

export function assertCanClaim(
  caseRow: ClaimableCase,
  admin: ClaimAdmin
): void {
  if (caseRow.status !== CaseStatus.PENDING && caseRow.status !== "PENDING") {
    throw new Error("only PENDING cases can be claimed");
  }
  if (admin.status !== AdminStatus.APPROVED && admin.status !== "APPROVED") {
    throw new Error("assignee admin not found or not APPROVED");
  }
  if (
    caseRow.healthcareFacilityId &&
    caseRow.healthcareFacilityId !== admin.healthcareFacilityId
  ) {
    throw new Error("assignee must belong to the case owning facility");
  }
}

export function buildClaimUpdate(
  caseRow: { healthcareFacilityId: string | null },
  admin: { id: string; healthcareFacilityId: string }
): Prisma.CaseUncheckedUpdateInput {
  return {
    status: CaseStatus.IN_PROGRESS,
    assigneeAdminId: admin.id,
    ...(caseRow.healthcareFacilityId
      ? {}
      : { healthcareFacilityId: admin.healthcareFacilityId }),
  };
}

export function assertCanClose(status: CaseStatus | string): void {
  assertCaseMutable(status);
}

export function buildCloseUpdate(
  reason: string
): Prisma.CaseUncheckedUpdateInput {
  return {
    status: CaseStatus.CLOSED,
    closeCaseReason: reason,
  };
}

export function assertCanWriteTreatmentNote(input: {
  hn: string | null | undefined;
  unreachable: boolean;
}): void {
  if (!input.unreachable && !input.hn) {
    throw new Error("HN is required to write a TreatmentNote");
  }
}

export function buildRequestTransferUpdate(input: {
  toFacilityId: string;
  note?: string | null;
  requestedAt: Date;
}): Prisma.CaseUncheckedUpdateInput {
  return {
    transferToFacilityId: input.toFacilityId,
    transferNote: input.note?.trim() || null,
    transferRequestedAt: input.requestedAt,
    status: CaseStatus.TRANSFER_PENDING,
  };
}

export function buildAcceptTransferUpdate(
  toFacilityId: string
): Prisma.CaseUncheckedUpdateInput {
  return {
    healthcareFacilityId: toFacilityId,
    transferToFacilityId: null,
    transferNote: null,
    transferRequestedAt: null,
    assigneeAdminId: null,
    status: CaseStatus.PENDING,
  };
}

export function buildRejectTransferUpdate(): Prisma.CaseUncheckedUpdateInput {
  return {
    transferToFacilityId: null,
    transferNote: null,
    transferRequestedAt: null,
    status: CaseStatus.IN_PROGRESS,
  };
}

/** Source cancel restores the same Case fields as reject (keep assignee). */
export function buildCancelTransferUpdate(): Prisma.CaseUncheckedUpdateInput {
  return buildRejectTransferUpdate();
}

export function assertCanRequestTransfer(input: {
  status: CaseStatus | string;
  healthcareFacilityId: string | null;
  transferToFacilityId: string | null;
  toFacilityId: string;
}): void {
  assertCaseMutable(input.status);
  if (!input.healthcareFacilityId) {
    throw new Error("case has no owning facility");
  }
  if (input.healthcareFacilityId === input.toFacilityId) {
    throw new Error("cannot transfer to the same facility");
  }
  if (input.transferToFacilityId) {
    throw new Error("case already has a pending transfer");
  }
}

export function assertCanRespondTransfer(input: {
  status: CaseStatus | string;
  transferToFacilityId: string | null;
  responderFacilityId: string;
}): void {
  if (
    input.status !== CaseStatus.TRANSFER_PENDING &&
    input.status !== "TRANSFER_PENDING"
  ) {
    throw new Error("only TRANSFER_PENDING cases can be accepted or rejected");
  }
  if (!input.transferToFacilityId) {
    throw new Error("case has no pending transfer target");
  }
  if (input.transferToFacilityId !== input.responderFacilityId) {
    throw new Error("only the target facility can respond to the transfer");
  }
}

export function assertCanCancelTransfer(input: {
  status: CaseStatus | string;
  healthcareFacilityId: string | null;
  transferToFacilityId: string | null;
  cancellerFacilityId: string;
}): void {
  if (
    input.status !== CaseStatus.TRANSFER_PENDING &&
    input.status !== "TRANSFER_PENDING"
  ) {
    throw new Error("only TRANSFER_PENDING cases can be cancelled");
  }
  if (!input.transferToFacilityId) {
    throw new Error("case has no pending transfer target");
  }
  if (!input.healthcareFacilityId) {
    throw new Error("case has no owning facility");
  }
  if (input.healthcareFacilityId !== input.cancellerFacilityId) {
    throw new Error("only the owning facility can cancel the transfer");
  }
}
