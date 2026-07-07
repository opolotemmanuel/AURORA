# Aurora SkinSense Phase 1 Database Schema

This document is the backend-ready schema plan for Aurora SkinSense Phase 1.

Prisma is installed and the Phase 1 schema lives in `prisma/schema.prisma`.

## Goals

- Persist scan metadata and cosmetic report output.
- Store Aurora product recommendations generated from scan results.
- Track PDF/printable report downloads.
- Support admin analytics from real persisted records.
- Keep original image retention off by default.
- Keep all report language cosmetic-only and non-diagnostic.
- Prepare for better-auth role-based access when better-auth is installed.

## Core Models

### User

Managed by better-auth once installed.

Suggested application fields:

- `id` string primary key
- `email` string unique
- `name` string nullable
- `role` enum: `USER`, `ADMIN`, `OWNER`, `SUPPORT`, `PRIVACY`
- `createdAt` datetime
- `updatedAt` datetime

Indexes:

- `email`
- `role`

### Scan

Stores scan metadata only. Original images are not stored by default.

- `id` string primary key
- `userId` string nullable
- `source` enum: `CAMERA`, `UPLOAD`, `UNKNOWN`
- `status` enum: `RECEIVED`, `ANALYZED`, `FALLBACK`, `FAILED`
- `imageMimeType` string nullable
- `imageSizeBytes` integer nullable
- `originalImageStored` boolean default false
- `imageStorageKey` string nullable
- `qualityLighting` string nullable
- `qualityFraming` string nullable
- `qualityConfidence` string nullable
- `createdAt` datetime
- `updatedAt` datetime

Relations:

- optional `User`
- one optional `Report`

Indexes:

- `userId`
- `status`
- `source`
- `createdAt`

### Report

Stores the cosmetic report generated from a scan.

- `id` string primary key
- `scanId` string unique
- `userId` string nullable
- `summary` text
- `source` enum: `GEMINI`, `FALLBACK`, `RULE_BASED`
- `model` string
- `disclaimer` text
- `fallbackReason` text nullable
- `createdAt` datetime
- `updatedAt` datetime

Relations:

- required `Scan`
- optional `User`
- many `ReportFinding`
- many `Recommendation`
- many `ReportDownload`

Indexes:

- `scanId`
- `userId`
- `source`
- `createdAt`

### ReportFinding

Stores coarse cosmetic bands only.

- `id` string primary key
- `reportId` string
- `label` string
- `concern` string nullable
- `band` string
- `observation` text
- `sortOrder` integer
- `createdAt` datetime

Indexes:

- `reportId`
- `band`

### Product

Stores Aurora product catalog rows when database products replace local typed data.

- `id` string primary key
- `slug` string unique
- `name` string
- `category` string
- `routineStep` enum: `CLEANSE`, `TREAT`, `MOISTURIZE`, `PROTECT`
- `shortDescription` text
- `cosmeticBenefits` json
- `bestFor` json
- `avoidIf` json nullable
- `priority` integer
- `active` boolean default true
- `createdAt` datetime
- `updatedAt` datetime

Indexes:

- `slug`
- `active`
- `routineStep`

### Recommendation

Stores the recommendation engine output attached to a report.

- `id` string primary key
- `reportId` string
- `productId` string
- `rank` integer
- `score` integer
- `matchStrength` enum: `PRIMARY`, `SUPPORTING`, `OPTIONAL`
- `reasons` json
- `routineStep` string
- `createdAt` datetime

Indexes:

- `reportId`
- `productId`
- `rank`

### ReportDownload

Tracks printable/PDF report access.

- `id` string primary key
- `reportId` string
- `format` enum: `PRINT_HTML`, `PDF`
- `userId` string nullable
- `ipHash` string nullable
- `userAgent` string nullable
- `createdAt` datetime

Indexes:

- `reportId`
- `format`
- `createdAt`

### AuditLog

Tracks admin and privacy-sensitive actions.

- `id` string primary key
- `actorId` string nullable
- `actorRole` string nullable
- `action` string
- `targetType` string
- `targetId` string
- `metadata` json nullable
- `createdAt` datetime

Indexes:

- `actorId`
- `targetType`, `targetId`
- `createdAt`

### AiProviderEvent

Tracks AI provider status and fallback activity without storing secrets.

- `id` string primary key
- `provider` string
- `model` string
- `status` enum: `SUCCESS`, `FALLBACK`, `FAILED`
- `reportId` string nullable
- `scanId` string nullable
- `reason` text nullable
- `createdAt` datetime

Indexes:

- `provider`
- `status`
- `createdAt`

## Privacy Defaults

- Do not store original scan images by default.
- Store scan metadata, report text, coarse findings, and recommendations.
- Any future image storage must require explicit retention consent.
- Add a user-level delete workflow before production launch.
- Audit every admin report view, export, download, privacy change, and delete request.

## Auth Plan

better-auth is not installed. When approved:

- Add better-auth with email OTP/session storage.
- Add role checks for `/admin` pages and `/api/admin/*` routes.
- Keep admin APIs server-only and role protected.
- Do not expose `GEMINI_API_KEY` or admin secrets to client bundles.

## Current Implementation

The app uses PostgreSQL through Prisma in `lib/backend/report-store.ts`. The Prisma client is created in `lib/db.ts` and generated into `lib/generated/prisma`.
