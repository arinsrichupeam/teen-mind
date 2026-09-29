# Bangkok Mind

Thai mental-health screening and follow-up for citizens and staff (Bangkok / กทม. context). Codebase may still use the historical repo name; the product language is Bangkok Mind.

## Language

**Case**:
One screening-and-follow-up episode for a citizen profile, including linked questionnaires and treatment notes, owned by a HealthcareFacility copied from the Profile at Case creation. A Profile may have only one open Case at a time. An open Case may have multiple **assessment rounds** (same package); after CLOSED, staff start a new Case rather than reopening the same row (see ADR 0005, ADR 0006).
_Avoid_: Questions_Master, assessment record, question master, requiring three TreatmentNotes before CLOSED, rewriting old Cases when Profile facility changes, flipping CLOSED back to IN_PROGRESS on the same Case

**AssessmentRound**:
One complete (or in-progress) screening pass on a Case, identified by `Question*.round`. Round 1 starts at Case creation; later rounds may be opened by citizen or staff once the current round’s screening is complete. Does not require a TreatmentNote to open.
_Avoid_: treating a new LIFF submit as a new Case when an open Case’s current round is already complete, conflating AssessmentRound with TreatmentNote.round

**AssessmentPackage**:
The fixed instrument set on a Case at creation: `BURNOUT`, `DEPRESSION`, or `FULL`. Does not change mid-Case. First citizen delivery slice opens **DEPRESSION only** (UI and create-Case API reject other packages); enum values `BURNOUT`/`FULL` remain in schema for later slices. Within DEPRESSION/FULL, after a positive 2Q the depression instrument is age-routed from birth date only: under 18 → PHQ-A + Addon; 18+ → 9Q. 8Q follows when 9Q ≥ 7 or PHQ-A ≥ 10 (see ADR 0003).
_Avoid_: picking PHQ-A vs 9Q as the top-level package name, Questions_Master as the package, using Student to pick the scale, always requiring 8Q after the main scale, allowing BURNOUT/FULL creates in the first slice

**CaseTransfer**:
A request to move Case ownership from one HealthcareFacility to another. The destination may accept or reject; the source facility may cancel while still pending (`CANCELLED`, distinct from destination `REJECTED`).
_Avoid_: informal “ส่งต่อ” without a transfer record, one-way reassignment with no response, treating source cancel as REJECTED

**CaseClaim**:
Exclusive staff assignment of a PENDING Case to one ProfileAdmin before TreatmentNote or CaseTransfer work.
_Avoid_: any facility staff editing an unclaimed Case, shared simultaneous ownership without claim

**TreatmentNote**:
One care round on a Case (consult/telemed, SOAP, follow-up date, unreachable flag), keyed by round number. Opening a TreatmentNote requires Profile HN, except when the note is marked unreachable. Rounds are not capped at three; closing a Case does not require three notes. When the citizen was reached, the note may also carry a **session report** (presenting topics, interventions, session outcome, after-care plan, optional service end time) for project follow-up—not a separate entity. Unreachable notes omit the session report. Distinct from AssessmentRound even when round numbers align.
_Avoid_: flattened consult2/subjective2 columns, discharge-summary row on the master table, requiring three rounds before CLOSED, blocking unreachable notes solely for missing HN, requiring a TreatmentNote before opening the next AssessmentRound, a second “Google Form” record beside the note, treating after-care “ยุติ” as automatic Case CLOSED

**HealthcareFacility**:
The care site (e.g. ศบส.) that owns Cases and anchors citizen onboarding. Profile holds the standing facility; each Case stores its own copy from creation time.
_Avoid_: School as the primary ownership/org unit for a Case

**School**:
Optional education site linked to a Profile when the citizen is a student; not the Case owner.
_Avoid_: treating School as required for every Profile, using School in place of HealthcareFacility

**Volunteer**:
A counselor or community volunteer who can be linked to a Case.
_Avoid_: Referent

**ProfileAdmin**:
A staff account profile with role and org anchors, used for staff access and clinical notes authorship. One row per User. Staff sign-in is ThaiD-primary with username/password fallback (see ADR 0004).
_Avoid_: Profile_Admin, LINE as the staff identity provider, multiple ProfileAdmin rows per User for multi-facility access

**AdminDataScope**:
How wide a ProfileAdmin may see Cases and members: `SYSTEM` (whole deployment), `ZONE` (facilities in that Zone), `AFFILIATION` (facilities in that Affiliation, any Zone), or `FACILITY` (one HealthcareFacility). Distinct from Role capabilities (claim / operate / manage members / manage org). FACILITY staff whose home facility is a Zone facilitator (“แม่ zone”) auto-elevate to ZONE only when role is Admin; Consult stays FACILITY. Facility unit is not a Case visibility level (see ADR 0007).
_Avoid_: using Role alone as the visibility radius, treating Zone as parent of Affiliation in the database, using FacilityUnit to filter Cases, elevating Consult at แม่ zone to ZONE

**Profile**:
The citizen (service-user) record linked to LINE-primary auth in LIFF, demographics, HealthcareFacility, optional student School, HN, and Cases. Optional ThaiD verify/prefill runs outside the LIFF WebView and links an Account without replacing the LINE session (see ADR 0004).
_Avoid_: user profile (when meaning the citizen), member (when meaning citizen), ThaiD as the LIFF session provider

**Student**:
A Profile flag meaning the citizen is currently a student; when true, School is required. Does not choose AssessmentPackage instruments.
_Avoid_: inferring student-only from a non-null schoolId, treating every School link as Case ownership, using Student instead of age for PHQ-A vs 9Q

**CaseStatus**:
Workflow state of a Case: pending intake, in progress, transfer pending, or closed.
_Avoid_: using this for follow-up round completeness (0–3), using missing HN as CaseStatus

**Follow-up progress**:
Legacy UI hint for TreatmentNote round completeness (values 0–3), not a gate on CLOSED. Not stored as CaseStatus. HN gates TreatmentNote creation (with unreachable exception), not CaseStatus itself.
_Avoid_: Case.status, Questions_Master.status as the workflow field, blocking close until round 3, treating “รอ HN” as CaseStatus

**ScreeningResult**:
Canonical summary risk: on `Case.result` this is always the **latest** assessment round (or `INCOMPLETE` while that round is open). Per-round history is derived from `Question*` rows by round (see ADR 0006). Values: `NEGATIVE`, `POSITIVE_LOW`, `POSITIVE_MODERATE`, `POSITIVE_HIGH` (Orange), `POSITIVE_SEVERE` (Red), `INCOMPLETE`.
_Avoid_: Green / Green-Low / Yellow / Orange / Red as stored values, treating Case.result as only round 1 forever

**SessionSelfHarmRisk**:
On a reached TreatmentNote, whether self-harm/suicide risk was found in that session: `FOUND` | `NOT_FOUND` | `NOT_ASSESSABLE`. Distinct from ScreeningResult and from PsychRisk. Required on the session report.
_Avoid_: copying 8Q/ScreeningResult into this field, asking this on unreachable notes, using PsychRisk alone as the พบ/ไม่พบ/ประเมินไม่ได้ trichotomy, boolean + null instead of the three-way enum

**PsychRisk**:
Clinician-assessed overall risk level on a reached TreatmentNote: `NONE` (ไม่มีความเสี่ยง) | `LOW` (น้อย) | `MODERATE` (ปานกลาง) | `HIGH` (มาก) | `SEVERE` (รุนแรง). Required on the session report; independent of SessionSelfHarmRisk. Distinct from ScreeningResult on the Case. `null` only when not applicable (unreachable / consult-only).
_Avoid_: copying ScreeningResult into psychRisk, using psychRisk as the Case filter result, treating null and NONE as the same, requiring PsychRisk only when SessionSelfHarmRisk is FOUND

**Session report (on TreatmentNote)**:
Structured project fields on a reached note: presenting topics, care interventions, session outcome, after-care plan (plus service end time). Option lists follow the BKK Mind psychologist follow-up form (including Other + free text). On reached notes, the existing two-step save stays: consult/schedule may save first; completing the round requires SOAP **and** the full session report together. Complements SOAP free text; not QuestionProblem and not CaseFeedback. After-care “นัดติดตามโดยนักจิตวิทยา” requires `followUp`. Choosing “ส่งต่อ” does not create a CaseTransfer; after save, UX may prompt staff to open the existing CaseTransfer flow. Choosing “ยุติการติดตาม” does not close the Case; after save, UX may prompt staff to use the normal Case CLOSED action (not forced).
_Avoid_: storing these only as SOAP prose when reporting needs counts, conflating presenting topics with QuestionProblem, treating after-care ส่งต่อ as CaseTransfer without a transfer record, auto-closing on ยุติ, CaseTransfer DRAFT status, skipping session report on reached notes while still using the Google Form, requiring session report before consult/schedule is saved
