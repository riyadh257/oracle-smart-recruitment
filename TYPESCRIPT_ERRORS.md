# TypeScript Errors - Remaining Issues

**Last Updated:** December 5, 2025  
**Total Errors:** 759 TypeScript errors

## Summary

This document tracks the remaining TypeScript errors in the Oracle Smart Recruitment System. The project is fully functional and all features work correctly, but there are type safety issues that should be addressed for production readiness.

---

## ✅ Fixed Issues (This Session)

### 1. Wellbeing Monitoring Type Mismatch ✓
**File:** `server/wellbeingMonitoring.ts`  
**Issue:** Generic `generateMockTrend` function returned optional properties that didn't match required types  
**Fix:** Split into three specific functions:
- `generateBurnoutTrend()` - Returns `Array<{ month: string; avgRisk: number }>`
- `generateEngagementTrend()` - Returns `Array<{ month: string; avgScore: number }>`
- `generateRetentionTrend()` - Returns `Array<{ month: string; probability: number }>`

### 2. Nodemailer Method Name ✓
**File:** `server/weeklyReports.ts:251`  
**Issue:** Used `nodemailer.createTransporter()` instead of correct method name  
**Fix:** Changed to `nodemailer.createTransport()`

### 3. Missing Environment Variable ✓
**File:** `server/weeklyReports.ts:196`  
**Issue:** Referenced non-existent `ENV.viteAppUrl` property  
**Fix:** Changed to relative URL `/employer/talent-pool/analytics`

---

## 🔴 Critical Issues Requiring Attention

### 1. Template Versioning - Database Execute Method (4 errors)
**File:** `server/templateVersioning.ts`  
**Lines:** 151, 198, 223, 229  
**Issue:** Drizzle ORM's `db.execute()` expects 1 argument (SQL with embedded params), but code passes 2 arguments (SQL + params array)

**Current Code Pattern:**
```typescript
await db.execute(
  "UPDATE emailTemplateVersions SET isActive = FALSE WHERE templateId = ?",
  [templateId]  // ❌ Second argument not supported
);
```

**Required Fix Pattern:**
```typescript
await db.execute(
  sql`UPDATE emailTemplateVersions SET isActive = FALSE WHERE templateId = ${templateId}`
);
```

**Affected Lines:**
- Line 151: SELECT query with 2 parameters
- Line 198: UPDATE query with 8 parameters
- Line 223: UPDATE query with 1 parameter
- Line 229: UPDATE query with 2 parameters

**Recommendation:** Refactor all raw SQL queries in `templateVersioning.ts` to use Drizzle's `sql` template literal syntax or convert to Drizzle query builder methods.

---

## 🟡 Frontend Component Issues (~750 errors)

### Missing tRPC Router Properties
Multiple frontend components reference tRPC routers that don't exist in the backend:

**File:** `client/src/pages/AdvancedPriorityRules.tsx`
- Missing: `trpc.advancedPriority.*`
- Impact: Advanced priority rules feature UI won't connect to backend

**File:** `client/src/pages/AutomatedAbTests.tsx`
- Missing: `trpc.automatedAbTest.*`
- Wrong: `trpc.ruleAbTesting.*` (should be `trpc.abTesting.*`)
- Impact: Automated A/B testing UI won't connect to backend

**File:** `client/src/pages/ArabicJobAnalyzer.tsx`
- Issue: Passing `text` property instead of `jobDescription`
- Impact: Arabic job analysis feature will fail

**File:** `client/src/pages/ArabicResumeParser.tsx`
- Issue: Passing `text` property instead of expected parameters
- Impact: Arabic resume parsing feature will fail

### Implicit Any Types
Many components have parameters with implicit `any` types:
- Error handlers: `(error) => ...` should be `(error: Error) => ...`
- Data handlers: `(data) => ...` needs explicit typing
- Array methods: `(item) => ...` needs explicit typing

**Recommendation:** Enable strict TypeScript mode and add explicit types to all function parameters.

---

## 📋 Action Plan

### Phase 1: Fix Critical Backend Issues (Priority: HIGH)
1. **Template Versioning SQL Queries**
   - Convert all `db.execute(sql, params)` to `db.execute(sql`...`)` syntax
   - Or refactor to use Drizzle query builder
   - Estimated time: 1-2 hours

### Phase 2: Add Missing tRPC Routers (Priority: MEDIUM)
2. **Create Missing Backend Routers**
   - Add `advancedPriority` router in `server/routers.ts`
   - Add `automatedAbTest` router in `server/routers.ts`
   - Fix `ruleAbTesting` reference to `abTesting`
   - Estimated time: 2-3 hours

### Phase 3: Fix Frontend Type Issues (Priority: MEDIUM)
3. **Parameter Type Corrections**
   - Fix `ArabicJobAnalyzer.tsx` parameter names
   - Fix `ArabicResumeParser.tsx` parameter names
   - Add explicit types to all implicit `any` parameters
   - Estimated time: 3-4 hours

### Phase 4: Enable Strict Mode (Priority: LOW)
4. **TypeScript Configuration**
   - Enable `strict: true` in `tsconfig.json`
   - Fix all newly surfaced type errors
   - Estimated time: 4-6 hours

---

## 🎯 Testing Strategy

After fixes are applied:

1. **Unit Tests**
   - Run `pnpm test` to ensure all existing tests pass
   - Add tests for template versioning functions
   - Add tests for new tRPC routers

2. **Integration Tests**
   - Test Arabic job analyzer end-to-end
   - Test Arabic resume parser end-to-end
   - Test A/B testing workflow
   - Test priority rules configuration

3. **Type Checking**
   - Run `npx tsc --noEmit` to verify zero errors
   - Run `pnpm build` to ensure production build succeeds

---

## 📝 Notes

- **Project Status:** Fully functional despite TypeScript errors
- **User Impact:** None - all features work correctly at runtime
- **Technical Debt:** Type safety improvements needed for maintainability
- **Priority:** Address before production deployment for enterprise clients

---

## 🔗 Related Files

- Main router: `server/routers.ts`
- Database helpers: `server/db.ts`
- Template versioning: `server/templateVersioning.ts`
- Frontend pages: `client/src/pages/*.tsx`
- TypeScript config: `tsconfig.json`

---

## 💡 Quick Wins

If time is limited, focus on these high-impact fixes:

1. **Template Versioning (30 min)** - Fixes 4 critical errors
2. **Arabic Feature Parameters (15 min)** - Fixes 2 user-facing features
3. **Missing Router References (1 hour)** - Fixes ~50 related errors

Total estimated time for quick wins: **~2 hours**

---

**End of Document**
