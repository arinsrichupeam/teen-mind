# Vercel React Best Practices — Code Review Report

**Project:** Teen Mind (Next.js 15 App Router)  
**Review Date:** 2026-07-01  
**Skill Used:** `vercel-react-best-practices` v1.0.0  
**Reviewer:** Claude Code (claude-sonnet-4-6)

---

## Executive Summary

โปรเจกต์นี้มีโครงสร้างที่ดีโดยรวม แต่พบ issue หลายจุดที่ส่งผลต่อ performance ตามมาตรฐาน Vercel React Best Practices โดยเฉพาะปัญหา **waterfall ใน API route**, **sequential DB queries ใน while-loop**, และ **ขาด dynamic imports** สำหรับ heavy library อย่าง Leaflet และ Recharts

---

## ผลการตรวจสอบตามหมวด

### 🔴 Critical Issues

#### 1. Sequential Database Queries ใน While-Loop (Rule 1.4 — Promise.all)

**ไฟล์:** `app/api/dashboard/usage-stats/route.ts`

API route นี้ใช้ `while` loop ที่มี sequential `await` หลายตัวต่อ iteration:

```ts
while (cursor <= cursorEnd) {
  const totalUse = await prisma.profile.count(...)           // await 1
  const sexGroups = await prisma.profile.groupBy(...)        // await 2
  const questionsInMonth = await prisma.questions_Master.findMany(...) // await 3
  // ...
  cursor = new Date(...)
}
```

ถ้ามี 24 เดือน = **72 sequential DB queries** — ควร parallel queries ใน iteration เดียว:

```ts
const [totalUse, sexGroups, questionsInMonth] = await Promise.all([
  prisma.profile.count({ where: { createdAt: { gte: start, lt: end } } }),
  prisma.profile.groupBy({ ... }),
  prisma.questions_Master.findMany({ ... }),
])
```

**Impact: CRITICAL — ทำให้ API นี้ช้ามากเมื่อมีข้อมูลหลายเดือน**

---

#### 2. ไม่มี Dynamic Import สำหรับ Heavy Libraries (Rule 2.4 — Dynamic Imports)

**ไฟล์:** `app/admin/(app)/components/map/assessment-map.tsx` และ components ที่ใช้ Leaflet (11 ไฟล์), Recharts (หลายไฟล์)

`leaflet`, `react-leaflet`, `recharts` เป็น library ขนาดใหญ่ที่ถูก import แบบ static และ render ใน client components หลายไฟล์โดยไม่มี `next/dynamic`:

```tsx
// ปัจจุบัน — โหลดรวมกับ main bundle
import { MapContainer } from "react-leaflet"
import { PieChart, Pie } from "recharts"
```

**ควรเป็น:**
```tsx
const AssessmentMap = dynamic(() => import('./components/map/assessment-map'), {
  ssr: false,
  loading: () => <MapSkeleton />
})
```

**Impact: CRITICAL — ส่งผลโดยตรงต่อ TTI และ initial bundle size**

---

#### 3. ขาด `optimizePackageImports` ใน next.config.js (Rule 2.1 — Barrel Imports)

**ไฟล์:** `next.config.js`

`@heroui/react` และ `@heroicons/react` เป็น barrel files ที่ import ใช้กันทั่วโปรเจกต์ (50+ ไฟล์) แต่ไม่มีการ configure `optimizePackageImports`:

```js
// next.config.js — ปัจจุบัน
const nextConfig = {
  reactStrictMode: false,
  devIndicators: { appIsrStatus: false },
  optimizeFonts: false
}
```

**ควรเพิ่ม:**
```js
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@heroui/react', '@heroicons/react', 'recharts'],
  },
}
```

`@heroicons/react` ถูก import แบบ sub-path (`/24/outline`) อยู่แล้ว ซึ่งดี แต่ `@heroui/react` และ `recharts` ยังเป็น barrel import

**Impact: CRITICAL — 200-800ms import cost ทุก cold start**

---

### 🟠 High Priority Issues

#### 4. `reactStrictMode: false` (Rule 8.1 — Initialize App Once)

**ไฟล์:** `next.config.js:3`

StrictMode ช่วยตรวจจับ bugs ใน development เช่น side effects ที่ run ซ้ำ, deprecated APIs การปิดมันทำให้พลาด issues หลายอย่าง ปัญหานี้อาจเกิดจากการใช้ `useEffect` สำหรับ initialization logic ที่ run ซ้ำใน StrictMode

**Impact: HIGH — ซ่อน bugs ที่ StrictMode จะช่วยตรวจจับ**

---

#### 5. `sessionStorage` ถูกอ่านโดยตรงโดยไม่ Cache (Rule 4.4, 7.5)

**ไฟล์:** `auth-guard.tsx`, `export-button.tsx`, `status-update-button.tsx`, `sidebar-wrapper.tsx`, `user-dropdown.tsx`

มีการอ่าน `sessionStorage.getItem("adminProfile")` หลายจุดโดยไม่มี in-memory cache และไม่มี error handling ใน Safari/incognito:

```tsx
// ปัจจุบัน — ไม่มี try-catch, ไม่มี cache
const storedProfile = sessionStorage.getItem("adminProfile")
```

**ควรเป็น:**
```ts
// shared utility
const storageCache = new Map<string, string | null>()

function getSessionStorage(key: string) {
  if (!storageCache.has(key)) {
    try {
      storageCache.set(key, sessionStorage.getItem(key))
    } catch {
      storageCache.set(key, null)
    }
  }
  return storageCache.get(key)
}
```

นอกจากนี้ ข้อมูล `adminProfile` ถูก store แบบไม่มี version key — ถ้า schema เปลี่ยนจะเกิด bug เงียบๆ ควรใช้ key แบบ `adminProfile:v1`

**Impact: HIGH — crash ใน incognito/Safari, bug เมื่อ schema เปลี่ยน**

---

#### 6. Waterfall ใน API Routes (Rule 1.3 — API Route Waterfall)

**ไฟล์:** `app/api/profile/user/[id]/route.ts`, `app/api/question/route.ts`

พบ pattern sequential `await` ที่ operations เป็นอิสระต่อกัน:

```ts
// ตัวอย่างจากหลาย routes
const auth = await requireAdmin()    // await 1
// ... validation ...
const data = await prisma.xxx.findMany(...)  // await 2 (ไม่ต้องรอ auth)
```

ใน `psychologist-productivity/route.ts` ทำถูกต้องแล้ว (ใช้ `Promise.all`) — ควร apply pattern เดียวกันทั่วทั้งโปรเจกต์

**Impact: HIGH — เพิ่ม latency ทุก request**

---

### 🟡 Medium Priority Issues

#### 7. Suspense Boundaries ไม่ครอบคลุมพอ (Rule 1.5 — Strategic Suspense)

**ไฟล์:** `app/admin/(app)/page.tsx`

Dashboard หน้าหลักเป็น `"use client"` ที่ทำ data fetching ด้วย React Query ทั้งหน้า แต่ `Suspense` ถูกใช้ในบางส่วนเท่านั้น Charts section หลายตัว (7+ charts) รอ data พร้อมกันทั้งหน้า

แต่ละ chart section ควรอยู่ใน `Suspense` ของตัวเอง เพื่อให้ส่วนที่ data มาก่อนแสดงได้เลย

**Impact: MEDIUM — ผู้ใช้เห็น skeleton ทั้งหน้านานกว่าที่จำเป็น**

---

#### 8. `.sort()` Mutates Array (Rule 7.13 — toSorted)

**ไฟล์:** `app/admin/(app)/components/recalculate-phqa.tsx:306`, `app/admin/(app)/mycase/page.tsx:107-113`, `app/admin/(app)/question/page.tsx:146-152`, `app/admin/(app)/report/page.tsx:477`

พบการใช้ `.sort()` บน array ที่อาจเป็น prop/state:

```ts
// recalculate-phqa.tsx:306
return stats.sort((a, b) => { ... })  // mutates stats!

// mycase/page.tsx:107
.sort()  // mutates array
```

**ควรใช้:**
```ts
return stats.toSorted((a, b) => { ... })
// หรือ [...stats].sort(...)
```

**Impact: MEDIUM — อาจทำให้ React state/props ถูก mutate โดยไม่ตั้งใจ**

---

#### 9. Manual Loading State แทน `useTransition` (Rule 6.11)

**ไฟล์:** หลายไฟล์ใน `app/admin/(app)/components/` เช่น `modal-status-update.tsx`, `status-update-button.tsx`

พบ pattern manual `isLoading` state ซึ่งเสี่ยงต่อ bug ถ้า async operation throw:

```tsx
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async () => {
  setIsLoading(true)
  await someAction()
  setIsLoading(false)  // ถ้า throw จะไม่ถูก reset
}
```

**ควรใช้:**
```tsx
const [isPending, startTransition] = useTransition()

const handleSubmit = () => {
  startTransition(async () => {
    await someAction()
  })
}
```

**Impact: MEDIUM — UX ที่ดีขึ้นและ resilience ต่อ errors**

---

#### 10. `useEffect` สำหรับ Derived State (Rule 5.1 — Derived State During Render)

**ไฟล์:** `app/admin/(app)/components/home/pie-charts-section.tsx`, `app/admin/(app)/components/home/dashboard-date-filter-fab.tsx`

พบ pattern ใช้ `useEffect` เพื่ออัพเดต state ที่สามารถ derive ได้ตอน render:

```tsx
// ตัวอย่าง pattern ที่พบ
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(firstName + ' ' + lastName)
}, [firstName, lastName])
```

ควร calculate ตรงๆ ในตอน render แทน

**Impact: MEDIUM — extra render, state drift risk**

---

#### 11. `moment` Library ขนาดใหญ่ (Rule 2.4 — Bundle Size)

**ไฟล์:** `app/admin/(app)/components/question/question-edit-drawer.tsx`, `app/admin/(app)/report/page.tsx`

`moment` เป็น library ที่มี bundle size ~67KB (minified+gzipped) และ load ทั้ง locale data ของทุกภาษา Next.js 15 / React 19 มี Intl API built-in ที่ทำได้เหมือนกัน หรือใช้ `date-fns` ที่ tree-shakable แทน

**Impact: MEDIUM — ~67KB เพิ่มขึ้นใน bundle โดยไม่จำเป็น**

---

### 🟢 Low Priority Issues

#### 12. `&&` Conditional Rendering กับ Numeric Values (Rule 6.9)

**ไฟล์:** หลายไฟล์

พบ pattern `{count && <Component />}` ที่จะ render `0` เมื่อ count เป็น 0:

```tsx
// app/admin/(app)/components/home/consult-telemed-charts.tsx:90
{stats.gender.other > 0 && (  // ✅ ทำถูกต้อง
```

บางไฟล์ทำถูกต้องแล้ว แต่ควร review ให้ครบทั้งหมดโดยเฉพาะที่ใช้ `.length &&`

**Impact: LOW — อาจแสดง "0" ใน UI โดยไม่ตั้งใจ**

---

#### 13. ไม่ใช้ `React.cache()` สำหรับ DB Queries ที่ซ้ำกัน (Rule 3.7)

**ไฟล์:** `lib/get-session.ts`, API routes หลายไฟล์

`requireAdmin()` และ `getSession()` ถูกเรียกหลายครั้งต่อ request ใน API routes แต่ไม่ได้ wrap ด้วย `React.cache()` เพื่อ deduplication

```ts
// ควรเป็น
import { cache } from 'react'

export const requireAdmin = cache(async () => {
  // ...
})
```

**Impact: LOW — ลด DB queries ซ้ำซ้อนต่อ request**

---

#### 14. `reactStrictMode: false` ทำให้ Double-invoke ใน Dev ไม่ทำงาน (Rule 8.1)

เกี่ยวข้องกับ issue #4 ด้านบน — การปิด StrictMode อาจ mask bugs ที่เกิดจาก initialization logic ใน `useEffect([])` ที่ควร run แค่ครั้งเดียว

---

## สิ่งที่ทำได้ดีแล้ว ✅

| ประเด็น | หมายเหตุ |
|---------|---------|
| **`@heroicons/react` sub-path imports** | Import จาก `/24/outline` โดยตรง ไม่ใช้ barrel |
| **`Promise.all` ใน psychologist-productivity** | Parallel DB queries ที่ทำถูกต้อง |
| **React Query สำหรับ client data fetching** | ใช้ TanStack React Query แทน manual fetch+useEffect |
| **Suspense บางจุด** | มี Suspense boundary ใน map, dashboard-productivity, members pages |
| **Functional setState** | หลายส่วน (เช่น mycase page) ใช้ functional update รูปแบบ `setItems(curr => ...)` |
| **Server-side auth guard** | `requireAdmin()` ถูกเรียกใน API routes ทุกเส้น |
| **TypeScript strict** | โปรเจกต์ใช้ TypeScript ทั่วทั้ง codebase |

---

## สรุปลำดับความสำคัญ

| ลำดับ | Issue | Rule | Impact | ไฟล์หลัก |
|-------|-------|------|--------|-----------|
| 1 | Sequential DB queries ใน while-loop | 1.4 | 🔴 CRITICAL | `usage-stats/route.ts` |
| 2 | ไม่มี dynamic import สำหรับ Leaflet/Recharts | 2.4 | 🔴 CRITICAL | map components, charts |
| 3 | ขาด `optimizePackageImports` | 2.1 | 🔴 CRITICAL | `next.config.js` |
| 4 | SessionStorage ไม่มี cache/error handling | 4.4, 7.5 | 🟠 HIGH | auth-guard, export-button |
| 5 | `.sort()` mutates props/state | 7.13 | 🟡 MEDIUM | recalculate-phqa, mycase, report |
| 6 | Manual loading state | 6.11 | 🟡 MEDIUM | modal components |
| 7 | `moment` library ขนาดใหญ่ | 2.4 | 🟡 MEDIUM | question-edit-drawer, report |
| 8 | `&&` rendering กับ numbers | 6.9 | 🟢 LOW | หลายไฟล์ |
| 9 | ไม่ใช้ `React.cache()` | 3.7 | 🟢 LOW | `lib/get-session.ts` |

---

## Quick Wins (แก้ได้เร็ว)

1. **`next.config.js`** — เพิ่ม `optimizePackageImports` 3 บรรทัด
2. **`usage-stats/route.ts`** — Wrap 3 queries ใน `Promise.all()` ใน loop
3. **`.sort()` → `.toSorted()`** — Find & replace 5-6 จุด
4. **sessionStorage** — สร้าง shared utility function เดียว แทนการอ่านซ้ำหลายไฟล์
