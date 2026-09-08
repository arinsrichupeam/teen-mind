# Staging smoke — schema v2 cutover (#61)

Run against **staging** (`teenmind-v3-staging` or current staging `DATABASE_URL`). Do not drop `legacy_*` until this checklist passes and a human approves.

## Preconditions

- [ ] App built/deployed from branch with Case/TreatmentNote cutover
- [ ] Staging DB has v2 tables populated (ETL already applied, or staging-only data)
- [ ] `npm run build` and `npm test` green on the deployed commit
- [ ] LINE / NextAuth env vars point at staging

## LIFF

- [ ] Login with LINE
- [ ] Register new profile (citizenId, name, phone, address, emergency)
- [ ] Edit profile: keep same citizenId (no duplicate error); change name + phone; save OK
- [ ] Start assessment end-to-end (age &lt; 18 → PHQ-A+addon; age ≥ 18 → 9Q)
- [ ] Result flex arrives; Red (`POSITIVE_SEVERE`) triggers admin alert path if configured

## Admin — cases

- [ ] `/admin/question`: row shows 9Q/PHQ-A score, 2Q risk, 8Q risk (not `-`)
- [ ] Status chip is Thai follow-up label (รอระบุ HN / …) not raw `PENDING`
- [ ] Status filter chips 0–3 return sensible rows (no Prisma enum error)
- [ ] Open drawer → 2Q radios selected correctly; PHQ-A/9Q/8Q answers visible
- [ ] Edit consultation: save TreatmentNote round 1 (schedule + consult + SOAP)
- [ ] Mycase (`consult` filter) lists assigned cases if consultant id stored on notes
- [ ] Bulk status update modal lists open cases and can set closed (`newStatus: 3` → `CLOSED`)

## Admin — other surfaces

- [ ] Map markers / risk colors still Green…Red in UI
- [ ] User detail shows nested assessments without empty scores
- [ ] Individual report history chips show legacy colors / text
- [ ] Export CSV includes result text and scores

## After smoke passes

1. Keep `legacy_*` tables until drop is approved (rollback: re-point reads if needed; prefer restore from backup).
2. Apply `scripts/sql/drop-legacy-tables.sql` **only** on a DB that has parked `legacy_*` tables and confirmed v2 data.
3. Production drop remains a **human gate**.

## Rollback note

Do **not** drop legacy tables on the first green smoke. If v2 data is wrong, restore from backup or re-run ETL from `legacy_*` while those tables still exist.
