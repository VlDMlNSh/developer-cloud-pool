# Developer Cloud Pool — полный контекст разработки и продолжения

**Срез состояния:** 2026-11-04 (UTC)  
**Репозиторий:** https://github.com/VlDMlNSh/developer-cloud-pool  
**Default branch:** `Основной`  
**Назначение:** независимая облачная инженерная платформа и runtime для Jarvis. Не смешивать с репозиторием MediaHub OS.

> Этот файл — долговременная сводка решений, архитектуры, доказательств, ограничений и текущего состояния. При каждом новом сеансе перепроверять refs, SHA, Issues, PR, Ruleset, Actions и исполнителей: данный файл не заменяет live-проверку.

## 1. Цель и принципы

Создать автономный cloud-first пул из эфемерных GitHub-hosted runners, который способен принимать ограниченные инженерные задачи, выбирать совместимый профиль/исполнителя, выполнять работу в изоляции, восстанавливаться после завершения runner по лимиту времени и сохранять проверяемые результаты.

Ключевые принципы:
- Минимум вмешательства владельца; не запрашивать его действия, если безопасную работу можно выполнить самостоятельно.
- GitHub — control plane, queue, orchestration, immutable source и evidence. Runner — эфемерное место исполнения. Не использовать постоянный физический сервер как обязательный runtime.
- Каждый task имеет immutable target SHA, task ID, роль, allowlist путей/операций, input refs, budget/timeout, минимальные permissions и проверяемые acceptance criteria.
- Код и долговременные спецификации хранятся в Git; runner filesystem и Actions cache не являются durable storage.
- Все операции с секретами — least privilege, изоляция, аудит; никогда не печатать/копировать токены, ключи, cookies или authorization headers.
- Техническая возможность не означает разрешение. Ни один агент не получает права за пределами task envelope.
- Разделять PLANNED, IMPLEMENTED, TESTED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED и NOT VERIFIED.
- Пустой CI/review/status — NOT VERIFIED, не PASS.
- Не включать платный fallback, не создавать secret aliases, не расширять полномочия без подтверждённого контракта и approval.

## 2. Облачная модель исполнения

### 2.1 Двадцать логических профилей

Архитектура описывает до 20 одновременных GitHub-hosted jobs, а не 20 постоянных VM. Плановый baseline для стандартного публичного Linux x64 runner: 4 vCPU, 16 GB RAM, 14 GB SSD; фактические характеристики всегда измерять на runner и сверять с актуальными ограничениями GitHub. Теоретическая сумма 80 vCPU / 320 GB RAM / 280 GB SSD — распределённые ресурсы независимых эфемерных VM, не общий компьютер или диск.

Логические профили (все, кроме явно реализованного scaffold, PLANNED / NOT QUALIFIED):
1. Dispatch/intake validation.
2. Policy/provenance.
3. Gemini Research.
4. Gemini Implementation.
5. Gemini Independent Audit.
6. Ollama → FCC → Claude Code → ECC (последовательный toolchain в одном профиле).
7. Codex CLI.
8. Aider + Goose (последовательно, не ставить все тяжёлые инструменты вместе без измерений).
9. mini-SWE-agent.
10. OpenHands SDK.
11. Repository Intelligence.
12. agent-browser + Chromium.
13. Playwright UI QA.
14. MCP/API integration.
15. Research/documentation.
16. Unit tests.
17. Integration tests.
18. Build/performance.
19. Security audit.
20. Independent review/evidence.

Не закреплять постоянно runner за профилем: scheduler распределяет задачи динамически по capabilities, priority и доступной concurrency. Профили устанавливают только необходимые инструменты. Сначала измерить CPU, RAM, disk, startup, installation footprint, duration и cleanup.

### 2.2 Контрольная плоскость и lifecycle

Текущий scaffold:
- GitHub Pool Supervisor — сериализованная reconciliation по Issues; event-driven wake-ups и scheduled fallback.
- Pool Worker — один allowlisted профиль `dsh-headless-probe`.
- Supervisor требует literal `POOL_DISPATCH_ENABLED === "true"`; иначе heartbeat-only и exit 0.
- Intake требует immutable 40-character target SHA и точное allowlisted имя профиля. Issue body не может задавать shell command или произвольный workflow.
- Worker checkout выполняется по target SHA, а не по mutable branch.
- Supervisor использует task claim/lease и reconciliation; текущий lease-expiry путь возвращает задачу в ready, но не выполняет автоматический retry.
- Система не является непрерывно работающим daemon. GitHub schedule может задерживаться/теряться; event triggers + периодическая reconciliation дают best-effort, не SLA.
- General-purpose checkpoint/resume и automatic continuation arbitrary agent work пока NOT IMPLEMENTED.

Предполагаемый lifecycle:
1. Task issue с objective, profile, target SHA и acceptance criteria.
2. Проверка схемы, статуса, label/approval и allowlist.
3. Serialized claim с lease.
4. Dispatch Worker на exact SHA.
5. Worker исполняет только разрешённый профиль.
6. Записывает ограниченные evidence/artifacts и terminal status.
7. Completion event будит Supervisor; scheduled reconciliation — fallback.
8. При достижении soft deadline сохраняется versioned checkpoint и digest; следующий worker проверяет target/checkpoint/idempotency и возобновляет только разрешённую работу.

GitHub-hosted job имеет hard limit до шести часов. Для долгих задач нужен soft deadline ниже hard limit, durable checkpoint, task ID, target SHA, schema version, artifact digests, lease ownership и idempotency. Нельзя рассчитывать на выживание процесса за пределами job.

### 2.3 Durable state

GitHub Issues подходят для bootstrap/низкого потока, но не являются high-throughput transactional DB. Actions cache не является durable storage или shared filesystem. Будущая Pool Bridge может использовать PostgreSQL для task ledger, leases, checkpoints, policy и audit metadata; Redis — только при подтверждённой потребности в throughput/rate counters/cache. Выбор и квалификация storage ещё не завершены.

## 3. Agent-browser: обязательное целевое размещение

Пользователь явно потребовал: браузерный агент впоследствии должен работать внутри облачного пула, без отдельного внешнего сервера и без реального/физического оборудования. До появления этого runtime разрешено пользоваться SentinelX для административного контроля подключённого хоста; Desktop Commander — только как fallback, если необходимую операцию невозможно выполнить через SentinelX.

Целевой дизайн:
- Dedicated job на эфемерном GitHub-hosted `ubuntu-24.04`.
- Внутри одного job устанавливать закреплённую версию `agent-browser` и совместимый Chromium.
- Перед браузерными командами получать актуальный CLI skill: `agent-browser skills get core`; `--full` только если необходимо.
- Chromium, CDP, browser profile, downloads и временные данные находятся в sandbox job. CDP loopback-only; не открывать debugging port наружу и не держать постоянный browser daemon.
- Чистый профиль на задачу; не переносить cookies/session storage между задачами. Персистентная auth-state возможна только как отдельный security-reviewed design с encryption, узким scope и retention.
- Browser job по умолчанию без secrets, с минимальными token permissions, allowlist доменов/URL, redirect validation, bounded timeout/downloads и scrubbed artifacts.
- В evidence фиксировать target SHA, run/job IDs, agent-browser/Chromium versions, domains, operation summary, artifact digests и terminal status.
- Browser Worker profile не добавлять в dispatch allowlist до independent security review, exact-head CI, egress controls, artifact policy и lifecycle qualification.
- Не применять браузер к обходу MFA, account security, platform terms, issuer/capability gates или owner approval.

Issue: [#5 — Run agent-browser inside ephemeral GitHub-hosted pool runners](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5). Статус: OPEN, design/work item; runtime не установлен, browser smoke NOT RUN.

## 4. Toolchain и модели: намерения, не квалификация

В прошлых обсуждениях рассматривались:
- Три Gemini исполнителя через общий утверждённый controller (отдельный проектный controller, если он будет интегрирован сюда — только по проверенному контракту).
- Отдельный профиль Ollama → FCC → Claude Code → ECC.
- Codex CLI, Gemini CLI, Aider, Goose, mini-SWE-agent, OpenHands SDK и другие как кандидаты.
- Qwen/GLM/DeepSeek и другие бесплатные/квотируемые облачные модели как кандидаты для безопасной маршрутизации.
- Автоматическое продолжение работы через соседние runner при шестичасовом лимите.

Ничего из этого не означает, что инструменты установлены, credentials доступны, модельные вызовы разрешены или профили квалифицированы. DSH — текущий candidate runtime, не policy authority и не scheduler. Его package/profile smoke не доказывает безопасность модели, tools или sandbox. Не передавать DSH полномочия Supervisor/Pool Bridge.

## 5. Источники архитектурной истины в репозитории

- [README](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/README.md)
- [20 Runner Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/CLOUD-POOL-20-RUNNER-ARCHITECTURE.md)
- [Jarvis Hybrid Platform Reference Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/JARVIS-HYBRID-PLATFORM-REFERENCE-ARCHITECTURE.md)
- [DeepSeek Harness adoption and cloud-first plan](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/DEEPSEEK-HARNESS-ADOPTION-AND-CLOUD-FIRST-PLAN.md)
- [Pool Supervisor and Recovery Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/architecture/GITHUB-POOL-SUPERVISOR-AND-RECOVERY.md)
- [DSH cloud-first bootstrap report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/reports/2026-11-04-deepseek-harness-cloud-first-bootstrap.md)
- [Supervisor implementation report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/Основной/docs/reports/2026-11-04-pool-supervisor-implementation.md)
- [Worker input security audit report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/fix/worker-shell-input-escaping-2026-11-04/docs/reports/2026-11-04-pool-worker-input-security-audit.md)
- [Current continuation report](https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/continuation-context-2026-11-04/docs/reports/2026-11-04-sentinelx-control-and-ephemeral-browser-runtime.md)
- [Browser runtime issue #5](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5)

## 6. Current GitHub state — live-checked 2026-11-04

### Repository and branches
- Repository: `VlDMlNSh/developer-cloud-pool`, public, ID `1445644538`.
- Default branch: `Основной`.
- Live-verified default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8` (2026-11-04, after PR #3 merge).
- Relevant branches: `Основной`, `fix/worker-shell-input-escaping-2026-11-04`, `feat/media-intelligence-skills-2026-11-04`, `feat/jarvis-mobile-readonly-shell-2026-11-04`, `fix/pool-owner-approval-guard-2026-11-04`, `docs/continuation-context-2026-11-04`.
- Docs branch is an evidence/continuation branch, not integrated into default. Do not represent documentation branch commits as accepted default-branch implementation.

### Governance
- Ruleset ID `26550182`, name `Основной — verified`, enforcement `active`.
- Exact selector: `refs/heads/Основной`.
- Rules: PR required; 0 required approvals; review thread resolution required; deletion and non-fast-forward prohibited; CODEOWNERS review OFF; extra approval for unattributed changes OFF; bypass actors empty.
- Repository Actions variable `POOL_DISPATCH_ENABLED` read back via SentinelX-hosted `gh`: literal `false`.
- Classic branch-protection endpoint and Ruleset are separate mechanisms; do not treat a classic endpoint's `protected:false` as negating this active Ruleset.
- Never set dispatch true until all governance, review, Worker lifecycle, Resource Probe, DSH and security gates are satisfied.

### PR #3 — Worker shell-input hardening + static validation
- URL: https://github.com/VlDMlNSh/developer-cloud-pool/pull/3
- State CLOSED / MERGED at 2026-11-04T20:17:27Z.
- Merged commit and current default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Head: `7aa5b27b6e826918eeaa6397afe0378d14359022`; exact-head validation run [41881360241](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41881360241) COMPLETED / SUCCESS.
- Validator blob: `cfffb77905406d54505c711504a72ae1fafd3f06`; Worker workflow blob: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`.
- PR review endpoint was empty at merge and remains evidence of no submitted independent review. The Issue #1 acceptance criterion requiring independent review before merge was not met. Record as a process deviation; do not retrospectively claim review, qualification or independent acceptance.
- Static contract CI: VERIFIED for merged head. Integration/acceptance of the broader pool: NOT ACCEPTED.

### PR #4 — Media Intelligence and governed skills design
- URL: https://github.com/VlDMlNSh/developer-cloud-pool/pull/4
- State OPEN, unmerged.
- Branch: `feat/media-intelligence-skills-2026-11-04`.
- Head: `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`.
- Original base: `4597617db0de7cc698cce936a540594ee3d25bf2` (stale relative to current default HEAD `692025e4a039aaf94c6683bb95da38b4f324fce8`).
- Latest recheck: reviews empty; check-runs array empty; no exact-head CI evidence. Status NOT VERIFIED; update/rebase before qualification.
- Design separates research/read-only, editorial/draft-only, publication/write plane and publication verification. Platform connectors (YouTube, Instagram, Telegram, TikTok etc.) require per-platform permission and qualification.
- No skills/plugins installed, no social credentials accessed, no publication, no provider calls. Keep publication DISABLED and profiles out of dispatch allowlist pending security, egress/SSRF, prompt-injection, provenance and platform authorization gates.

### Issues
- [#1 Governance gate](https://github.com/VlDMlNSh/developer-cloud-pool/issues/1): OPEN. Ruleset verified, but current dispatch variable read NOT VERIFIED. Historical acceptance demanded independent review before PR #3 merge; that review was absent at merge, so the criterion was not met.
- [#5 Browser runtime](https://github.com/VlDMlNSh/developer-cloud-pool/issues/5): OPEN; proposed ephemeral GitHub-hosted browser job.
- Issue #2 was previously closed after Ruleset verification; re-check current state if it becomes relevant.

### Latest Actions
- Exact PR #3 static validation run 41881360241: success.
- Earlier intermediate PR #3 validation runs failed due false-positive validator assertions; superseded by exact-head success.
- Supervisor issue-triggered run 41881592336: completed success. This is Supervisor event handling, not a Worker execution or proof that dispatch occurred.
- No Resource Probe, DSH smoke, Worker task, browser task, model call or paid fallback was executed.

## 7. SentinelX and operator tooling

User preference: SentinelX is primary for host control; Desktop Commander only if SentinelX cannot perform a necessary operation.

Last live SentinelX inventory:
- Host ID: `host_5f7264034bdf0b51`.
- Hostname: `Voktors-Mini.Dlink`.
- Agent: `0.23.30`.
- macOS arm64, Darwin 23.6.0.
- Free plan: active limit 1; 1 active / 0 parked / 0 free slots.
- `sentinel_ping`: PASS.
- `sentinel_exec("uname -a")`: PASS.
- Historical `gh variable get POOL_DISPATCH_ENABLED` returned `false`; latest read attempt via SentinelX script_run returned exit code 127/no output, and a preceding attempt had a duplicate session. Current value: NOT VERIFIED. Do not infer from historical evidence.
- `gh api .../rulesets/26550182`: returned active Ruleset with exact selector and no bypass actors.
- Full capabilities calls have intermittently returned `duplicate_session` / `read_loop_ended`; retry safely.
- `node` not in host's allowlisted commands. Do not expand allowlist simply to run one-off tests. SentinelX documents `script_run` for bounded Bash/Python one-off execution.
- Two older enrolled hosts `mh-dev-01` and `mh-dev-02` appear disabled by user in SentinelX; they are not available for operations unless re-enabled through SentinelX UI by owner. Do not attempt to bypass disabled state.
- Mac mini is administrative control only, not cloud runtime. No browser agent installed there.
- Desktop Commander was not used in the last verified pass.

## 8. Important safety and governance constraints

- Keep `POOL_DISPATCH_ENABLED=false`.
- No Worker dispatch until independent PR review, merge, exact default-head checks, resource qualification, DSH smoke and worker lifecycle controls are verified.
- Resource Probe must be read-only and secret-free. DSH smoke must be manual, pinned, isolated, no model calls and no secrets.
- Never run untrusted public PR code on persistent self-hosted/local machines.
- No provider credentials or model calls until provider profiles, budget, quota, egress and provenance are qualified.
- No cross-repository dispatch until GitHub App allowlisting and scoped credentials exist.
- No browser authenticated session persistence by default; no CDP public exposure.
- A passing smoke test is not security qualification. A passing resource probe does not qualify an agent profile.
- Do not make owner intervention a routine dependency; request it only where a genuine authorization/credential/UI gate cannot be handled autonomously.

## 9. Ordered continuation plan

1. Re-read this file and all referenced architecture contracts. Live-check default HEAD, docs branch HEAD, PR #3/#4, Issues #1/#5, Ruleset, Actions variable, exact-head CI, review submissions, current SentinelX hosts and available tools.
2. PR #3: independently inspect full diff and Worker/Supervisor/validator contracts. Obtain a genuinely independent reviewer if available; do not self-approve. If no reviewer exists, record NOT RUN/BLOCKED and continue independent work. Revalidate exact-head CI and integrate only when all gates pass.
3. Run the manual read-only Runner Resource Probe on ephemeral GitHub-hosted `ubuntu-24.04`; record runner image, architecture, CPU, RAM, swap, disk, versions, run/job IDs, output digests and cleanup. Do not install agents or access secrets during this baseline.
4. Review probe evidence; then run DSH headless smoke separately with fixed `@deepseek-ai/dsh@0.2.1-rc.5`, no secrets/model calls and no general-purpose tools. Qualify only that narrow smoke profile if evidence and independent review justify it.
5. Implement Issue #5: isolated agent-browser + Chromium smoke workflow on GitHub-hosted ephemeral runner. Pin package/browser versions, no secrets, one public allowlisted origin, loopback CDP, clean profile, bounded artifacts and provenance. Add browser profile to Worker allowlist only after security review and lifecycle qualification.
6. Design and implement durable task state/checkpoint/resume and lease recovery. Do not claim automatic six-hour continuation until demonstrated with idempotency and recovery tests.
7. Build model/tool profiles incrementally, one profile per measured install/qualification cycle. Use secure model routing with budget/quota limits and no paid fallback unless explicitly approved.
8. Only after gates are accepted, consider dispatch enablement. Never enable it as a convenience or to make a demo work.
9. After each pass: re-read modified files, verify blob SHA, exact-head CI, update dated report and checkpoint; update architecture/README/index when necessary. Keep docs branch distinct from default until PR integration.

## 10. Status vocabulary

- PLANNED — design only.
- DISPATCHED — controller confirmed dispatch with run ID.
- RUNNING — actual execution observed.
- SUCCEEDED — execution terminal result success.
- VERIFIED — evidence and checks establish the specific claim.
- QUALIFIED — representative workload, security controls, cleanup and independent review passed.
- ACCEPTED — authorized integration/release decision completed.
- NOT RUN — no execution.
- BLOCKED — explicit unmet prerequisite.
- FAILED — observed failure.
- NOT VERIFIED — evidence absent, stale or inconclusive.

Never collapse these states into a generic “done”.


## 11. Live continuation update — 2026-11-04 21:17 Europe/Vilnius

This section supersedes older live-state snapshots above where the live API now differs.

- Default branch HEAD remains `4597617db0de7cc698cce936a540594ee3d25bf2`.
- Active Ruleset 26550182 re-read successfully: exact selector `refs/heads/Основной`, active enforcement, PR required, no bypass actors.
- Issue #1 and Issue #5 remain OPEN.
- PR #3 remains OPEN/unmerged at head `7aa5b27b6e826918eeaa6397afe0378d14359022`. Exact-head run 41881360241 / job 126754359530 is COMPLETED/SUCCESS. The reviews endpoint returned an empty array; independent review remains NOT RUN. Do not merge.
- PR #4 remains OPEN/unmerged at head `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`. Exact-head check-runs and workflow-runs are empty; reviews are empty. NOT VERIFIED.
- The PR #3 description contains stale head/run prose; live PR metadata and exact-head check-run endpoint are authoritative.
- Current direct readback of `POOL_DISPATCH_ENABLED` was unavailable through the read-only GitHub interface. Prior SentinelX/GitHub CLI readback and the exact-head CI log recorded `false`, but this pass labels current value NOT RECHECKED. No mutation was attempted.
- SentinelX inventory showed one operational host `host_5f7264034bdf0b51`, `Voktors-Mini.Dlink`, agent `0.23.30`; Free plan capacity is 1/1 active. A subsequent capabilities call returned `agent_disconnected/read_loop_ended`; host operations must wait for successful ping/capability retry. Disabled legacy hosts remain unavailable.
- Agent-browser upstream documentation was reviewed. Its documented Linux install path is npm-pinned `agent-browser` followed by `agent-browser install --with-deps`; the version-matched usage guide is obtained with `agent-browser skills get core`. npm discovery returned 0.41.1, but release integrity/version provenance must be confirmed before implementation.
- No Worker, DSH, Resource Probe, browser job, package installation, model/provider call, secret access or paid fallback was performed.

Latest report: [2026-11-04 live governance and browser gate audit](../reports/2026-11-04-live-governance-browser-gate-audit.md). Latest checkpoint: [2026-11-04 live checkpoint 21:17](../checkpoints/2026-11-04-live-checkpoint-2117.md).

Next step: obtain genuinely independent review for PR #3; recheck dispatch variable and SentinelX host state; revalidate exact-head CI; after acceptance, execute the separate read-only Resource Probe. Browser workflow implementation remains downstream of these gates.


## 9. Jarvis mobile read-only shell — 2026-11-04

- Feature branch: `feat/jarvis-mobile-readonly-shell-2026-11-04`; PR #6: https://github.com/VlDMlNSh/developer-cloud-pool/pull/6; OPEN / DRAFT / NOT MERGED.
- Latest exact PR head: `2f6e7592dc4d2af4f1c76b28372d9c94354ef591`; base remains default HEAD `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Static UI blobs read back: HTML `bce074dcf508225a5a8eb1662b18c9bc5b1fe54a`; CSS `a2f34bbe13108f9159ec52350c24b23afd2f80eb`; JS `5f66ca7e2a92bcdf78f7fe30e838a4022844baeb`.
- Added validator `scripts/validate-jarvis-dashboard.mjs`, blob `bc74c24f1b9708024f2637a88a7ae6fe7470b98a`, and workflow `.github/workflows/jarvis-static-validation.yml`, blob `62fa96e52355e3d300999ff784029750d1e24864`.
- The validator checks document language/viewport, visible demo boundary, accessible main/skip-link, navigation anchors, local assets, no external assets/inline handlers, responsive CSS/safe-area/reduced motion, and no network/persistent-storage access in the prototype JS.
- Exact-head CI on `2f6e7592dc4d2af4f1c76b28372d9c94354ef591`: Jarvis run `41906629021` SUCCESS; Pool Contract Validation run `41906628978` SUCCESS; push validation run `41906617067` SUCCESS. The successful Jarvis job `126842909650` completed syntax and static contract steps. The successful pool validation job `126842909852` parsed workflows and passed pool security assertions.
- Read-back assertions: 30/30 passed. Earlier intermediate-head static validation failures were corrected; do not treat those superseded runs as current-head failures.
- Independent review remains NOT RUN; browser screenshot/device testing NOT RUN; API/auth/deployment NOT IMPLEMENTED. Do not merge or deploy based on static CI alone.
- The prototype remains offline/static: no API, credentials, task submission, dispatch, approvals, browser control or model calls.
- Latest report: [Jarvis static validation CI](../reports/2026-11-04-jarvis-static-validation-ci.md).
- Latest checkpoint: [Jarvis static validation checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md).
- Next: independent PR review and safe ephemeral browser rendering. Keep pool dispatch disabled until governance and runtime gates are independently verified.


## 10. Owner-bound Pool Supervisor approval guard — 2026-11-04

- Security finding: the prior Supervisor treated `pool:ready` label presence as sufficient dispatch authority, while the issue template only stated that an owner must apply the label. The automation did not verify the label-event sender. No dispatch occurred during discovery.
- Work branch: `fix/pool-owner-approval-guard-2026-11-04`.
- Draft PR #7: https://github.com/VlDMlNSh/developer-cloud-pool/pull/7
- Exact head: `87064dd1d8ec1b31196ee4e940bc0a86cfc299f3`; base `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Added `scripts/pool-approval.mjs` and `scripts/pool-approval.test.mjs`; changed Supervisor to require an owner-originated `issues.labeled` event and a bot-authored approval marker bound to issue/SHA/profile; approval is single-use and revoked when `pool:ready` is removed.
- Added `unlabeled` Supervisor event and CI test step; static pool contract validator asserts the approval guard.
- Exact-head CI run [41908095984](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908095984), job `126848040382`: COMPLETED / SUCCESS. YAML parse, owner-bound approval tests, dispatch-disabled assertion and static pool contract validator all passed.
- Changed file blobs: approval module `9442c413c38dc28c67455362e254ff703bcfedd9`; approval tests `685c5106ea8f7d4b9da4e8f896460cb2dca93d07`; supervisor `1e4e5323121f17caa883ebea24415cd0369cce0f`; contract validator `830d6bd5cfbd3f95e9c319e60764c9c5e9cf6def`; supervisor workflow `18e040f95d1d5c2ae5a2cce69d95109bec83947b`; contract workflow `65d8ada34950290939d8616b3f57ec22632d617e`.
- PR #7 remains OPEN / DRAFT / NOT MERGED; independent review NOT RUN. No live event test with dispatch enabled. Do not merge or enable dispatch from static CI alone.
- Current SentinelX: host `host_5f7264034bdf0b51`; ping PASS; capabilities summary PASS; Free plan 1 active / 0 spare slots. No host job or mutation.
- Latest report: [Owner-bound Pool Supervisor approval guard](../reports/2026-11-04-pool-owner-approval-guard.md).
- Latest checkpoint: [Owner-bound Pool Supervisor approval checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md).
- Next: independent security review PR #7; reconcile Issue #1 history; update PR #4 base and re-run exact-head CI/review. Keep dispatch disabled until all gates are accepted.


## 11. Approval intake while dispatch is disabled — 2026-11-04

- Follow-up review found that the Supervisor exited on `POOL_DISPATCH_ENABLED !== "true"` before calling `recordOwnerApproval()`. Owner label actions performed while dispatch was disabled therefore were not recorded.
- PR #7 now records/rejects the owner-originated `pool:ready` event before the dispatch-disabled exit. The disabled path exits before workflow recovery, stale-claim recovery and Worker dispatch.
- PR #7 head: `8dc7252d8151da2c8f30926c3564074ecaebae92`; base: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Supervisor blob: `85f3997a4be723735d8eab1c06e6a52b938b33d3`.
- Exact-head CI [41908966334](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41908966334), job `126851105703`: SUCCESS; YAML parse, owner approval tests and static contract validator passed.
- PR #7 remains OPEN / DRAFT; independent review NOT RUN.
- Remaining issue: stale-claim expiry and immediate dispatch API failure still transiently restore `pool:ready` after the single-use approval was consumed. Subsequent reconciliation fails closed and moves the issue to review, so approval replay is not enabled, but the state transition/comments are inconsistent. An attempted follow-up write was blocked and these two branches remain unfixed.
- Current `POOL_DISPATCH_ENABLED`: NOT VERIFIED by live read. Do not infer from historical value.
- No Worker, DSH, Resource Probe, browser or model execution was launched.
- Report: [Approval intake while dispatch is disabled](../reports/2026-11-04-approval-intake-disabled-dispatch.md).
- Checkpoint: [Approval intake follow-up checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md).
- Next: fix the two recovery branches with regression tests, exact-head CI, then independent security review. Keep dispatch disabled pending all gates.


## 12. Single-use approval recovery consistency — 2026-11-04

- Corrected stale-claim expiry and immediate workflow-dispatch API failure handling on PR #7. Both paths now remove `pool:claimed` and any stale `pool:ready`, set `pool:needs-review`, and require a fresh owner approval because the prior marker was consumed.
- Added regression assertions to `scripts/pool-approval.test.mjs` that verify both transitions and prohibit restoring `pool:ready` from those recovery paths.
- PR #7 exact head: `d60d26ae647940e702d646e572c861a8f68f523e`; base: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- Blobs: Supervisor `b2046dd9671c6bd5491f63a006d10239fbd3d3b1`; tests `c7c7499d9d2bb4c123e72b86adb85369023c4284`.
- Exact-head CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327), job `126854055084`: SUCCESS, including new recovery regression assertions.
- PR #7 remains OPEN / DRAFT / NOT MERGED; independent security review NOT RUN.
- PR #4 remains stale-base and exact-head CI NOT VERIFIED; inspect its diff/dependencies before retargeting.
- PR #6 static CI SUCCESS; independent review and browser/device validation NOT RUN.
- SentinelX host `host_5f7264034bdf0b51`: ping and capabilities summary PASS, 0 spare Free slots. Read-only dispatch variable check returned duplicate_session/agent_disconnected; `POOL_DISPATCH_ENABLED` remains NOT VERIFIED.
- No Worker, DSH, Resource Probe, browser or model jobs launched; no secrets accessed.
- Report: [Single-use approval recovery fix](../reports/2026-11-04-single-use-approval-recovery-fix.md).
- Checkpoint: [Current live checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md).
- Next: independent security review PR #7, then bounded PR #4 base reconciliation after diff review. Dispatch stays disabled until all gates are independently accepted.



## 13. Worker dispatch authorization boundary audit — 2026-11-04

This section supersedes prior PR #7 acceptance assumptions where they conflict.

- Default HEAD: `692025e4a039aaf94c6683bb95da38b4f324fce8`.
- PR #7 head: `d60d26ae647940e702d646e572c861a8f68f523e`; compare reports 15 commits ahead, 0 behind.
- PR #7 remains OPEN / DRAFT / NOT MERGED.
- PR #7 exact-head static CI [41909811327](https://github.com/VlDMlNSh/developer-cloud-pool/actions/runs/41909811327), job `126854055084`: SUCCESS. This is static evidence only.
- Critical unresolved issue: Worker workflow blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4` is unchanged between default and PR #7. `workflow_dispatch` remains exposed; Worker validates issue open state, `pool:claimed`, SHA and profile, but does not independently prove trusted dispatch provenance or bind authorization to the current workflow run/attempt. Supervisor-only owner approval therefore does not close direct/manual Worker invocation.
- Finding recorded in [PR #7 discussion comment](https://github.com/VlDMlNSh/developer-cloud-pool/pull/7#issuecomment-6641832357), comment ID `6641832357`.
- Formal REQUEST_CHANGES review submission was rejected by GitHub because PR author is repository owner. Independent review remains NOT RUN; discussion comment is not independent review.
- `POOL_DISPATCH_ENABLED`: NOT VERIFIED in this pass; no mutation made. Ruleset and SentinelX state were not rechecked in this bounded pass.
- Worker, DSH, Resource Probe, browser, model/provider execution: NOT RUN. No secrets accessed.
- Dated report: [Worker dispatch authorization boundary audit](../reports/2026-11-04-worker-dispatch-authorization-boundary-audit.md).
- Latest checkpoint: [Worker authorization checkpoint](../checkpoints/2026-11-04-live-checkpoint-jarvis-mobile-shell.md).
- Next: design and implement Worker-side authorization that rejects manual/direct dispatch, binds issue + immutable SHA + profile + workflow run/attempt, and cannot rely on publicly readable issue metadata as a secret. Verify GitHub event provenance semantics first; add positive Supervisor and negative manual-dispatch tests. Keep dispatch disabled and do not execute Worker.
