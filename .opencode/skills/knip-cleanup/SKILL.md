---
name: knip-cleanup
description: Use when asked to check a TypeScript repo for dead code with knip, or to clean up unused files, exports, types, or dependencies.
---

# Knip cleanup

## Overview
Knip reports dead code reachable from no entry point. Its output shape is `{"issues": [...]}`. Empty issues means clean. The default run is the verdict.

## When to use
- Requests mentioning knip, dead-code checks, or cleanup of unused files, exports, types, or dependencies.
- Skip for unused locals inside one file. That belongs to oxlint and tsc.

## Procedure
1. Read `knip.json`. Record the `entry` and `project` patterns, and whether any carry the production `!` marker.
2. Run the baseline and expect `{"issues":[]}`.
```
npx knip --reporter json
```
3. Run the strict sweep over every issue type.
```
npx knip --include files,dependencies,unlisted,unresolved,exports,nsExports,types,nsTypes,enumMembers,namespaceMembers,duplicates,cycles
```
4. Run the companion checks knip cannot cover.
```
npx oxlint
npx tsc --noEmit
```

## Verify before deleting
- Trace each hit to its real use before touching code.
```
npx knip --trace-dependency <name>
npx knip --trace-export <name>
npx knip --trace-file <path>
```
- Distrust a `--production`-only hit in repos without `!` markers. Production mode ignores every pattern lacking `!`, so it flags live dependencies as unused. Seen here: `lucide-react` flagged while imported at `src/Terminal.tsx:2`. Never delete from a production-only report alone.

## Cleanup
- Present the traced hit list, delete the dead code, and re-run the baseline to `{"issues":[]}`.

## Common mistakes
- Deleting from an untraced report.
- Trusting `--production` without `!` markers.
- Expecting knip to catch unused locals. That is oxlint output, not knip output.
