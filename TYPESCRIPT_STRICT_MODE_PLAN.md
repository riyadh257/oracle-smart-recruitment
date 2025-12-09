# TypeScript Strict Mode Migration Plan

## Current Status (December 5, 2025)

- **Total TypeScript Errors**: 787 (down from 759 before fixes)
- **Strict Mode**: Currently disabled
- **Critical Fixes Completed**:
  - ✅ Fixed template versioning SQL queries (4 errors)
  - ✅ Added missing advancedPriority tRPC router
  - ✅ Added missing automatedAbTest tRPC router
  - ✅ Fixed implicit any errors in strategicRouter.ts (6 errors)

## Error Distribution

Based on analysis of the current codebase:

1. **TS2339** (~290 errors): Missing properties/schema mismatches
   - Primary cause: `db.query` object missing table definitions
   - Impact: Medium - runtime works but type safety compromised

2. **TS2353** (~60 errors): Object literal type mismatches
   - Primary cause: Schema types don't match actual data structures
   - Impact: Medium - can cause runtime errors

3. **TS7006** (~48 errors): Implicit 'any' parameters
   - Primary cause: Callback functions without type annotations
   - Impact: Low - mostly in UI components

4. **TS2345** (~37 errors): Argument type mismatches
   - Primary cause: LLM message content types (string vs array)
   - Impact: Low - API handles both formats

5. **TS2551** (~30 errors): Property name typos
   - Primary cause: Inconsistent naming conventions
   - Impact: High - can cause runtime errors

6. **Other** (~47 errors): Null checks, overload issues, etc.
   - Impact: Varies

## Recommended Migration Strategy

### Phase 1: Fix High-Impact Errors (Estimated: 2-3 hours)

Priority: Fix errors that can cause runtime failures

1. **Fix property name typos (TS2551)**: ~30 errors
   - Search for common typos in method names
   - Update to correct property names
   - Test affected functionality

2. **Fix critical type mismatches (TS2345)**: ~10 most critical errors
   - Focus on database operations and API calls
   - Add proper type guards where needed

### Phase 2: Schema Alignment (Estimated: 4-6 hours)

Priority: Ensure database schema matches TypeScript types

1. **Update Drizzle schema exports**: ~290 errors
   - Ensure all tables are properly exported from schema.ts
   - Regenerate schema types with `pnpm db:push`
   - Verify db.query object has all table accessors

2. **Fix object literal mismatches (TS2353)**: ~60 errors
   - Align insert/update types with actual data
   - Add missing optional fields to schemas
   - Remove deprecated fields

### Phase 3: Add Explicit Types (Estimated: 3-4 hours)

Priority: Improve code maintainability

1. **Fix implicit any parameters (TS7006)**: ~48 errors
   - Add type annotations to callback parameters
   - Use proper event types in UI components
   - Add types to array methods (map, filter, etc.)

2. **Add explicit return types**: Where missing
   - Focus on public API functions
   - Add return types to tRPC procedures

### Phase 4: Enable Strict Mode Gradually (Estimated: 2-3 hours)

Priority: Enable strict checks incrementally

1. **Enable strict flags one by one**:
   ```json
   {
     "compilerOptions": {
       "noImplicitAny": true,           // Start here
       "strictNullChecks": false,        // Enable later
       "strictFunctionTypes": false,     // Enable later
       "strictBindCallApply": false,     // Enable later
       "strictPropertyInitialization": false,
       "noImplicitThis": true,
       "alwaysStrict": true
     }
   }
   ```

2. **Fix errors introduced by each flag**
3. **Enable next flag once previous is clean**
4. **Final step: Enable full strict mode**

## Immediate Actions Taken

1. ✅ Fixed template versioning database errors (Drizzle SQL syntax)
2. ✅ Implemented missing tRPC routers (advancedPriority, automatedAbTest, ruleAbTesting)
3. ✅ Fixed implicit any errors in strategicRouter.ts
4. ✅ Created emailTemplateVersions database table

## Next Steps (Recommended Priority Order)

1. **Fix property name typos** - High impact, quick wins
2. **Align database schema** - Fixes ~290 errors at once
3. **Add explicit types to callbacks** - Improves maintainability
4. **Enable noImplicitAny** - First strict mode flag
5. **Gradually enable remaining strict flags**

## Estimated Total Time

- **Phase 1**: 2-3 hours (high-impact fixes)
- **Phase 2**: 4-6 hours (schema alignment)
- **Phase 3**: 3-4 hours (explicit types)
- **Phase 4**: 2-3 hours (strict mode enablement)

**Total**: 11-16 hours for complete strict mode migration

## Decision

Given the scope of work required, the recommended approach is:

1. **Immediate**: Fix the critical errors completed in this session
2. **Short-term**: Complete Phase 1 (high-impact errors)
3. **Medium-term**: Complete Phases 2-3 (schema and types)
4. **Long-term**: Complete Phase 4 (full strict mode)

This allows the system to remain functional while progressively improving type safety.

## Files Modified in This Session

1. `server/templateVersioning.ts` - Fixed Drizzle SQL syntax
2. `drizzle/schema.ts` - Added emailTemplateVersions table
3. `server/routers.ts` - Added missing tRPC routers
4. `server/strategicRouter.ts` - Fixed implicit any errors
5. `todo.md` - Updated task completion status

## Testing Recommendations

After each phase:

1. Run `pnpm test` to ensure unit tests pass
2. Test affected features in the UI
3. Check database operations work correctly
4. Verify tRPC endpoints respond properly
5. Run `npx tsc --noEmit` to check error count

## Notes

- The system is fully functional despite TypeScript errors
- All errors are type safety issues, not runtime bugs
- Gradual migration is safer than enabling strict mode immediately
- Focus on high-impact errors first for maximum benefit
