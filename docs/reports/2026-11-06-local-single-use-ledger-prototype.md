# Local single-use ledger prototype — 2026-11-06

## Scope
Local-only SQLite reference model for the proposed D1 approval ledger. No cloud resources, production workflows, secrets, settings or billing were changed.

## Refreshed baseline
- Production `Основной` HEAD: `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR #32 OPEN / DRAFT / UNMERGED; head `75c83a288d865f1bbeda4905cf817e00084bcc2d`; base `197ba98d0dc7d8437d759dd25bee8750d02e59ae`.
- PR reviews: 0; inline threads: 0.
- Authorization negative-first run `42236017811` / job `127953700048`: COMPLETED / FAILURE, 8/8 assertions failed. Contract validation `42236017724` succeeded but is not security qualification.

## Prototype and test evidence
File: `tests/prototypes/sqlite-single-use-ledger-reference.test.py`
Commit: `5ad35ae1b677a589cb6790264f8406821e013691`
The model stores approval ID (PRIMARY KEY), owner, repository, Issue, target SHA, profile, envelope digest, expiry and consumed timestamp. Consumption is a conditional UPDATE inside `BEGIN IMMEDIATE`; it succeeds only when every bound field matches, the approval is unexpired and unconsumed, and exactly one row changes.

Local command: `python3 tests/prototypes/sqlite-single-use-ledger-reference.test.py`
Result: 7 tests, 7 passed:
- 12 simultaneous consumers: exactly 1 accepted, 11 rejected;
- replay rejected;
- wrong owner/repository/Issue/SHA/profile/envelope rejected;
- expired approval rejected;
- duplicate approval ID rejected by primary-key uniqueness;
- unknown approval rejected;
- unavailable database raises an error (caller must fail closed).

## Qualification boundary
This is local SQLite evidence, NOT D1 qualification. It does not establish D1 concurrency/transaction behavior in Workers, Cloudflare Free/no-card eligibility, caller identity, owner approval provenance, backup/restore, quotas, or ambiguous-network recovery. No production integration was attempted. A database uniqueness constraint cannot authenticate a GitHub workflow caller.

## Next
1. Implement D1-specific adapter and migrations using the official Workers/D1 test runtime.
2. Test concurrent consume, transaction rollback, affected-row semantics and ambiguous response recovery against D1.
3. Verify free/no-card eligibility without adding payment details or enabling paid fallback.
4. Obtain independent security review before any separately authorized disposable cloud test.

## Status
Local SQLite reference: SUCCEEDED (7/7). D1 qualification: NOT RUN. Cloudflare Free/no-card: NOT VERIFIED. GitHub caller/owner authorization: NOT IMPLEMENTED / NOT VERIFIED. PR #32 independent review: NOT RUN. Production dispatch: NOT RUN. Contour A: BLOCKED / NOT ACCEPTED. Contour B: DEFERRED.
