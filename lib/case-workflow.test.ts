import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CaseStatus } from "@prisma/client";

import {
  assertCanCancelTransfer,
  assertCanClaim,
  assertCanClose,
  assertCanWriteTreatmentNote,
  assertCaseMutable,
  buildAcceptTransferUpdate,
  buildCancelTransferUpdate,
  buildClaimUpdate,
  buildCloseUpdate,
  buildRejectTransferUpdate,
  buildRequestTransferUpdate,
  buildTransferPendingQueueWhere,
} from "./case-workflow";

describe("case-workflow", () => {
  it("blocks mutate while PENDING, TRANSFER_PENDING, or CLOSED", () => {
    assert.throws(() => assertCaseMutable(CaseStatus.PENDING), /claim/i);
    assert.throws(
      () => assertCaseMutable(CaseStatus.TRANSFER_PENDING),
      /transfer/i
    );
    assert.throws(() => assertCaseMutable(CaseStatus.CLOSED), /CLOSED/i);
    assert.doesNotThrow(() => assertCaseMutable(CaseStatus.IN_PROGRESS));
  });

  it("allows claim only for PENDING with matching facility", () => {
    assert.throws(
      () =>
        assertCanClaim(
          {
            status: CaseStatus.IN_PROGRESS,
            healthcareFacilityId: "f1",
          },
          { id: "a1", healthcareFacilityId: "f1", status: "APPROVED" }
        ),
      /PENDING/
    );

    assert.throws(
      () =>
        assertCanClaim(
          { status: CaseStatus.PENDING, healthcareFacilityId: "f1" },
          { id: "a1", healthcareFacilityId: "f2", status: "APPROVED" }
        ),
      /facility/
    );

    assert.throws(
      () =>
        assertCanClaim(
          { status: CaseStatus.PENDING, healthcareFacilityId: "f1" },
          { id: "a1", healthcareFacilityId: "f1", status: "PENDING" }
        ),
      /APPROVED/
    );

    assert.doesNotThrow(() =>
      assertCanClaim(
        { status: CaseStatus.PENDING, healthcareFacilityId: "f1" },
        { id: "a1", healthcareFacilityId: "f1", status: "APPROVED" }
      )
    );
  });

  it("builds claim update to IN_PROGRESS and sets facility if missing", () => {
    assert.deepEqual(
      buildClaimUpdate(
        { healthcareFacilityId: "f1" },
        { id: "a1", healthcareFacilityId: "f1" }
      ),
      {
        status: CaseStatus.IN_PROGRESS,
        assigneeAdminId: "a1",
      }
    );

    assert.deepEqual(
      buildClaimUpdate(
        { healthcareFacilityId: null },
        { id: "a1", healthcareFacilityId: "f9" }
      ),
      {
        status: CaseStatus.IN_PROGRESS,
        assigneeAdminId: "a1",
        healthcareFacilityId: "f9",
      }
    );
  });

  it("closes only mutable cases", () => {
    assert.throws(() => assertCanClose(CaseStatus.PENDING), /claim/i);
    assert.doesNotThrow(() => assertCanClose(CaseStatus.IN_PROGRESS));
    assert.deepEqual(buildCloseUpdate("done"), {
      status: CaseStatus.CLOSED,
      closeCaseReason: "done",
    });
  });

  it("requires HN for treatment notes unless unreachable", () => {
    assert.throws(
      () => assertCanWriteTreatmentNote({ hn: null, unreachable: false }),
      /HN/
    );
    assert.doesNotThrow(() =>
      assertCanWriteTreatmentNote({ hn: null, unreachable: true })
    );
    assert.doesNotThrow(() =>
      assertCanWriteTreatmentNote({ hn: "123", unreachable: false })
    );
  });

  it("builds transfer request / accept / reject field updates", () => {
    const requestedAt = new Date("2026-01-01T00:00:00.000Z");

    assert.deepEqual(
      buildRequestTransferUpdate({
        toFacilityId: "f2",
        note: "please",
        requestedAt,
      }),
      {
        transferToFacilityId: "f2",
        transferNote: "please",
        transferRequestedAt: requestedAt,
        status: CaseStatus.TRANSFER_PENDING,
      }
    );

    assert.deepEqual(buildAcceptTransferUpdate("f2"), {
      healthcareFacilityId: "f2",
      transferToFacilityId: null,
      transferNote: null,
      transferRequestedAt: null,
      assigneeAdminId: null,
      status: CaseStatus.PENDING,
    });

    assert.deepEqual(buildRejectTransferUpdate(), {
      transferToFacilityId: null,
      transferNote: null,
      transferRequestedAt: null,
      status: CaseStatus.IN_PROGRESS,
    });

    assert.deepEqual(buildCancelTransferUpdate(), buildRejectTransferUpdate());
  });

  it("allows cancel only for TRANSFER_PENDING by owning facility", () => {
    assert.throws(
      () =>
        assertCanCancelTransfer({
          status: CaseStatus.IN_PROGRESS,
          healthcareFacilityId: "f1",
          transferToFacilityId: "f2",
          cancellerFacilityId: "f1",
        }),
      /TRANSFER_PENDING/
    );

    assert.throws(
      () =>
        assertCanCancelTransfer({
          status: CaseStatus.TRANSFER_PENDING,
          healthcareFacilityId: "f1",
          transferToFacilityId: "f2",
          cancellerFacilityId: "f2",
        }),
      /owning facility/
    );

    assert.doesNotThrow(() =>
      assertCanCancelTransfer({
        status: CaseStatus.TRANSFER_PENDING,
        healthcareFacilityId: "f1",
        transferToFacilityId: "f2",
        cancellerFacilityId: "f1",
      })
    );
  });

  it("buildTransferPendingQueueWhere includes inbound and outbound for a facility", () => {
    assert.deepEqual(buildTransferPendingQueueWhere("fac-a"), {
      status: CaseStatus.TRANSFER_PENDING,
      OR: [
        { transferToFacilityId: "fac-a" },
        { healthcareFacilityId: "fac-a" },
      ],
    });
  });

  it("buildTransferPendingQueueWhere without facility is all TRANSFER_PENDING", () => {
    assert.deepEqual(buildTransferPendingQueueWhere(null), {
      status: CaseStatus.TRANSFER_PENDING,
    });
    assert.deepEqual(buildTransferPendingQueueWhere("  "), {
      status: CaseStatus.TRANSFER_PENDING,
    });
  });
});
