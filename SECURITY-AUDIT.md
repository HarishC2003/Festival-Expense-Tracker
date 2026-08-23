# Festival Finance Manager - Security Audit Report

This document outlines the security vulnerabilities identified during the pre-deployment security audit and the steps taken to remediate them.

## Executive Summary

The application (React frontend, Node.js/Express backend, Supabase database) was audited for common web vulnerabilities including Authentication bypass, IDOR (Insecure Direct Object Reference), Rate Limiting/Brute Force, Data Validation, and Secure Configuration.

Several critical issues were identified primarily stemming from the backend's use of the `supabaseAdmin` service role key, which bypasses Row Level Security (RLS). Strict access controls and data validation have been implemented to secure the platform.

---

## 1. Authentication & Rate Limiting

### Finding 1.1: Missing Rate Limit on Login
**Severity**: High
**Description**: The application allowed unlimited login attempts, exposing the system to brute-force credential stuffing and password guessing attacks. 
**Remediation**:
- Created a proxy backend route `POST /api/auth/login`.
- Implemented `express-rate-limit` to restrict failed login attempts to 5 per 15 minutes per IP.
- Ensured error messages are generic ("Invalid credentials") to prevent user enumeration.

### Finding 1.2: Global API Rate Limiting
**Severity**: Medium
**Description**: API endpoints lacked general rate limiting, leaving the server vulnerable to volumetric DoS (Denial of Service) attacks.
**Remediation**:
- Applied a global rate limit of 100 requests per minute across all `/api/*` routes.
- Added structured logging for rate-limit triggers.

### Finding 1.3: Client-Side Logout Only
**Severity**: Medium
**Description**: The frontend `signOut` merely cleared local session state. A compromised token would remain valid until expiry.
**Remediation**:
- Created a `POST /api/auth/logout` endpoint that uses `supabase.auth.admin.signOut()` to invalidate the JWT server-side globally.

---

## 2. Authorization & IDOR (Insecure Direct Object Reference)

### Finding 2.1: Insufficient Backend Role Checks
**Severity**: Critical
**Description**: The Express backend uses `supabaseAdmin` (Service Role Key) to fetch and mutate data. This inherently bypasses Supabase RLS. While some endpoints checked for `requireGroupAccess`, write endpoints were missing strict role enforcement (`owner` or `editor`), allowing any authenticated user to potentially modify group data if they could spoof the `X-Group-Id` header.
**Remediation**:
- Refactored `auth.middleware.ts` to strictly validate `allowedRoles`.
- Enforced `requireGroupAccess(['owner', 'editor'])` on all `POST`, `PUT`, `DELETE` operations across master data, income, and group management routes.

### Finding 2.2: Insufficient RLS Policies
**Severity**: High
**Description**: Existing RLS policies were not uniformly applied or lacked strict `group_members` validation across all tables.
**Remediation**:
- Deployed migration `00014_strict_rls_policies.sql`.
- Applied strict `has_group_access` (SELECT) and `has_group_write_access` (INSERT/UPDATE/DELETE) policies to all tables, preventing direct DB access exploitation.

---

## 3. Data Validation

### Finding 3.1: Missing Server-Side Input Validation
**Severity**: High
**Description**: Input validation was solely handled by React Hook Form on the frontend. The backend accepted arbitrary JSON payloads, exposing the database to malformed data, injection, or unexpected state changes.
**Remediation**:
- Integrated `zod` schema validation across all backend routes.
- Enforced strict type checking and required fields for Income, Expenses, Media, Master Data, and Group Management endpoints.

---

## 4. Platform Administration & Hardening

### Finding 4.1: Lack of Platform Admin Role
**Severity**: Low
**Description**: There was no secure mechanism for platform owners to monitor cross-tenant activity without manually querying the database.
**Remediation**:
- Created migration `00015_platform_admin.sql` introducing `is_platform_admin` to the `users` table.
- Created `requirePlatformAdmin` middleware.
- Built a secure Platform Admin Dashboard `/admin` for system monitoring.

### Finding 4.2: Inadequate Audit Logging
**Severity**: Medium
**Description**: Security events (failed logins, forbidden access) were silently rejected without leaving an audit trail for incident response.
**Remediation**:
- Added structured JSON logging (`console.warn`) for `unauthorized_access`, `forbidden_access`, `rate_limit_exceeded`, and `unhandled_server_error` to seamlessly integrate with Vercel/CloudWatch logs.

### Finding 4.3: Hardcoded Secrets Scan
**Severity**: Low
**Description**: A codebase scan was conducted to ensure no API keys or secrets were hardcoded.
**Remediation**:
- Automated `grep` scans confirmed no hardcoded `sk_live`, `sk_test`, or database passwords exist in the source repository.
- A root `.gitignore` was created to explicitly exclude `.env` files.
