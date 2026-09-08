# Teen Mind

Thai mental-health screening and follow-up for citizens (LIFF) and staff (admin).

## Language

**Case**:
One screening-and-follow-up episode for a citizen profile, including linked questionnaires and treatment notes.
_Avoid_: Questions_Master, assessment record, question master

**TreatmentNote**:
One follow-up round on a Case (consult/telemed, SOAP, follow-up date, unreachable flag), keyed by round number.
_Avoid_: flattened consult2/subjective2 columns, discharge-summary row on the master table

**Volunteer**:
A counselor or community volunteer who can be linked to a Case.
_Avoid_: Referent

**ProfileAdmin**:
A staff account profile with role and affiliation, used for admin access and clinical notes authorship.
_Avoid_: Profile_Admin

**Profile**:
The citizen (service-user) record linked to LINE auth, demographics, and Cases.
_Avoid_: user profile (when meaning the citizen), member (when meaning citizen)

**CaseStatus**:
Workflow state of a Case: pending intake, in progress, transfer pending, or closed.
_Avoid_: using this for follow-up round completeness (0–3)

**Follow-up progress**:
Derived completeness of TreatmentNote rounds plus Profile HN (legacy UI values 0–3). Not stored as CaseStatus.
_Avoid_: Case.status, Questions_Master.status as the workflow field

**ScreeningResult**:
Canonical summary risk of a Case: `NEGATIVE`, `POSITIVE_LOW`, `POSITIVE_MODERATE`, `POSITIVE_HIGH` (Orange), `POSITIVE_SEVERE` (Red), `INCOMPLETE`.
_Avoid_: Green / Green-Low / Yellow / Orange / Red as stored values
