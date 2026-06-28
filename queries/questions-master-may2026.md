# Questions Master — พฤษภาคม 2026

ช่วงวันที่: 01/05/2026 – 31/05/2026

---

## นับจำนวนทั้งหมด และ Profile ไม่ซ้ำ

```sql
SELECT
  COUNT(*)                    AS total_assessments,
  COUNT(DISTINCT profileId)   AS unique_profiles
FROM Questions_Master
WHERE DATE(createdAt) BETWEEN '2026-05-01' AND '2026-05-31';
```

---

## แยกตาม result และ status

```sql
SELECT result, status, COUNT(*) AS total
FROM Questions_Master
WHERE DATE(createdAt) BETWEEN '2026-05-01' AND '2026-05-31'
GROUP BY result, status
ORDER BY result, status;
```

---

## ตรวจสอบ Timezone (รันทั้ง 2 แล้วดูอันไหนตรงกับ modal)

### Option A — DB เก็บ Bangkok time (ไม่ต้อง convert)

```sql
SELECT
  DATE(createdAt) AS date_bangkok,
  COUNT(*) AS total
FROM Questions_Master
WHERE DATE(createdAt) BETWEEN '2026-05-01' AND '2026-05-31'
GROUP BY DATE(createdAt)
ORDER BY date_bangkok;
```

### Option B — DB เก็บ UTC (convert เป็น Bangkok)

```sql
SELECT
  DATE(CONVERT_TZ(createdAt, '+00:00', '+07:00')) AS date_bangkok,
  COUNT(*) AS total
FROM Questions_Master
WHERE DATE(createdAt) BETWEEN '2026-05-01' AND '2026-05-31'
GROUP BY date_bangkok
ORDER BY date_bangkok;
```

> อันไหนให้ 30/05 = 6, 31/05 = 5 ตรงกับ modal → ใช้อันนั้นใน query อื่น

---

## รายการทั้งหมด (พร้อมข้อมูล Profile และ Referent)

```sql
SELECT
  qm.id,
  DATE(qm.createdAt) AS date_bangkok,
  qm.result,
  qm.status,
  p.citizenId,
  s.name AS school,
  r.firstname,
  r.lastname
FROM Questions_Master qm
LEFT JOIN Profile p ON qm.profileId = p.id
LEFT JOIN School s ON p.schoolId = s.id
LEFT JOIN Referent r ON qm.referentId = r.id
WHERE DATE(qm.createdAt) BETWEEN '2026-05-01' AND '2026-05-31'
ORDER BY date_bangkok ASC;
```
