# `projects.js` Duplication Remediation

## Before

- Overall new-code duplication: 4.7%
- `projects.js`: 33.8%
- Duplicated lines in `projects.js`: 75

## Refactors

| Duplicated area | Shared abstraction | Result |
|---|---|---|
| Project-contact `$lookup` in project health and top projects | `buildProjectContactsLookup()` | One MongoDB lookup definition reused by both pipelines. |
| Activity `$lookup` in project health and top projects | `buildProjectActivitiesLookup({ isAdmin, userId })` | One authorization-aware lookup builder reused by both pipelines. |
| Contact stage count expressions | `buildContactStageCountExpression(condition)` | Shared `$filter`/`$size` structure for WON, Lost, and meeting counts. |
| Meeting stage list | `MEETING_STAGES` | One source for meeting-stage membership. |

The extracted activity lookup preserves the existing admin versus non-admin
`createdBy` condition and keeps the original aggregation stage order.

## Aggregation builders

| Builder | Used by |
|---|---|
| `buildProjectContactsLookup()` | Project health and top-performing project pipelines |
| `buildProjectActivitiesLookup()` | Project health and top-performing project pipelines |
| `buildContactStageCountExpression()` | Health and top-project projections |
| `buildDedupedProspectContactPipeline()` | Prospect-count and prospect-analytics pipelines |

## Validation

- Backend tests: PASS — 19 tests.
- Backend lint: PASS — 0 errors; existing warnings remain.
- Frontend lint: PASS in the prior targeted remediation run.
- Frontend build: PASS in the prior targeted remediation run.
- SonarQube: NOT RUN — scanner host/credentials are unavailable in this workspace.

## Final metrics

The final SonarQube new-code duplication percentage cannot be recorded until a
fresh scan is executed. No suppression, exclusion, or quality-gate change was
added.
