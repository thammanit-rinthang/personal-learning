# Personal Learning OS

## System Requirements Specification — v0.1

### 1. Product Vision

สร้าง Web Application สำหรับการเรียนรู้ด้วยตนเองที่สามารถรองรับหลายสาขาวิชา เช่น

* Accounting
* Finance
* Economics
* Statistics
* Mathematics
* Programming
* Management
* Languages
* วิชาอื่นในอนาคต

ระบบต้องไม่ผูก Data Model เข้ากับบัญชีโดยเฉพาะ

โครงสร้างหลักคือ

```text
Course
└── Module
    └── Lesson
        ├── Content
        ├── Practice
        └── Assessment
```

และมี MCP Server สำหรับให้ AI เช่น ChatGPT สามารถ

* อ่านโครงสร้างหลักสูตร
* อ่านบทเรียนเดิม
* เพิ่ม Course
* เพิ่ม Module
* เพิ่ม/แก้ Lesson
* เพิ่ม Question Bank
* สร้าง Quiz / Exam
* ตรวจคุณภาพ Course
* ดู Learning Analytics
* สร้างเนื้อหาเสริมสำหรับหัวข้อที่ผู้เรียนอ่อน

โดยการแก้ไขเนื้อหาต้องผ่านระบบ Versioning และ Draft/Publish

---

# 2. Technology Stack

## Core

```text
Frontend / Full-stack
Next.js
TypeScript
App Router

Database
PostgreSQL

ORM
Prisma ORM

Validation
Zod

MCP
Official MCP TypeScript SDK

Content
Markdown / MDX-compatible content
+
Structured Content Blocks

Authentication
Provider-agnostic
```

MCP มี TypeScript SDK อย่างเป็นทางการที่รองรับการสร้าง server ซึ่ง expose Tools, Resources และ Prompts และรองรับ remote transport จึงเหมาะกับ stack TypeScript ของระบบนี้โดยตรง.

---

# 3. High-Level Architecture

```text
                    ┌──────────────────┐
                    │     Learner      │
                    └────────┬─────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │     Next.js App     │
                  │                     │
                  │ Course UI           │
                  │ Learning UI         │
                  │ Quiz / Exam         │
                  │ Progress            │
                  │ Admin               │
                  └─────────┬───────────┘
                            │
                    Application Layer
                            │
                 ┌──────────┴─────────┐
                 ▼                    ▼
          ┌─────────────┐      ┌─────────────┐
          │   Prisma    │      │ MCP Server  │
          └──────┬──────┘      └──────┬──────┘
                 │                    │
                 ▼                    ▼
          ┌─────────────┐       ChatGPT / AI
          │ PostgreSQL  │
          └─────────────┘
```

MCP และ Web App ต้องใช้ **Application Service Layer เดียวกัน**

ห้ามทำ logic เช่น

```text
MCP → Prisma โดยตรง
Web UI → logic อีกชุด
```

ควรเป็น

```text
Web UI ─────┐
            ├── Application Services ── Prisma
MCP Tools ──┘
```

เพื่อให้ validation, authorization และ business rules เป็นชุดเดียวกัน

---

# 4. User Roles

## LEARNER

สามารถ

* เรียน Course
* ทำ Practice
* ทำ Quiz
* ทำ Exam
* ดูคะแนน
* ดู Progress
* ดู Weak Areas
* ทบทวนข้อที่ผิด
* ใช้ Flashcards

---

## EDITOR

เพิ่มและแก้

* Course
* Module
* Lesson
* Question
* Assessment
* Sources

แต่ไม่มีสิทธิ์ Publish หากต้องการ workflow ที่เข้มงวด

---

## REVIEWER

สามารถ

* Review Draft
* Approve / Reject
* ใส่ Review Notes

---

## ADMIN

สิทธิ์ทั้งหมด รวมถึง

* Publish
* Archive
* User Management
* MCP permissions
* Audit logs

---

## AI / MCP CLIENT

ไม่ควรมี Role แบบ unrestricted admin

ให้ใช้ scoped permissions เช่น

```text
course:read
course:write

lesson:read
lesson:write

question:read
question:write

assessment:read
assessment:write

analytics:read

source:read
source:write

publish:write
```

โดย default **ไม่ควรให้ AI `publish:write`**

---

# 5. Core Domain Model

โครงสร้างหลัก:

```text
Subject
   │
Course
   │
Module
   │
Lesson
   │
LessonBlock
```

ตัวอย่าง:

```text
Subject
└── Accounting

Course
└── Pre-Master Accounting Thailand

Module
└── Accounting Foundations

Lesson
└── Accounting Equation

LessonBlock
├── Text
├── Example
├── Callout
├── Exercise
└── References
```

---

# 6. Subject

ใช้แบ่งสาขาวิชา

```text
Subject

id
name
slug
description
icon
createdAt
updatedAt
```

ตัวอย่าง

```text
accounting
finance
economics
statistics
programming
mathematics
```

---

# 7. Course

```text
Course

id
subjectId

title
slug
description

level
language

estimatedHours

status
version

thumbnail

createdBy
updatedBy

createdAt
updatedAt
publishedAt
```

### Course Status

```text
DRAFT
IN_REVIEW
PUBLISHED
ARCHIVED
```

---

# 8. Module

Course หนึ่งมีหลาย Module

```text
Module

id
courseId

title
description

position

estimatedMinutes

unlockRule
createdAt
updatedAt
```

ตัวอย่าง Accounting:

```text
Module 01
Accounting Foundations

Module 02
Debit & Credit

Module 03
Journal Entries
```

ไม่ควรตั้งชื่อ database ว่า `Week`

เพราะ Course อื่นอาจไม่ได้จัดตามสัปดาห์

ให้ `Module` เป็น domain กลาง แล้ว UI ของ Accounting สามารถแสดงว่า

```text
Week 01
Week 02
```

ได้

---

# 9. Lesson

```text
Lesson

id
moduleId

title
slug

summary

learningObjectives

position

estimatedMinutes

status
version

createdAt
updatedAt
publishedAt
```

---

# 10. Lesson Content

ไม่แนะนำให้เก็บ Lesson ทั้งหมดเป็น Markdown string ก้อนเดียว

ควรใช้

```text
Lesson
   │
   ├── LessonBlock
   ├── LessonBlock
   └── LessonBlock
```

### Content Block Types

```text
MARKDOWN
HEADING
TEXT
CALLOUT
TABLE
CODE
FORMULA

IMAGE
VIDEO

EXAMPLE
WORKED_EXAMPLE

VOCABULARY

PRACTICE
QUIZ_EMBED

INTERACTIVE
REFERENCE
```

ตัวอย่าง:

```text
LessonBlock

id
lessonId

type
position

contentMarkdown
data Json

createdAt
updatedAt
```

`Json/JSONB` เหมาะกับ config ที่แตกต่างตาม block เช่น Interactive Exercise แต่ไม่ควรใช้ JSON แทน relational schema ทั้งระบบ; Prisma รองรับ PostgreSQL JSON fields โดยตรง.

---

# 11. Concept / Learning Objective

ควรมี Concept เป็น entity จริง

ไม่ใช่แค่ tag string

```text
Concept

id
subjectId

name
slug
description
```

ตัวอย่าง Accounting:

```text
asset
liability
equity
revenue
expense

accounting-equation

profit-vs-cash

accounts-receivable
accounts-payable
```

Question และ Lesson สามารถผูกหลาย Concept

```text
LessonConcept

lessonId
conceptId
```

```text
QuestionConcept

questionId
conceptId
```

นี่จะทำให้ระบบรู้ภายหลังว่า

> ผู้เรียนอ่อน Concept ไหน

ไม่ใช่แค่รู้ว่า

> Week 3 คะแนนต่ำ

---

# 12. Question Bank

Question ต้องเป็น Entity กลาง สามารถ reuse ในหลาย Quiz ได้

```text
Question

id

subjectId

type

prompt
explanation
hint

difficulty

status
version

createdBy
updatedBy

createdAt
updatedAt
```

---

# 13. Question Types

MVP รองรับ:

```text
SINGLE_CHOICE
MULTIPLE_CHOICE
TRUE_FALSE
SHORT_ANSWER
NUMERIC
```

Phase 2:

```text
MATCHING
ORDERING
FILL_BLANK
MULTI_STEP
CASE_STUDY
```

Phase 3:

```text
ACCOUNTING_TRANSACTION
JOURNAL_ENTRY
LEDGER
TRIAL_BALANCE

CODE_EXECUTION
MATH_EXPRESSION
INTERACTIVE_SIMULATION
```

จึงสามารถใช้ Question Engine เดียวกับหลายสาขาได้

---

# 14. Question Choice

สำหรับ Multiple Choice

```text
QuestionChoice

id
questionId

text
isCorrect
position

feedback
```

Feedback สามารถต่างกันตามตัวเลือก

เช่นผู้เรียนตอบ

> Bank Loan = Revenue

ระบบตอบ:

```text
ยังไม่ถูก

เงินสดเพิ่มจริง แต่กิจการมีภาระที่จะต้อง
ชำระธนาคารในอนาคต

ลองพิจารณาว่าบัญชีอีกฝั่งเป็น
Revenue หรือ Liability
```

---

# 15. Question Difficulty

```text
BEGINNER
EASY
MEDIUM
HARD
MASTERY
```

หรือเก็บเป็น

```text
difficulty: 1–5
```

แนะนำ 1–5 เพราะใช้ Analytics ง่ายกว่า

---

# 16. Assessment

Assessment เป็นตัวกำหนด “วิธีนำ Question Bank มาใช้”

```text
Assessment

id

courseId?
moduleId?
lessonId?

type

title
description

passingScore

maxAttempts

timeLimitMinutes?

shuffleQuestions
shuffleChoices

feedbackMode

status
version
```

### Assessment Type

```text
PRACTICE
CONCEPT_CHECK
QUIZ
MASTERY_TEST
MIDTERM
FINAL_EXAM
```

---

# 17. Assessment Blueprint

อย่าผูก Quiz กับ Question แบบตายตัวอย่างเดียว

ควรรองรับ Question Pool

ตัวอย่าง:

```text
Mastery Exam Week 01

Accounting Elements
random 5 / pool 20

Accounting Equation
random 5 / pool 20

Profit vs Cash
random 5 / pool 15

Business Documents
random 5 / pool 15
```

Data model:

```text
AssessmentSection

id
assessmentId

title
position

questionCount
randomize
```

```text
AssessmentQuestion

assessmentSectionId
questionId
weight
```

---

# 18. Exam Snapshot

สำคัญมาก

เมื่อผู้เรียนเริ่มสอบ ต้องสร้าง Snapshot

เพื่อป้องกันกรณี

```text
Question v1
↓
User answers
↓
Editor changes Question to v2
↓
คะแนนเก่าเปลี่ยน
```

ต้องเก็บ:

```text
AttemptQuestion

questionVersion
promptSnapshot
choicesSnapshot
answerSnapshot
```

ดังนั้นผลสอบในอดีตจะ reproducible

---

# 19. Assessment Attempt

```text
AssessmentAttempt

id
userId
assessmentId

startedAt
submittedAt

score
percentage

passed

attemptNumber
```

---

# 20. Answer

```text
AttemptAnswer

id
attemptId
questionId

answer Json

isCorrect

pointsEarned
pointsPossible

submittedAt
```

ใช้ JSON ได้เพราะรูปแบบคำตอบแตกต่างกันตาม Question Type

---

# 21. Feedback Modes

Assessment ต้องเลือกได้

### PRACTICE

```text
ตอบ
↓
ตรวจทันที
↓
Hint
↓
ลองใหม่
↓
Explanation
```

### QUIZ

```text
ตอบทุกข้อ
↓
Submit
↓
Score
↓
Explanation
```

### EXAM

```text
ตอบทุกข้อ
↓
Submit
↓
Score

ไม่แสดงเฉลยจนกว่าจะจบ
```

---

# 22. Progress Tracking

```text
CourseEnrollment

userId
courseId

startedAt
completedAt

progressPercent
```

```text
LessonProgress

userId
lessonId

status

startedAt
completedAt

lastPosition
```

Status:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

---

# 23. Mastery System

ระดับ Concept:

```text
UserConceptMastery

userId
conceptId

masteryScore

correctCount
incorrectCount

lastPracticedAt
```

ตัวอย่าง Dashboard:

```text
Accounting Equation       94%
Assets & Liabilities      91%
Profit vs Cash            62%
Business Documents        71%
```

ระบบควรสามารถสร้าง

```text
Weak Areas
```

อัตโนมัติ

---

# 24. Mistake Review

ทุก Question ที่ตอบผิดควรถูกบันทึก

```text
MistakeRecord

userId
questionId

wrongCount
lastWrongAt
resolvedAt?
```

หน้า:

```text
Review Mistakes

12 questions need review

Profit vs Cash       5
Accrual Accounting   3
Inventory            4
```

---

# 25. Unlock Rules

Module สามารถกำหนดเงื่อนไขได้ เช่น

```text
Complete previous module
```

หรือ

```text
Mastery Test >= 80%
```

หรือ

```text
Manual unlock
```

แนะนำให้ระบบตั้งค่าได้ และไม่ hardcode ว่าต้อง 80%

---

# 26. Vocabulary / Flashcard

```text
Flashcard

id
subjectId
lessonId?

front
back

example?
```

Accounting:

```text
Front:
Accounts Receivable

Back:
ลูกหนี้การค้า
Asset
```

ภายหลังสามารถเพิ่ม spaced repetition ได้

---

# 27. Source / Citation System

สำคัญมากสำหรับ

* Accounting
* Tax
* Law
* Finance
* Science
* Medicine
* Technology

```text
Source

id

title
url

publisher

sourceType

publishedAt?
checkedAt

jurisdiction?
effectiveFrom?
effectiveUntil?

notes
```

แล้วเชื่อม

```text
LessonSource
QuestionSource
```

---

# 28. Source Freshness

ตัวอย่าง Accounting Thailand:

```text
Lesson:
VAT Fundamentals

Sources:
Revenue Department

checkedAt:
2026-08-10

effectiveFrom:
...

status:
CURRENT
```

สามารถมีระบบแจ้ง:

```text
⚠ Source not verified for 12 months
```

ภายหลังได้

---

# 29. Content Versioning

Course, Lesson, Question และ Assessment ต้อง version ได้

```text
ContentRevision

id

entityType
entityId

version

snapshot Json

changeSummary

createdBy
createdAt
```

Workflow:

```text
Published v1.0

       ↓ edit

Draft v1.1

       ↓

Review

       ↓

Published v1.1
```

ห้าม overwrite published content โดยไม่สร้าง revision

---

# 30. Audit Log

ทุก mutation สำคัญต้องเก็บ

```text
AuditLog

id

actorType
actorId

action

entityType
entityId

before Json?
after Json?

source

createdAt
```

`actorType`:

```text
USER
ADMIN
MCP
SYSTEM
```

ตัวอย่าง:

```text
actor: ChatGPT MCP
action: QUESTION_CREATED

questionId: q_182

timestamp: ...
```

---

# 31. MCP Architecture

MCP ใช้เป็น interface สำหรับ AI

MCP รองรับ Tools สำหรับให้โมเดลเรียกการทำงานกับระบบภายนอกโดย schema ที่ชัดเจน.

แบ่งออกเป็น

```text
Resources
Tools
Prompts
```

---

# 32. MCP Resources

Resources เน้นอ่านข้อมูล

เสนอ URI เช่น

```text
learning://courses

learning://courses/{courseId}

learning://courses/{courseId}/modules

learning://lessons/{lessonId}

learning://questions/{questionId}

learning://analytics/user/{userId}
```

---

# 33. MCP Course Tools

```text
list_courses

get_course

create_course_draft

update_course

archive_course
```

---

# 34. MCP Module Tools

```text
list_modules

get_module

create_module

update_module

reorder_modules
```

---

# 35. MCP Lesson Tools

```text
get_lesson

create_lesson

update_lesson

upsert_lesson_blocks

reorder_lesson_blocks
```

---

# 36. MCP Question Tools

```text
get_question_bank

get_question

create_question

create_questions_bulk

update_question

archive_question
```

Bulk creation สำคัญ เช่น

```text
เพิ่มโจทย์
Accounting Equation
ระดับ Easy–Medium
20 ข้อ
```

---

# 37. MCP Assessment Tools

```text
create_assessment

update_assessment

add_questions_to_assessment

generate_assessment_blueprint

validate_assessment
```

---

# 38. MCP Source Tools

```text
add_source

update_source

attach_source_to_lesson

attach_source_to_question

list_stale_sources
```

---

# 39. MCP Analytics Tools

Read-only โดย default

```text
get_course_progress

get_module_progress

get_concept_mastery

get_weak_concepts

get_common_mistakes

get_assessment_history
```

ตัวอย่าง:

```text
User:
เพิ่มโจทย์หัวข้อที่ฉันอ่อนให้ 20 ข้อ

AI:

get_weak_concepts()
↓
Profit vs Cash = 61%

get_lesson()
↓
อ่านเนื้อหาเดิม

create_questions_bulk()
↓
20 questions
```

---

# 40. MCP Validation Tools

สำคัญมาก

```text
validate_course

validate_module

validate_lesson

validate_question_bank

validate_assessment
```

ตัวอย่าง Validation:

```text
Question without explanation

Question without correct answer

Duplicate questions

Broken source URL

Lesson without objective

Assessment has insufficient questions

Passing score invalid

Unpublished dependency

Question references missing Concept
```

---

# 41. MCP Publish Tool

```text
publish_course
publish_lesson
publish_assessment
```

แต่ permission:

```text
publish:write
```

ควรปิดสำหรับ AI ใน MVP

Flow:

```text
AI creates Draft
       ↓
Validation
       ↓
Human Review
       ↓
Human Publish
```

---

# 42. MCP Security

Remote MCP Server ต้องมี authentication และ authorization

MCP มี authorization specification สำหรับ HTTP transports ดังนั้น permission model ควรวางไว้ตั้งแต่แรก ไม่ใช่เพิ่มภายหลัง.

MCP API Key/Token ต้อง map เป็น

```text
McpClient

id
name

permissions[]

createdAt
lastUsedAt
revokedAt
```

---

# 43. Application Service Layer

แนะนำโครงสร้าง

```text
src/
├── app/
├── components/
├── features/
├── server/
│
├── services/
│   ├── course.service.ts
│   ├── lesson.service.ts
│   ├── question.service.ts
│   ├── assessment.service.ts
│   ├── progress.service.ts
│   ├── mastery.service.ts
│   └── source.service.ts
│
├── db/
│   └── prisma.ts
│
├── mcp/
│   ├── tools/
│   ├── resources/
│   ├── prompts/
│   └── server.ts
│
└── schemas/
    ├── course.schema.ts
    ├── lesson.schema.ts
    └── question.schema.ts
```

---

# 44. Next.js Routes

Public/Learner:

```text
/
/courses

/courses/[courseSlug]

/learn/[courseSlug]/[moduleSlug]/[lessonSlug]

/practice/[lessonId]

/quiz/[assessmentId]

/results/[attemptId]

/progress

/review/mistakes
```

Admin:

```text
/admin

/admin/courses

/admin/courses/[id]

/admin/lessons/[id]

/admin/questions

/admin/assessments

/admin/sources

/admin/reviews
```

System:

```text
/api/...

/mcp
```

Route Handlers เหมาะสำหรับ HTTP endpoints ที่ต้องเปิดให้ระบบอื่นเรียก ขณะที่ mutation ภายใน UI สามารถใช้ Server Functions/Actions ได้.

---

# 45. Search

ควรค้นหาได้ทั้ง

```text
Course
Lesson
Concept
Question
Vocabulary
```

MVP ใช้ PostgreSQL full-text search ได้

ภายหลังค่อยพิจารณา Semantic Search / embeddings

ไม่จำเป็นต้องเพิ่ม Vector DB ตั้งแต่วันแรก

---

# 46. Markdown Import

ต้องรองรับการนำ Markdown ที่มีอยู่เข้า Course

Flow:

```text
Upload / Paste Markdown
↓
Parse headings
↓
Create Lesson
↓
Create LessonBlocks
↓
Preview
↓
Save Draft
```

ทำให้ Week 01–16 ที่เรามีอยู่สามารถ migrate เข้าระบบได้

---

# 47. Export

ควร export ได้เป็น

```text
Markdown
JSON
```

Phase 2:

```text
PDF
```

และควร export Course package เช่น

```text
course.json
lessons/
questions.json
assessments.json
sources.json
```

เพื่อไม่ให้ข้อมูลติดกับ application ตลอดไป

---

# 48. Admin Editor

Editor ต้องสามารถ

* Drag & Drop Lesson Blocks
* Markdown editing
* Preview
* Add Question inline
* Attach Source
* Add Concept tags
* Save Draft
* View Revision History
* Compare Versions

---

# 49. Learning UI

Lesson page แนะนำ layout

```text
┌────────────────────────────────────┐
│ Course / Module / Lesson           │
├───────────────┬────────────────────┤
│ Course Tree   │ Lesson             │
│               │                    │
│ Week 01       │ Content            │
│  ✓ 1.1       │ Example            │
│  ● 1.2       │ Practice           │
│  ○ 1.3       │                    │
│               │                    │
└───────────────┴────────────────────┘
```

---

# 50. Dashboard

แสดงอย่างน้อย:

```text
Continue Learning

Accounting
37%

Current:
Week 04 — Trial Balance

Mastery
78%

Weak Areas
• Profit vs Cash
• Accrued Expenses

Recent Score
84%
```

---

# 51. Accounting-Specific Plugin

อย่าใส่ Accounting logic เข้า Core

สร้างเป็น interactive type เช่น

```text
INTERACTIVE
type:
accounting-equation
```

Phase หลัง:

```text
accounting-journal
accounting-ledger
trial-balance
inventory-calculator
break-even
vat-wht-case
```

วิชาอื่นก็เพิ่ม:

```text
statistics-distribution

math-graph

coding-playground

economics-supply-demand
```

โดยไม่แก้ Core Course architecture

---

# 52. Functional Requirements — MVP

## Must Have

### Course

* [ ] Create Course
* [ ] Edit Course
* [ ] Course list
* [ ] Module ordering
* [ ] Lesson ordering

### Content

* [ ] Markdown lesson
* [ ] Lesson blocks
* [ ] Learning objectives
* [ ] Concepts
* [ ] Sources

### Assessment

* [ ] Question Bank
* [ ] Single Choice
* [ ] Multiple Choice
* [ ] True/False
* [ ] Numeric
* [ ] Quiz
* [ ] Random questions
* [ ] Auto grading
* [ ] Explanations
* [ ] Passing score

### Learning

* [ ] Course progress
* [ ] Lesson progress
* [ ] Quiz history
* [ ] Mistake review
* [ ] Concept mastery

### Content Management

* [ ] Draft
* [ ] Published
* [ ] Revision history

### MCP

* [ ] MCP authentication
* [ ] Read courses
* [ ] Read lessons
* [ ] Create/update draft lesson
* [ ] Create questions
* [ ] Create assessments
* [ ] Validate content
* [ ] Read learning analytics

---

# 53. Not Required for MVP

ไม่ต้องทำก่อน:

```text
Payments
Course Marketplace
Social Feed
Comments
Live Classroom
Video Hosting
Certificates
Mobile App
AI Chat inside Web App
Vector Database
Advanced Spaced Repetition
Gamification
Leaderboards
Organizations / Schools
Multi-tenant SaaS
```

ลด scope ให้ MVP เสร็จเร็ว

---

# 54. Phase 1 — MVP

เป้าหมาย:

> Accounting Week 01 ใช้งานได้ตั้งแต่ต้นจนจบ

Flow:

```text
Dashboard
↓
Course
↓
Module
↓
Lesson
↓
Practice
↓
Quiz
↓
Result
↓
Progress
```

MCP:

```text
AI
↓
Read Week 01
↓
Add Questions
↓
Validate
↓
Draft
```

---

# 55. Phase 2 — Complete Learning System

เพิ่ม

```text
16 Accounting Modules

Question Pools

Mastery

Weak Areas

Mistake Review

Flashcards

Course Versioning

Source Freshness

Markdown Import
```

---

# 56. Phase 3 — Interactive Learning Engine

เพิ่ม

```text
Accounting Equation Simulator

Debit/Credit Simulator

Journal Lab

Ledger Lab

Trial Balance Lab

Financial Statement Lab

VAT/WHT Case Lab
```

---

# 57. Phase 4 — Multi-Subject

เพิ่ม Course ใหม่โดย Core ไม่ต้องเปลี่ยน

เช่น

```text
Statistics Foundation

Python Programming

Corporate Finance

Economics

Research Methodology
```

---

# 58. Database Design Principles

ใช้ PostgreSQL relational structure สำหรับข้อมูลหลัก:

```text
Course
Module
Lesson
Question
Assessment
Attempt
Concept
Source
```

ใช้ JSONB เฉพาะข้อมูล polymorphic เช่น

```text
LessonBlock.data

Question.answerConfig

AttemptAnswer.answer

Interactive.config

Revision.snapshot
```

ไม่ควรออกแบบทุกอย่างเป็น JSON document

---

# 59. Transaction Requirements

Operation ที่เปลี่ยนหลาย record พร้อมกันต้องใช้ database transaction

เช่น:

```text
Submit Exam

1. Save answers
2. Grade
3. Save score
4. Update mastery
5. Update mistakes
6. Mark attempt submitted
```

ต้องสำเร็จทั้งหมดหรือ rollback ทั้งหมด

Prisma รองรับ transaction สำหรับชุด read/write operations โดยตรง.

---

# 60. Security Requirements

ทุก mutation ต้องตรวจ:

```text
Authentication
Authorization
Input Validation
Ownership / Role
```

ห้ามเชื่อว่าเพราะ endpoint ถูกเรียกจาก Server Action แล้วปลอดภัย

Next.js ระบุ Server Functions สามารถถูกเรียกผ่าน POST request ได้ จึงต้องตรวจ auth/authz ภายใน function.

เพิ่มเติม:

* rate limiting MCP
* audit logging
* revoke MCP token
* no database credentials exposed client-side
* sanitize rendered Markdown
* file upload validation
* CSRF/session protection ตาม auth architecture
* secrets ผ่าน environment/secret store เท่านั้น

---

# 61. Performance Requirements

เป้าหมาย MVP:

```text
Normal page load:
< 2 seconds target

Quiz navigation:
perceived instant

Assessment submission:
atomic

Pagination:
Question Bank
Audit Logs
Attempts
```

ควรทำ indexes อย่างน้อยกับ

```text
slug

courseId
moduleId
lessonId

userId

assessmentId

conceptId

status

createdAt
```

---

# 62. Data Integrity Requirements

ต้อง enforce:

```text
Course.slug UNIQUE

Module position unique per Course

Lesson position unique per Module

Question version immutable after use
หรือ create revision

submitted Attempt immutable

score reproducible from snapshot
```

---

# 63. Backup / Portability

ต้องสามารถ backup PostgreSQL ได้

และควรมี application-level export

```text
Course Package
```

เพื่อให้เนื้อหาไม่สูญหายหรือ lock-in

---

# 64. Observability

อย่างน้อยเก็บ:

```text
request errors

MCP tool calls

failed validations

assessment grading errors

database errors
```

MCP calls ที่เขียนข้อมูลต้องมี Audit Log ทุกครั้ง

---

# 65. Suggested Core Prisma Entities

ขั้นต่ำ:

```text
User

Subject

Course
CourseRevision

Module

Lesson
LessonBlock
LessonRevision

Concept
LessonConcept

Question
QuestionChoice
QuestionConcept
QuestionRevision

Assessment
AssessmentSection
AssessmentQuestion

AssessmentAttempt
AttemptQuestion
AttemptAnswer

CourseEnrollment
LessonProgress

UserConceptMastery
MistakeRecord

Flashcard

Source
LessonSource
QuestionSource

McpClient

AuditLog
```

---

# 66. MVP Acceptance Criteria

ระบบ MVP ถือว่า “ผ่าน” เมื่อทำ scenario นี้ได้:

### Content

Admin สร้าง

```text
Accounting Pre-Master
        ↓
Week 01
        ↓
Accounting Foundations
```

และนำ Markdown Week 01 เข้า Lesson ได้

---

### Questions

สามารถเพิ่ม Question Bank อย่างน้อย 50 ข้อ

พร้อม

```text
Concept
Difficulty
Correct answer
Explanation
```

---

### Exam

สร้าง Quiz แบบสุ่ม

```text
20 questions
Passing = 80%
```

ผู้เรียนทำแล้วระบบ

```text
ตรวจคะแนน
เก็บ Attempt
แสดงข้อผิด
อัปเดต Mastery
```

---

### Progress

Dashboard แสดง

```text
Week 01 completed

Quiz:
85%

Weak concept:
Profit vs Cash
```

---

### MCP

AI สามารถ

```text
list_courses()
↓
get_course()
↓
get_lesson()
↓
create_questions_bulk()
↓
validate_course()
```

แล้ว Question ที่สร้างต้องปรากฏเป็น Draft ใน Admin UI

**AI ไม่สามารถ Publish เองได้**

---

# 67. Recommended First Development Milestone

ผมแนะนำลำดับนี้:

```text
1. Prisma Schema
        ↓
2. Course / Module / Lesson CRUD
        ↓
3. Lesson Renderer
        ↓
4. Question Bank
        ↓
5. Assessment Engine
        ↓
6. Attempt + Grading
        ↓
7. Progress / Mastery
        ↓
8. Admin
        ↓
9. MCP Read Tools
        ↓
10. MCP Write Tools
```

อย่าเริ่มจาก MCP ก่อน

Core application/domain logic ต้องแข็งก่อน แล้วค่อย expose service เหล่านั้นผ่าน MCP

---

# 68. Guiding Principle

Architecture หลักควรเป็น:

```text
Learning Platform
      +
Content Management
      +
Assessment Engine
      +
Learning Analytics
      +
MCP Interface
```

ไม่ใช่

```text
Accounting Website
```

Accounting เป็นเพียง Course แรกที่ใช้ทดสอบระบบ

เป้าหมายระยะยาวคือ:

> **Personal Learning OS**
>
> ระบบที่สามารถเพิ่มสาขาวิชา สร้างหลักสูตร สร้างเนื้อหา สร้างข้อสอบ วัดผล วิเคราะห์จุดอ่อน และให้ AI ช่วยดูแล Course ผ่าน MCP ได้ โดยไม่ต้องแก้ Core Architecture ทุกครั้งที่เพิ่มวิชาใหม่
