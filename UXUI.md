# Personal Learning OS — UX/UI Rules

เอกสารนี้เป็นกฎบังคับสำหรับทุกคนและทุก AI ที่ออกแบบหรือแก้ไข UI ของ Personal Learning OS

เป้าหมายคือสร้างประสบการณ์ที่ **ชัดเจน น่าเชื่อถือ ใช้งานง่าย อ่านสบาย รองรับ Desktop/Mobile และไม่แสดงลักษณะงานออกแบบสำเร็จรูปจาก AI**

---

## 1. Design Direction

### 1.1 Product character

Personal Learning OS เป็น Learning Platform ที่มี Content Management และ Assessment Engine อยู่ในระบบเดียวกัน ดังนั้น UI ต้องสื่อถึง:

- ความน่าเชื่อถือของเนื้อหาและผลการประเมิน
- ความสงบและสมาธิในการเรียน
- ความชัดเจนของลำดับการเรียนและสถานะความคืบหน้า
- ความมั่นใจในการแก้ไข ตรวจทาน และเผยแพร่เนื้อหา
- ความเป็นเครื่องมือจริง ไม่ใช่หน้า Landing Page หรือ Dashboard ตัวอย่าง

### 1.2 Unified UX System

Learner และ Admin ต้องใช้ Design Tokens, Typography, Icon Family, Form Controls, Status Semantics และ Interaction Rules ชุดเดียวกัน แต่ปรับ Density ตามบริบท:

| Surface | เป้าหมาย | Density | บุคลิก |
| --- | --- | --- | --- |
| Learner | เรียน เข้าใจ ทำแบบฝึกหัด และเห็นพัฒนาการ | ต่ำถึงปานกลาง | สงบ มีพื้นที่หายใจ อ่านง่าย |
| Admin | สร้าง ตรวจ แก้ จัดลำดับ และ Publish เนื้อหา | ปานกลางถึงสูง | แม่นยำ มีประสิทธิภาพ มองข้อมูลได้เร็ว |

ห้ามสร้าง Learner และ Admin ให้เหมือนเป็นคนละผลิตภัณฑ์

### 1.3 Design Read และ Dial

ก่อนเริ่มออกแบบหรือแก้ UI ทุกครั้ง ให้ใช้ baseline นี้:

```text
Product type: trust-first learning platform + editorial learning workspace
Audience: self-directed learners, editors, reviewers, administrators
Design variance: 4/10
Motion intensity: 3/10
Visual density: Learner 3–4/10, Admin 6–7/10
```

ห้ามเปลี่ยน baseline เพื่อทำให้งานดูหวือหวาโดยไม่มีเหตุผลเชิงผลิตภัณฑ์

---

## 2. Non-Negotiable Rules

### MUST

1. ออกแบบจาก User Goal และ Task Flow ก่อนความสวยงาม
2. ทำ Responsive สำหรับ Mobile, Tablet และ Desktop ตั้งแต่เริ่ม ไม่ใช่แก้ภายหลัง
3. ใช้ Semantic HTML, Keyboard Navigation, Focus States และ Accessible Labels
4. แสดงสถานะของข้อมูลและ Action อย่างชัดเจน เช่น Draft, In Review, Published, Archived, Saving, Saved, Error
5. ใช้ข้อความที่บอกผลกระทบของ Action โดยเฉพาะ Publish, Archive, Delete, Submit และ Reset
6. ทำ Loading, Empty, Error, Disabled และ Success States สำหรับ Flow สำคัญ
7. รักษา Context ของผู้ใช้เสมอ เช่น Course/Module/Lesson ปัจจุบัน, ข้อที่กำลังทำ, Progress และ Unsaved Changes
8. ใช้ Component และ Token ที่มีอยู่ก่อนสร้างรูปแบบใหม่
9. ตรวจทั้ง Light และ Dark Mode หากระบบรองรับ Theme Switching
10. ทดสอบ UI ที่ viewport อย่างน้อย 360px, 768px, 1024px และ 1440px

### MUST NOT

1. ห้ามใช้ AI-purple gradient, neon glow, mesh background หรือ glassmorphism เป็นค่าเริ่มต้น
2. ห้ามใช้ภาพจำลองด้วย `div` เพื่อแทน Product UI จริง
3. ห้ามใช้ Emoji เป็น Icon ของ Product UI
4. ห้ามซ่อน Action สำคัญไว้ใน Hover-only interaction
5. ห้ามใช้ Placeholder แทน Label ของ Form Field
6. ห้ามใช้สีเพียงอย่างเดียวเพื่อสื่อความหมายของ Error, Success, Locked หรือ Status
7. ห้ามทำปุ่ม Primary มากกว่าหนึ่ง Action ต่อบริบทเดียวกัน
8. ห้ามใช้ Card ซ้อน Card ซ้อน Card เพียงเพื่อแบ่งกลุ่มข้อมูล
9. ห้ามใช้ข้อมูล/ตัวเลข/สถิติที่แต่งขึ้นเพื่อให้ UI ดูสมจริง
10. ห้ามทำ Desktop UI แล้วย่อทุกอย่างลง Mobile โดยไม่ออกแบบ Flow ใหม่
11. ห้ามใช้ Auto-playing Animation, Carousel หรือ Marquee หากไม่ช่วยให้ผู้ใช้ทำงานสำเร็จ
12. ห้ามเพิ่ม UI Library, Icon Library หรือ Animation Library โดยไม่ตรวจ `package.json` และรูปแบบที่มีอยู่

---

## 3. Visual System

### 3.1 Color

ใช้ Semantic Color Tokens เท่านั้น ไม่ผูก Component กับ Hex โดยตรง

```text
--background
--surface
--surface-subtle
--surface-raised
--foreground
--muted-foreground
--border
--primary
--primary-foreground
--secondary
--success
--warning
--danger
--focus-ring
```

กฎ:

- ใช้ Accent หลักเพียงหนึ่งสีในแต่ละ Theme
- สีต้องสื่อ State อย่างคงเส้นคงวา: Success, Warning, Danger, Info
- ข้อความปกติต้องผ่าน WCAG AA อย่างน้อย 4.5:1
- Text ขนาดใหญ่ต้องผ่านอย่างน้อย 3:1
- Focus Ring ต้องมองเห็นได้ชัดบนทุก Surface
- หลีกเลี่ยง Pure Black และ Pure White; ใช้ neutral ที่มีมิติแทน
- ห้ามใช้สี Warm และ Cool ปะปนโดยไม่มี Token System ที่ชัดเจน

### 3.2 Typography

Typography ต้องรองรับทั้งภาษาไทยและภาษาอังกฤษอย่างอ่านง่าย

- ใช้ Sans-serif เป็นค่าเริ่มต้น
- ใช้ Font Family ไม่เกิน 2 Families ต่อระบบ
- ห้ามใช้ Serif เป็น Display Font โดยไม่มีเหตุผลด้าน Brand/Editorial ที่ชัดเจน
- ห้ามใช้ Inter เป็น Default หากโปรเจกต์มี Font ที่เหมาะสมกว่าอยู่แล้ว
- หัวข้อใช้ลำดับชั้นจาก Size, Weight และ Spacing ไม่ใช่ใช้สีหรือขนาดที่ใหญ่เกินจริง
- เนื้อหาบทเรียนควรมีความกว้างอ่านสบาย ไม่เกินประมาณ 65–75 ตัวอักษรภาษาอังกฤษต่อบรรทัด
- ไทยและอังกฤษในบรรทัดเดียวกันต้องไม่ชนกันหรือมี line-height แคบเกินไป
- หลีกเลี่ยง `leading-none` กับข้อความไทยหรือข้อความยาว
- ข้อความปุ่มต้องสั้น ชัด และไม่ตัดหลายบรรทัดบน Desktop

Suggested hierarchy:

```text
Page title:       28–36px desktop / 24–30px mobile
Section heading:  20–28px desktop / 18–24px mobile
Card heading:     16–20px
Body:             15–17px
Supporting text:  13–15px
Metadata:         12–14px
```

### 3.3 Spacing, Radius และ Elevation

- ใช้ spacing scale เดียวกันทั้งระบบ เช่น 4, 8, 12, 16, 24, 32, 48, 64
- Learner ใช้พื้นที่ว่างมากกว่า Admin
- Radius ต้องคงเส้นคงวา:

```text
Input / compact control: 8px
Card / panel: 12px
Modal / large surface: 16px
Pill: full radius เฉพาะ tag, filter และ compact status
```

- ใช้ Shadow เฉพาะเมื่อช่วยแยก Layer จริง เช่น Modal, Popover, Floating Toolbar
- ปกติใช้ Border, Surface ต่างระดับ และ Whitespace แทน Shadow
- ห้ามมี radius หลายแนวทางในหน้าเดียวโดยไม่มีเหตุผล

### 3.4 Icons

- ใช้ Icon Library เดียวกันทั้งระบบ
- ห้ามวาด SVG Icon เองหากมี Icon Library ที่โปรเจกต์ใช้อยู่แล้ว
- Icon ต้องมี Accessible Name เมื่อใช้เป็นปุ่มเดี่ยว
- Icon-only Button ต้องมี Tooltip และพื้นที่แตะอย่างน้อย 44×44px บน Touch Device
- ใช้ Icon เพื่อช่วยเข้าใจ ไม่ใช่เพื่อแทนข้อความที่จำเป็น

### 3.5 Motion

Motion ต้องมีหน้าที่หนึ่งในนี้เท่านั้น: Feedback, State Change, Orientation หรือ Hierarchy

- ใช้ Motion เบาและสั้น: 150–250ms เป็นค่าทั่วไป
- Animate เฉพาะ `opacity` และ `transform`
- ต้องรองรับ `prefers-reduced-motion`
- ห้ามใช้ Scroll Hijacking, Parallax, Infinite Loop หรือ Loading Animation ที่รบกวนการอ่าน
- Drag & Drop ใน Admin ต้องมี visual feedback, drop indicator และ keyboard alternative

---

## 4. Responsive Rules

### 4.1 Breakpoints

ใช้ Breakpoint ร่วมกันทั้งระบบ:

```text
Mobile:  0–639px
Tablet:  640–1023px
Desktop: 1024–1279px
Wide:    1280px+
```

### 4.2 Mobile-first behavior

- ออกแบบ Single-column flow เป็นพื้นฐานก่อน แล้วขยายเป็นหลายคอลัมน์เมื่อมีพื้นที่พอ
- ห้ามใช้ `100vh`; ใช้ `100dvh` เมื่อจำเป็นต้องเต็ม viewport
- Content ต้องมี horizontal padding อย่างน้อย 16px บน Mobile
- ห้ามมี horizontal scroll ยกเว้น Table/Code ที่มีการห่อด้วย scroll container และมี visual affordance
- Tap Target ต้องอย่างน้อย 44×44px
- Drawer, Sheet, Dialog และ Dropdown ต้องไม่ล้น viewport
- Sticky action bar บน Mobile ต้องไม่บังเนื้อหาหรือ browser navigation
- Sidebars ต้องเปลี่ยนเป็น Drawer, Sheet หรือ Collapsible section บน Mobile

### 4.3 Desktop behavior

- ใช้ max-width เพื่อป้องกันข้อความและ form กว้างเกินไป
- Navigation บน Desktop ต้องอยู่บรรทัดเดียวและสูงไม่เกิน 80px
- Multi-column layout ต้องมี Mobile fallback ระบุใน Component เดียวกัน
- ไม่ใช้ flex percentage calculation ซับซ้อน; ใช้ CSS Grid สำหรับ layout หลายคอลัมน์

### 4.4 Responsive acceptance

ทุกหน้าที่สร้างหรือแก้ ต้องตรวจ:

- 360px: ไม่มีข้อความล้น, ปุ่มกดได้, action สำคัญเข้าถึงได้
- 768px: grid เปลี่ยนอย่างสมเหตุผล, sidebar ไม่บังเนื้อหา
- 1024px: navigation ครบในบรรทัดเดียว, form/readable width เหมาะสม
- 1440px: content ไม่ยืดเต็มจอ, information hierarchy ยังชัด

---

## 5. Shared Interaction and State Rules

### 5.1 Navigation and orientation

ทุก Flow ที่มีลำดับชั้นต้องบอกตำแหน่งผู้ใช้อย่างชัดเจน:

```text
Course → Module → Lesson
Admin → Course → Lesson Editor
Assessment → Question X of Y
```

- ใช้ Breadcrumb สำหรับ hierarchy ลึก
- ใช้ Current State ที่มองเห็นได้ใน Sidebar/Navigation
- Back action ต้องกลับสู่บริบทเดิม ไม่ใช่ส่งผู้ใช้กลับหน้าหลักโดยไม่จำเป็น
- URL, Page Title และ Visible Heading ต้องสอดคล้องกัน

### 5.2 Feedback and async states

ทุก Mutation ต้องมี lifecycle ที่ผู้ใช้เห็น:

```text
Idle → Submitting/Saving → Success หรือ Error
```

- ปุ่มระหว่างกำลังทำงานต้อง Disabled และบอกสถานะ เช่น “Saving…”
- ใช้ Inline Error ใกล้ Field สำหรับ Validation Error
- ใช้ Toast เฉพาะ Success/Failure แบบ transient ที่ไม่ต้องดำเนินการต่อ
- Mutation สำคัญต้องมีข้อความยืนยันว่าเกิดอะไรขึ้นและข้อมูลใดเปลี่ยน
- หาก Save ล้มเหลว ต้องรักษาข้อมูลใน Form ที่ผู้ใช้กรอกไว้

### 5.3 Empty states

Empty State ต้องตอบ 3 คำถาม:

1. หน้านี้มีไว้ทำอะไร
2. ตอนนี้ยังไม่มีอะไรเพราะอะไร
3. ผู้ใช้ต้องทำอะไรต่อ

ตัวอย่าง:

```text
ยังไม่มีคำถามในหัวข้อนี้
เพิ่มคำถามเพื่อใช้สร้าง Practice หรือ Quiz
[เพิ่มคำถาม]
```

ห้ามใช้ Empty State ที่เป็นภาพตกแต่งอย่างเดียวหรือข้อความกว้าง ๆ เช่น “Nothing here yet”

### 5.4 Destructive and irreversible actions

- Delete, Archive, Publish, Submit Exam และ Reset Attempt ต้องมี Confirmation ตามระดับผลกระทบ
- Dialog ต้องบอกสิ่งที่จะเกิดขึ้น, สิ่งที่ย้อนกลับไม่ได้ และชื่อของ Item ที่ได้รับผลกระทบ
- ปุ่ม Destructive ใช้คำกริยาชัดเจน เช่น “Archive course”, “Delete draft”
- ห้ามใช้ “OK” สำหรับ Action ที่มีผลกระทบ
- ห้ามทำ Confirmation หลายชั้นสำหรับ Action ที่ย้อนกลับได้ง่าย

### 5.5 Unsaved changes

Editor, Question Form, Assessment Builder และ Markdown Import ต้อง:

- แสดงสถานะ Saved/Saving/Unsaved/Error
- เตือนก่อนเปลี่ยนหน้า, ปิด Tab หรือย้อนกลับ หากมี Unsaved Changes
- ไม่ถือว่า Autosave สำเร็จจนกว่าจะมีผลตอบกลับจาก Server

---

## 6. Learner Experience Rules

### 6.1 Learner priorities

Learner UI ต้องลดภาระทางความคิดและช่วยตอบคำถามเหล่านี้ได้ทันที:

- ฉันกำลังเรียนอะไร
- ฉันอยู่ตรงไหนใน Course
- ต่อไปต้องทำอะไร
- ฉันเรียนไปแล้วเท่าไร
- หัวข้อใดที่ควรทบทวน

### 6.2 Dashboard

ลำดับข้อมูลที่ต้องเห็นก่อน:

1. Continue Learning
2. Current Course/Module/Lesson
3. Progress
4. Next recommended action
5. Recent assessment result
6. Weak concepts / mistake review

กฎ:

- “Continue Learning” ต้องเป็น Action หลักเดียวของ Dashboard
- Weak Areas ต้องอธิบายว่าควรทำอะไรต่อ เช่น Review, Practice หรือ Open Lesson
- ห้ามแสดง Metric มากเกินไปใน MVP
- Progress ต้องแสดงทั้งตัวเลขและ visual indicator ไม่ใช้สีอย่างเดียว
- หากยังไม่เริ่มเรียน ให้เปลี่ยน Dashboard เป็น onboarding ที่พาเลือก/เริ่ม Course

### 6.3 Course and module pages

- แสดง Course Objective, Progress, Estimated Time และ Module Structure อย่างชัดเจน
- Module ที่ Locked ต้องบอกเหตุผลและวิธี Unlock
- Module ที่เสร็จแล้วต้องมี Completed State ที่อ่านได้โดยไม่อาศัยสีเพียงอย่างเดียว
- ลำดับ Lesson ต้องสแกนง่าย: number/status/title/time
- หลีกเลี่ยง Card Grid จำนวนมาก; Course Tree หรือ Structured List เหมาะกว่า

### 6.4 Lesson page

Desktop layout แนะนำ:

```text
Breadcrumb
Course context + lesson title
┌──────────────────┬──────────────────────────┐
│ Course tree      │ Focused lesson content   │
│ module/lesson    │ text, examples, practice │
└──────────────────┴──────────────────────────┘
```

Mobile layout:

```text
Breadcrumb
Lesson title + progress
[Open course outline]
Focused lesson content
Previous / Next lesson navigation
```

กฎ:

- เนื้อหาเป็นจุดเด่น ไม่ให้ sidebar หรือ dashboard widget แข่งกับการอ่าน
- ใช้ readable line length และ spacing ที่เหมาะกับ Markdown, Table, Formula และ Code
- Course Tree บน Mobile ต้องเป็น Drawer/Sheet ไม่กินพื้นที่อ่าน
- ต้องมี Previous/Next ที่ชัดเจนท้าย Lesson
- Mark Complete ต้องมี feedback และอัปเดต Progress อย่างชัดเจน
- Reference/Source ต้องแยกจากเนื้อหาหลักอย่างอ่านง่ายและไม่รบกวน Flow

### 6.5 Practice, quiz and exam

#### Shared

- แสดง Question Number, Total Questions และ Progress Indicator
- แสดงสถานะ Answered/Unanswered/Flagged โดยไม่ใช้สีอย่างเดียว
- Choice ทั้งแถวต้องกดได้ ไม่ใช่เฉพาะ radio/checkbox เล็ก ๆ
- Keyboard operation ต้องทำได้
- คำถาม, Formula, Image และ Choice ต้องไม่ถูกตัดบน Mobile
- ถ้ามี Time Limit ต้องแสดงเวลาคงเหลืออย่างชัดเจนและไม่สร้างความตื่นตระหนกโดยไม่จำเป็น

#### Practice

- ตรวจคำตอบและแสดง Hint/Explanation ตาม Feedback Mode
- Feedback ต้องบอกเหตุผล ไม่ใช่เพียง “ผิด”
- รองรับการลองใหม่โดยไม่ทำให้ผู้ใช้หลงว่าผลใดถูกบันทึก

#### Quiz

- แสดงจำนวนข้อที่ยังไม่ตอบก่อน Submit
- ให้ผู้ใช้ย้อนกลับไปข้อที่ยังไม่ตอบได้
- Submit ต้องยืนยันเฉพาะเมื่อยังมีข้อที่ไม่ตอบหรือเป็น Action ที่ย้อนกลับไม่ได้

#### Exam

- ห้ามแสดงเฉลยหรือ Hint ก่อน Submit หาก Feedback Mode ไม่อนุญาต
- Auto-save คำตอบพร้อมสถานะการบันทึก
- Recovery เมื่อ Network ขัดข้องต้องชัดเจน
- Submit Confirmation ต้องบอกว่าไม่สามารถแก้คำตอบหลังส่งได้

### 6.6 Results, mastery and mistake review

- Result Page ต้องเริ่มจาก Score/Pass Status และ Next Action ที่ชัดเจน
- แยก “ผลการสอบ” ออกจาก “จุดที่ควรพัฒนา” เพื่อไม่ทำให้ข้อมูลปะปน
- Weak Concept ต้องสัมพันธ์กับ Lesson/Practice ที่ไปต่อได้
- Mistake Review ต้องแสดงจำนวนข้อผิด, Concept และการแก้ไขล่าสุด
- ห้ามใช้ภาษาที่ตำหนิผู้เรียน; ใช้ภาษาชวนทบทวน เช่น “หัวข้อที่ควรฝึกเพิ่มเติม”

---

## 7. Admin, Editor and Reviewer Experience Rules

### 7.1 Admin priorities

Admin UI ต้องช่วยตอบคำถามนี้ได้เร็ว:

- ข้อมูลใดกำลังเป็น Draft/Review/Published
- อะไรต้องทำต่อ
- การแก้ไขของฉันปลอดภัยหรือไม่
- มี Validation Error หรือ Dependency Problem ตรงไหน
- ฉันกำลังแก้ Version ใด

### 7.2 Admin shell

- Desktop ใช้ persistent sidebar ได้ หากไม่บังพื้นที่ทำงาน
- Mobile ใช้ navigation drawer ที่เปิด/ปิดได้
- Header ต้องมี Page Title, Context, Primary Action และ User Menu โดยไม่แน่นเกินไป
- Admin navigation ต้องแบ่งตามงาน ไม่แบ่งตาม Table ใน Database

Suggested groups:

```text
Content: Courses, Lessons, Questions, Assessments
Quality: Reviews, Sources, Validation
System: MCP Clients, Users, Audit Logs
```

### 7.3 List, table and search pages

- ใช้ Table เมื่อผู้ใช้ต้อง compare หลาย field หรือทำ bulk action
- ใช้ List/Card เมื่อข้อมูลต้องอ่านรายละเอียดหรือ Preview Content
- Desktop Table ต้องมี column priority และ responsive strategy
- Mobile Table ต้องเปลี่ยนเป็น stacked row/list; ห้ามทำตารางกว้างจนใช้งานไม่ได้
- Search, Filter และ Sort ต้องมองเห็นได้ และแสดง Active Filter
- Filter ต้อง Reset ได้ง่าย
- Pagination ต้องแสดง Current Page/Count และรักษา filter/search ใน URL หากเหมาะสม
- Bulk Action ต้องแสดงจำนวน Item ที่เลือกและมี clear escape action

### 7.4 Course, lesson and block editor

Editor ต้องแยกอย่างชัดเจนระหว่าง:

```text
Content editing
Structure/navigation
Metadata
Validation
Publishing/revision controls
```

กฎ:

- Lesson Title, Status, Save State และ Primary Action ต้องมองเห็นได้เสมอ
- Drag & Drop ต้องมี grab handle, drop target, keyboard alternative และ undo ที่ทำได้เมื่อเหมาะสม
- Block ทุกประเภทต้องมี label/type ที่ชัดเจน ไม่ใช่แค่ icon
- Markdown Editing ต้องมี Preview ที่ใกล้เคียง Learner Experience
- Preview ต้องแยกจาก Edit Mode ชัดเจน เพื่อลดการแก้ผิดบริบท
- Metadata ที่ไม่จำเป็นต่อการเขียนต้องอยู่ใน Side Panel หรือ Collapsible Section
- Source, Concept, Learning Objective และ Inline Question ต้องเพิ่มได้โดยไม่ทำให้ Flow ของการเขียนขาด
- Error ของ Block ต้องอยู่ตรง Block นั้น ไม่แสดงเพียงรวมด้านบน

### 7.5 Question bank and assessment builder

- Question Card/Row ต้องแสดง Type, Difficulty, Concept, Status, Updated At และ Validation State ในระดับที่สแกนได้
- Question Preview ต้องไม่เปิดเผย Correct Answer โดยไม่ตั้งใจใน List View
- Create/Edit Question ต้องมี Answer Configuration ตาม Type ที่เข้าใจง่าย
- Correct Answer ต้องมองเห็นชัดใน Edit Mode และตรวจครบก่อน Save
- Assessment Builder ต้องแสดงความสัมพันธ์ระหว่าง Section, Question Pool, Random Count และ Total Points ชัดเจน
- หากจำนวน Question ไม่พอ ต้องเตือนในบริบทของ Section นั้น พร้อม Action แก้ไข
- Shuffle, Passing Score, Max Attempts และ Feedback Mode ต้องมี help text ที่อธิบายผลต่อ Learner

### 7.6 Review, revision and publish

- Draft, In Review, Published, Archived ต้องใช้ Badge + Text + Icon/shape ที่เข้าใจร่วมกันทั้งระบบ
- Review Screen ต้องแสดงสิ่งที่เปลี่ยน, ผู้แก้, เวอร์ชัน, เวลา และ Notes
- Version Compare ต้องเน้นความต่างที่มีความหมาย ไม่ highlight ทุก character โดยไม่จำเป็น
- Publish ต้องผ่าน Validation Summary ก่อน
- หากมี Blocking Error ต้องไม่ให้ Publish และบอก Action แก้ไข
- AI/MCP-created content ต้องแสดง source/actor อย่างโปร่งใสใน Admin UI
- Publish Action ต้องใช้คำชัดเจน เช่น “Publish lesson v1.1” ไม่ใช้ “Save” หรือ “Confirm”

### 7.7 Audit and MCP management

- Audit Log ต้องแสดง Actor, Action, Entity, Time และ Source อย่างอ่านง่าย
- MCP Client ต้องแสดง Permission, Last Used, Revoked State และคำเตือนสำหรับสิทธิ์เสี่ยง
- Token/Secret ต้องไม่แสดงเต็มค่าอีกหลังสร้างสำเร็จ
- Action Revoke ต้องชัดเจนและมี confirmation ตามความเสี่ยง

---

## 8. Forms, Validation and Content Safety

### 8.1 Form structure

ทุก Form ต้องใช้รูปแบบ:

```text
Label
Control
Optional help text
Inline validation/error text
```

- Required Field ต้องระบุชัดเจน
- Error Message ต้องบอกวิธีแก้ ไม่ใช่เพียง “Invalid input”
- Preserve input เมื่อ validation หรือ server request ล้มเหลว
- Form ยาวต้องแบ่งเป็น Section ที่มี heading ชัดเจน
- Action Bar ต้องสอดคล้อง: Cancel เป็น Secondary, Save Draft เป็น Secondary/Outline, Action หลักเป็น Primary

### 8.2 Content safety

- Markdown/MDX Preview และ Learner Renderer ต้อง sanitize content
- External Link ต้องแสดงว่าออกนอกระบบเมื่อจำเป็น
- Source URL ที่เสียหรือไม่ผ่าน validation ต้องแสดงสถานะชัดเจน
- File Upload ต้องแสดง accepted type, size limit, upload progress และ error recovery

---

## 9. Component Rules

### 9.1 Component hierarchy

สร้าง UI จากชั้นต่อไปนี้:

```text
Tokens
→ Primitives (Button, Input, Badge, Dialog, Tooltip)
→ Patterns (PageHeader, EmptyState, StatusBadge, DataTable, FormField)
→ Feature Components (LessonTree, QuestionRunner, AssessmentBuilder)
→ Pages
```

ห้ามสร้าง Component เฉพาะหน้าใหม่ หาก Pattern เดิมรองรับได้ด้วย Props ที่ไม่ซับซ้อน

### 9.2 Required shared components

อย่างน้อยควรมีกลุ่ม Component เหล่านี้:

- Button: primary, secondary, destructive, ghost, icon
- Input, textarea, select, checkbox, radio, switch
- Form field + help/error text
- Badge/status indicator
- Dialog/confirmation dialog
- Toast/inline alert
- Empty state
- Skeleton loader
- Pagination
- Search/filter controls
- Breadcrumb
- Tabs
- Tooltip
- Accessible table/list patterns
- Progress indicator
- Mobile drawer/sheet

### 9.3 State completeness

Component ที่แสดงข้อมูลจาก Server ต้องพิจารณาอย่างน้อย:

```text
Loading
Empty
Success
Partial/locked
Error
Permission denied
```

Component ที่มี Mutation ต้องพิจารณาเพิ่ม:

```text
Idle
Submitting
Succeeded
Failed
Retryable failure
```

---

## 10. Anti-AI Visual Checklist

ก่อนส่ง UI ต้องตรวจว่ามีข้อใดต่อไปนี้หรือไม่ หากมีต้องแก้ก่อน:

- Hero Centered ใหญ่เกิน viewport ทั้งที่เป็นหน้าผลิตภัณฑ์ ไม่ใช่ Landing Page
- Purple/blue gradient, glow, blob หรือ glass card โดยไม่มีเหตุผล
- Card สามใบเท่ากันเรียงแนวนอนเป็น default
- ทุก Section มี uppercase eyebrow
- ทุกอย่างอยู่ใน rounded card
- ใช้ gradient text เป็น headline
- สลับ light/dark section แบบไม่มี design reason
- มี decorative animation ที่ไม่ได้สื่อ feedback หรือ state
- Copy แบบกว้าง ๆ เช่น “Unlock your learning potential” โดยไม่มีความหมายเชิงงาน
- ใช้ icon/emoji แทนข้อความสำคัญ
- Dashboard มี metrics จำนวนมากแต่ผู้ใช้ไม่รู้ว่าต้องทำอะไรต่อ
- Admin UI มี table ที่ Mobile ใช้ไม่ได้
- Form ไม่มี label, error, loading หรือ success state
- Action สำคัญไม่ชัดเจนว่ามีผลต่อ Draft/Published Data อย่างไร

---

## 11. UX Copy Rules

- ใช้ภาษาตรงไปตรงมา กระชับ และสอดคล้องกันทั้งไทย/อังกฤษ
- ใช้คำกริยาที่บอก Action: “Create course”, “Save draft”, “Submit quiz”, “Publish lesson”
- หลีกเลี่ยงคำโฆษณา คำเกินจริง และถ้อยคำแบบ AI
- Error ต้องมีทั้งปัญหาและแนวทางแก้
- Empty State ต้องบอก Next Step
- Destructive Action ต้องบอกผลกระทบ
- Status ต้องใช้คำชุดเดียวกันทั้งระบบ เช่น Draft, In review, Published, Archived
- ห้ามใช้คำเดียวกันแทนคนละ Action เช่น “Save” สำหรับ Save Draft และ Publish

ตัวอย่าง:

| ไม่ควรใช้ | ควรใช้ |
| --- | --- |
| Something went wrong | บันทึกบทเรียนไม่สำเร็จ กรุณาลองอีกครั้ง |
| Continue | ไปยังบทเรียนถัดไป |
| Submit | ส่งคำตอบ 20 ข้อ |
| Done | บันทึก Draft แล้ว |
| Nothing here | ยังไม่มี Lesson ใน Module นี้ |

---

## 12. Definition of Done for Every UI Change

ก่อนถือว่า UI เสร็จ ผู้พัฒนาหรือ AI ต้องตรวจ:

### Function and states

- [ ] User Goal และ Primary Action ชัดเจน
- [ ] Loading, Empty, Error, Disabled และ Success States ครบตามบริบท
- [ ] Mutation มี feedback และไม่ทำข้อมูลที่กรอกหายเมื่อ request ล้มเหลว
- [ ] Permission/locked state อธิบายสาเหตุและทางออก
- [ ] Action ที่เสี่ยงมี confirmation และข้อความผลกระทบ

### Responsive

- [ ] ตรวจที่ 360px, 768px, 1024px และ 1440px
- [ ] ไม่มี horizontal overflow ที่ไม่ตั้งใจ
- [ ] Tap target สำคัญอย่างน้อย 44×44px
- [ ] Sidebar/Table/Grid มี Mobile fallback จริง
- [ ] Text, button และ form ไม่ล้นหรือถูกตัด

### Accessibility

- [ ] Semantic HTML และ accessible name ครบ
- [ ] Keyboard navigation ใช้งานได้
- [ ] Focus visible และลำดับ focus สมเหตุผล
- [ ] Text/Control contrast ผ่าน WCAG AA
- [ ] ไม่ใช้สีเพียงอย่างเดียวสื่อ state
- [ ] Motion เคารพ `prefers-reduced-motion`

### Visual quality

- [ ] ใช้ Token, Component และ Icon Family ที่มีอยู่
- [ ] Typography, spacing, radius และ color สอดคล้องกัน
- [ ] ไม่มี AI visual clichés ตามหัวข้อ Anti-AI Visual Checklist
- [ ] ไม่มี fake metrics, fake screenshots หรือ copy ที่กว้างเกินจริง
- [ ] Learner UI สงบและเน้นเนื้อหา; Admin UI หนาแน่นเท่าที่จำเป็นและเน้นการทำงาน

### Product integrity

- [ ] Status Draft/Review/Published/Archived ถูกสื่ออย่างชัดเจน
- [ ] Published, Archive, Delete, Submit และ Unsaved Change flows ไม่ทำให้ผู้ใช้เข้าใจผิด
- [ ] UI สอดคล้องกับ Authorization และ Business Rules
- [ ] Test ด้วยข้อมูลยาว, ภาษาไทย/อังกฤษ, รายการว่าง และ error state

---

## 13. Final Principle

UI ที่ดีของ Personal Learning OS ต้องทำให้ผู้ใช้รู้ว่า:

```text
ฉันอยู่ตรงไหน
ฉันทำอะไรต่อได้
ข้อมูลนี้อยู่ในสถานะอะไร
สิ่งที่ฉันทำมีผลอะไร
และฉันทำงานหรือเรียนต่อได้อย่างมั่นใจ
```

หากงานออกแบบสวยแต่ตอบคำถามเหล่านี้ไม่ได้ ให้ถือว่ายังไม่ผ่าน
