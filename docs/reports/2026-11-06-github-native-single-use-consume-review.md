# GitHub-native single-use consume feasibility review — 2026-11-06

## Scope and immutable inputs
- Repository: `VlDMlNSh/developer-cloud-pool`
- Production baseline reviewed: Worker workflow blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; Supervisor workflow blob `d4bd23d06c0dc98211cea165cdad30a1861eb3bd`.
- Negative-first test PR #32 head: `75c83a288d865f1bbeda4905cf817e00084bcc2d`.
- Exact-head authorization CI: run `42236017811`, job `127953700048`, COMPLETED/FAILURE, 8 tests, 0 passed, 8 failed. This is expected red-baseline evidence, not a security pass.
- Same-head Pool Contract Validation: run `42236017724`, job `127953700415`, COMPLETED/SUCCESS; it does not qualify authorization.
- PR #32 reviews: 0; inline review threads: 0; independent review NOT RUN.

## Candidate comparison

### 1. Git refs plus tag ruleset — ONLY PLAUSIBLE GITHUB-NATIVE CANDIDATE, NOT VERIFIED
GitHub supports tag rulesets on public repositories with GitHub Free. Rulesets can restrict tag creation, updates, and deletions. A create-ref operation can potentially provide a uniqueness race boundary for a deterministic approval-event identifier, while a tag ruleset can protect the created marker from mutation/deletion.

Official references:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/rest/git/refs#create-a-reference

Unproven prerequisites:
- Read back an ACTIVE tag ruleset targeting only the consume-marker namespace, with creation/update/deletion behavior and bypass actors fully inspected.
- Prove the actual workflow token identity and effective permission to create refs under that ruleset, without a bypass path that lets the same actor rewrite/delete markers.
- Demonstrate in a disposable namespace: first create succeeds; concurrent second create fails as a conflict; exact annotated payload and target SHA are read back; update/delete are denied; wrong actor cannot create; ambiguous API response never leads to dispatch.
- Verify that ruleset bypass semantics and GitHub Actions/GITHUB_TOKEN identity do not undermine the intended write-once property.
- Do not create a production tag or modify settings as part of this review.

### 2. Actions concurrency — NOT A DURABLE SINGLE-USE STORE
GitHub concurrency can serialize jobs/runs in a group and currently supports up to 100 queued entries with `queue: max`. The documented FIFO order is based on when runs start waiting, not guaranteed dispatch order. It provides scheduling coordination, not a durable transaction, atomic nonce consumption, or crash-safe replay protection.
Official references:
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

### 3. Actions artifacts v4 — IMMUTABLE OBJECTS, NOT A GLOBAL UNIQUE NONCE
Artifact v4 makes an uploaded artifact immutable and prevents multiple same-named artifacts within one workflow run. Artifact identity is scoped to jobs/runs; this does not establish a repository-wide create-if-absent nonce across concurrent workflow runs, nor prevent an authorized actor from creating a different artifact in another run.
Official references:
- https://github.blog/changelog/2024-02-12-github-actions-artifacts-v4-is-now-generally-available/
- https://github.blog/news-insights/product-news/get-started-with-v4-of-github-actions-artifacts/

### 4. Issue comments/labels — REJECTED AS CONSUME PRIMITIVE
These are mutable issue state and do not provide a documented atomic create-if-absent operation for a unique approval ID. They may carry approval evidence but cannot independently prove single-use consumption.

## Decision
- Keep dispatch fail-closed.
- Do not substitute Actions concurrency, artifacts, comments, or labels for durable single-use consume.
- Continue with tag-ruleset proof only if all prerequisites above can be verified at no cost and without changing production governance. If actor-specific write-once behavior cannot be proven, stop and redesign around a separately approved durable store; do not provision a paid service.
- No workflow, script, repository variable, secret, ruleset, Environment, tag, runner, provider, model, or deployment was changed or invoked during this review.

## Status
- GitHub feature availability on public GitHub Free: DOCUMENTED.
- Repository-specific tag ruleset and effective permissions: NOT VERIFIED.
- Disposable create/race/update/delete experiment: NOT RUN.
- Durable single-use consume: NOT VERIFIED.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.
