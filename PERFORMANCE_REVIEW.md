# รายงานการตรวจสอบ Performance (Performance Review)

ตรวจสอบตาม Vercel React Best Practices และหลักการของ Dev RPP

---

## สรุประดับความรุนแรง

| ระดับ | จำนวน | รายการหลัก |
|--------|--------|-------------|
| CRITICAL | 2 | API waterfall, การ fetch ซ้ำ/ตามลำดับ |
| HIGH | 4 | Re-render, useMemo ขาด, dependency array |
| MEDIUM | 3 | useCallback deps ผิด, การโหลดข้อมูลซ้ำ |
| LOW | 2 | console.log คอมเมนต์, การใช้ `any` |

---

## 1. CRITICAL – Waterfall / การดึงข้อมูลตามลำดับ

### 1.1 `app/api/profile/user/[id]/route.ts` (GET)

**ปัญหา:** การเรียก DB/API หลายครั้งแบบตามลำดับ (waterfall)

- `findUnique` user → (ถ้า line) `getProfile` + `update` user → `findUnique` อีกครั้งสำหรับ profile → (ถ้ามี citizenId) `findFirst` referent

**ผลกระทบ:** เวลา response ช้า โดยเฉพาะเมื่อเป็นบัญชี LINE

**แนวทางแก้:**

- รวมการดึง user + profile เป็น query เดียว (หรือ reuse ผลจาก query แรก)
- ถ้าต้องอัปเดต LINE profile ให้ทำแยกหรือทำหลังส่ง response กลับ (fire-and-forget) ถ้าข้อมูลไม่จำเป็นต้องสดใน response เดียว
- ดึง referent พร้อมกับ profile ใน query เดียวถ้าโครงสร้าง relation รองรับ

### 1.2 `app/admin/(app)/components/question/question-edit-drawer.tsx` (useEffect โหลด list)

**ปัญหา:** โหลด 4 API ตามลำดับ

```ts
GetProvinceList();
GetDistrictList();
GetSubdistrictList();
GetConsultantList();
```

**แนวทางแก้:** ใช้ `Promise.all` เพื่อโหลดพร้อมกัน

```ts
Promise.all([
  GetProvinceList(),
  GetDistrictList(),
  GetSubdistrictList(),
  GetConsultantList(),
]);
```

---

## 2. HIGH – Re-render / การคำนวณซ้ำ

### 2.1 `app/liff/profile/page.tsx`

**ปัญหา 1:** `fetchProfileData` ถูกใช้ใน `useEffect` แต่ไม่ได้ห่อด้วย `useCallback` และไม่ได้ใส่ใน dependency array  
→ เสี่ยง stale closure และไม่ผ่าน exhaustive-deps

**แนวทางแก้:** ห่อ `fetchProfileData` ด้วย `useCallback` (dependency เช่น `session?.user?.id`) แล้วใส่ใน array ของ `useEffect`

**ปัญหา 2:** `ProfileHandleChange`, `AddressHandleChange`, `EmergencyHandleChange` ใส่ `[profile]`, `[address]`, `[emergency]` ใน dependency  
→ callback ถูกสร้างใหม่ทุกครั้งที่ state เปลี่ยน (ทุก keystroke) ทำให้ child re-render บ่อย

**แนวทางแก้:** ภายใน handler ใช้แค่ `setProfile(prev => ...)` ไม่ได้อ่าน `profile` โดยตรง ดังนั้น dependency ควรเป็น `[]` เพื่อให้ callback เสถียร

### 2.2 `app/liff/components/ProfileAvatar.tsx`

**ปัญหา:** มี 2 `useEffect` แยกกัน เมื่อ authenticated:

1. เรียก `/api/profile/user/:id` (สำหรับ referent + displayName)
2. เรียก `/api/profile/admin/:id` (สำหรับ isAdmin)

**ผลกระทบ:** เรียก API สองครั้งแยกกัน แม้จะ trigger จาก session เดียวกัน

**แนวทางแก้:** รวมเป็น 1 `useEffect` แล้วใช้ `Promise.all` เรียกทั้งสอง endpoint พร้อมกัน แล้วค่อย set state จากผลทั้งสอง (หรือรวม logic ใน API เดียวถ้าออกแบบได้)

### 2.3 `app/admin/(app)/page.tsx` (Admin Home)

**ปัญหา:** `filterByAge`, `filterLatestQuestions`, `schoolStats`, `schoolStatsSummary` คำนวณทุก render โดยไม่มี `useMemo`

**ผลกระทบ:** เมื่อ `rawQuestions` ใหญ่ การ filter/reduce จะรันซ้ำทุก re-render

**แนวทางแก้:** ห่อด้วย `useMemo` โดยใช้ `rawQuestions` (และค่าที่เกี่ยวข้อง) เป็น dependency

---

## 3. MEDIUM – Data Fetching / โครงสร้าง Effect

### 3.1 `app/liff/register/page.tsx`

**ปัญหา:** `NextStep` ใช้ dependency `[selected, profile, address, emergency]`  
→ เปลี่ยนทุกครั้งที่ form เปลี่ยน และ `SaveToDB` ถูกอ้างอิงภายในแต่ไม่ได้อยู่ใน deps

**แนวทางแก้:** พิจารณาใช้ ref สำหรับค่าที่ใช้ใน callback หรือลด dependency ให้เหลือเฉพาะที่จำเป็น เพื่อไม่ให้ re-create บ่อยเกินไป

### 3.2 `app/liff/register/components/step1.tsx`

**ปัญหา:** ใน `useEffect` เรียก `fetch("/api/data/school")` แยกจาก logic อื่น และ dependency เป็น `[Result]`  
→ ทุกครั้งที่ `Result` เปลี่ยน (เช่น จาก parent) จะ fetch school ซ้ำ

**แนวทางแก้:** แยก effect สำหรับโหลด school ออกมาและใช้ dependency เป็น `[]` (โหลดครั้งเดียว) หรือใช้ cache/SWR เพื่อไม่ให้โหลดซ้ำโดยไม่จำเป็น

### 3.3 `app/api/profile/user/[id]/route.ts` (PUT)

**ปัญหา:** หลาย `await` ต่อกัน: update profile → findUnique → update address → update emergency → updateMany → findUnique อีกครั้ง  
→ บางขั้นตอนทำพร้อมกันได้ (เช่น address + emergency)

**แนวทางแก้:** ใช้ `Promise.all` สำหรับการ update ที่ไม่ขึ้นต่อกัน (เช่น address และ emergency) เพื่อลดเวลา response

---

## 4. LOW – คุณภาพโค้ดที่กระทบการดูแลและ performance

### 4.1 Debug / Comment

- `app/api/register/admin/route.ts`: มี comment `// console.log("Update Profile");` — ลบออกถ้าไม่ใช้
- `scripts/recalculate-phqa.js`, `teenmind-server.js`: ใช้ `console.log` สำหรับ CLI/server — ยอมรับได้สำหรับสคริปต์และ server

### 4.2 การใช้ `any`

มีหลายจุดที่ใช้ `any` (เช่น props, event, state) ใน `app/liff/profile/page.tsx`, `app/liff/register/`, `app/admin/(app)/`  
→ แนะนำให้กำหนด type/interface ให้ชัดเจนเพื่อลด bug และช่วยให้ optimizer ทำงานได้ดีขึ้น

---

## 5. สิ่งที่ทำได้ดีแล้ว

- ใช้ `useCallback` / `useMemo` ในหลายหน้า admin (question, mycase, members, user, school, modal-export-data, pie-charts-section)
- ใช้ `@tanstack/react-query` ใน Admin Home สำหรับ fetch questions
- โครงสร้างแยก component ชัดเจน

---

## 6. แนวทางที่แนะนำเพิ่ม (จาก Vercel Best Practices)

- **Bundle:** พิจารณาใช้ `next/dynamic` สำหรับ component หนัก (เช่น แผนที่, modal ขนาดใหญ่) เพื่อลด initial JS
- **Server:** พิจารณาใช้ `React.cache()` หรือ caching ที่เหมาะสมสำหรับข้อมูลที่ดึงซ้ำใน request เดียว
- **Client:** พิจารณาใช้ SWR หรือ React Query สำหรับหน้า LIFF ที่มีการ fetch profile/ข้อมูลซ้ำ เพื่อ dedupe และ cache

---

*รายงานนี้สร้างจากการตรวจสอบโค้ดตาม Performance Review และจะมีการแก้ไขจุดสำคัญในขั้นตอนถัดไป*
