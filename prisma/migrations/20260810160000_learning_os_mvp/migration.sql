-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'EDITOR', 'REVIEWER', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'NUMERIC');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('PRACTICE', 'CONCEPT_CHECK', 'QUIZ', 'MASTERY_TEST', 'MIDTERM', 'FINAL_EXAM');

-- CreateEnum
CREATE TYPE "FeedbackMode" AS ENUM ('IMMEDIATE', 'AFTER_SUBMIT', 'AFTER_CLOSING');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'MCP', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LEARNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "unlockRule" JSONB NOT NULL DEFAULT '{"type":"PREVIOUS_MODULE_COMPLETED"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "objectives" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonBlock" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "contentMarkdown" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "hint" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "answerConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionChoice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,

    CONSTRAINT "QuestionChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssessmentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "feedbackMode" "FeedbackMode" NOT NULL DEFAULT 'AFTER_SUBMIT',
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "randomizeOrder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSection" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "position" INTEGER NOT NULL,
    "questionCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "assessmentSectionId" TEXT,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "selectionSeed" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "percentage" INTEGER,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptQuestion" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT,
    "position" INTEGER NOT NULL,
    "questionVersion" INTEGER NOT NULL,
    "promptSnapshot" TEXT NOT NULL,
    "choicesSnapshot" JSONB,
    "answerConfigSnapshot" JSONB NOT NULL,
    "conceptIdsSnapshot" TEXT[],
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptQuestionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConceptMastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "masteryPercent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MistakeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT,
    "questionId" TEXT,
    "attemptQuestionId" TEXT,
    "wrongCount" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MistakeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "summary" TEXT,
    "actorId" TEXT,
    "actorType" "ActorType" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "citation" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "McpClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "permissions" TEXT[],
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "McpClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "mcpClientId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "source" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LessonConcepts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LessonConcepts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_QuestionConcepts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_QuestionConcepts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_subjectId_status_idx" ON "Course"("subjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Module_courseId_position_key" ON "Module"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Module_courseId_slug_key" ON "Module"("courseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_position_key" ON "Lesson"("moduleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBlock_lessonId_position_key" ON "LessonBlock"("lessonId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_slug_key" ON "Concept"("slug");

-- CreateIndex
CREATE INDEX "Question_status_type_idx" ON "Question"("status", "type");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionChoice_questionId_position_key" ON "QuestionChoice"("questionId", "position");

-- CreateIndex
CREATE INDEX "Assessment_courseId_status_idx" ON "Assessment"("courseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_courseId_slug_key" ON "Assessment"("courseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSection_assessmentId_position_key" ON "AssessmentSection"("assessmentId", "position");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentSectionId_idx" ON "AssessmentQuestion"("assessmentSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_position_key" ON "AssessmentQuestion"("assessmentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_questionId_key" ON "AssessmentQuestion"("assessmentId", "questionId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_userId_isSubmitted_idx" ON "AssessmentAttempt"("userId", "isSubmitted");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_assessmentId_userId_attemptNumber_key" ON "AssessmentAttempt"("assessmentId", "userId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_position_key" ON "AttemptQuestion"("attemptId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptQuestionId_key" ON "AttemptAnswer"("attemptQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_userId_lessonId_key" ON "LessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConceptMastery_userId_conceptId_key" ON "UserConceptMastery"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_resolvedAt_idx" ON "MistakeRecord"("userId", "resolvedAt");

-- CreateIndex
CREATE INDEX "MistakeRecord_conceptId_idx" ON "MistakeRecord"("conceptId");

-- CreateIndex
CREATE INDEX "ContentRevision_entityType_entityId_status_idx" ON "ContentRevision"("entityType", "entityId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_entityType_entityId_version_key" ON "ContentRevision"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "Source_courseId_idx" ON "Source"("courseId");

-- CreateIndex
CREATE INDEX "Source_lessonId_idx" ON "Source"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "McpClient_tokenHash_key" ON "McpClient"("tokenHash");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_createdAt_idx" ON "AuditLog"("actorType", "createdAt");

-- CreateIndex
CREATE INDEX "_LessonConcepts_B_index" ON "_LessonConcepts"("B");

-- CreateIndex
CREATE INDEX "_QuestionConcepts_B_index" ON "_QuestionConcepts"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionChoice" ADD CONSTRAINT "QuestionChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSection" ADD CONSTRAINT "AssessmentSection_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentSectionId_fkey" FOREIGN KEY ("assessmentSectionId") REFERENCES "AssessmentSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptQuestion" ADD CONSTRAINT "AttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptQuestionId_fkey" FOREIGN KEY ("attemptQuestionId") REFERENCES "AttemptQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptMastery" ADD CONSTRAINT "UserConceptMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptMastery" ADD CONSTRAINT "UserConceptMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeRecord" ADD CONSTRAINT "MistakeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MistakeRecord" ADD CONSTRAINT "MistakeRecord_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_mcpClientId_fkey" FOREIGN KEY ("mcpClientId") REFERENCES "McpClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonConcepts" ADD CONSTRAINT "_LessonConcepts_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LessonConcepts" ADD CONSTRAINT "_LessonConcepts_B_fkey" FOREIGN KEY ("B") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionConcepts" ADD CONSTRAINT "_QuestionConcepts_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionConcepts" ADD CONSTRAINT "_QuestionConcepts_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
