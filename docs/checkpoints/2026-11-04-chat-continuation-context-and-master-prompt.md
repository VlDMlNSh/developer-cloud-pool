# Контекст продолжения Developer Cloud Pool — 2026-11-04

## Назначение и границы проекта

Этот документ переносит контекст текущей серии чатов в новый чат. Рабочий проект — **Developer Cloud Pool**, репозиторий https://github.com/VlDMlNSh/developer-cloud-pool. Не смешивать его с MediaHub OS или репозиторием mediahub-os.

Цель: безопасный, доказуемый облачный пул инженерных исполнителей на GitHub Actions с эфемерными GitHub-hosted runners, ограниченным dispatch, аудитом, provenance, изоляцией секретов, безопасной маршрутизацией моделей и возобновляемыми квотами. Никаких платных fallback без отдельного разрешения. Серверы не являются частью текущего облачного контура; Ollama — архитектурный вариант, а не команда скачать модель или запускать локальный GPU inference.

Пользователь предпочитает автономную работу с минимальным вмешательством владельца. Не просить подтверждение для каждого безопасного read-only шага. Но техническая возможность не означает разрешение: не обходить governance, issuer/capability, ограничения секретов и бюджетов.

## Репозиторий: подтверждённое состояние на момент сохранения

- Репозиторий: https://github.com/VlDMlNSh/developer-cloud-pool
- Repository ID: `1445644538`
- Default branch: `Основной`
- Default HEAD при проверке: `4597617db0de7cc698cce936a540594ee3d25bf2`
- Ветка `Основной` API-ответом возвращена как `protected: false`. Это не исключает действие Rulesets, но классическая branch protection этим ответом не подтверждается.
- Владелец имеет admin permission по данным repository metadata.

## Governance — главный текущий блокер

### Issue #1

https://github.com/VlDMlNSh/developer-cloud-pool/issues/1

Владелец оставил комментарий, что branch protection создана: PR required ON, approvals 0, force-push block ON, deletion prevention ON, required checks OFF, `POOL_DISPATCH_ENABLED` не включён.

### Issue #2

https://github.com/VlDMlNSh/developer-cloud-pool/issues/2

Владелец сообщил, что Ruleset исправлен и теперь нацелен на `Основной`, CODEOWNERS review и extra approval выключены. Повторная независимая проверка API показала обратное.

### Последняя фактическая API-проверка

Ruleset:
https://github.com/VlDMlNSh/developer-cloud-pool/rules/26535481

ID `26535481`, имя `Основной`, target `branch`, enforcement `active`.

Ответ API:
- `conditions.ref_name.include = []`
- `conditions.ref_name.exclude = []`
- rules содержат `deletion` — включено;
- rules содержат `non_fast_forward` — включено;
- `pull_request.required_approving_review_count = 0`;
- `require_code_owner_review = true` — не соответствует заявлению владельца;
- `require_extra_approval_for_unattributed_changes = true` — не соответствует заявлению владельца;
- `required_review_thread_resolution = true`.

Следовательно, фактическая конфигурация НЕ соответствует заявленной. Область применения только к ветке `Основной` также не подтверждена. Не считать Issue #1/#2 закрытыми или governance принятым.

Branch API:
- branch `Основной` HEAD = `4597617db0de7cc698cce936a540594ee3d25bf2`;
- `protected: false`;
- `protection.enabled: false`.
Не делай вывод, что Ruleset не работает только на основании `protected:false`; проверяй ruleset API отдельно.

### Последнее решение по исправлению

Пользователь сообщил, что существующий Ruleset редактировать не может. Предложен безопасный план замены:
1. Создать новый Ruleset с точным branch selector `refs/heads/Основной`.
2. Настроить PR required ON; approvals 0; CODEOWNERS review OFF; extra approval for unattributed changes OFF; deletion restriction ON; non-fast-forward restriction ON; bypass list empty.
3. Активировать новый Ruleset.
4. Независимо прочитать новый Ruleset через API и проверить точные параметры.
5. Проверить, что новая защита действует, и только затем удалить старый Ruleset `26535481`.
6. После удаления повторно прочитать список rulesets и конфигурацию оставшегося правила.

**Критическое условие:** не удалять старый Ruleset до подтверждения нового через API. Не оставлять ветку без защиты даже временно. Если GitHub не позволяет создать параллельный Ruleset с нужными параметрами, остановиться и зафиксировать точную ошибку; не удалять старый наугад.

Пользователь пока не сообщил, что новый Ruleset создан. Создание нового Ruleset и удаление старого ещё НЕ выполнены/НЕ VERIFIED. Доступный GitHub connector имеет GET-only fetch для Rulesets и не предоставляет mutation API для их создания/удаления. Не утверждать, что это сделано. Попросить владельца выполнить только если это остаётся необходимым после повторной проверки текущего состояния.

## Dispatch и безопасность запуска

- `POOL_DISPATCH_ENABLED` должно оставаться unset/false.
- Доступный API-инструментарий не позволил независимо прочитать repository Actions variables. Поэтому состояние переменной NOT VERIFIED; имеется только заявление владельца, что она выключена.
- Не запускать Pool Supervisor dispatch, worker lifecycle, DSH, Resource Probe или model credentials до прохождения governance gates.
- Пустые CI/check-run результаты считать NOT VERIFIED, а не PASS.
- Не запускать платные модели или платный fallback.
- Не выдавать секреты в логи/артефакты.

## Реализованные workflow и supervisor scaffold

Известные файлы:
- `.github/workflows/pool-supervisor.yml`
- `.github/workflows/pool-worker.yml`
- `.github/workflows/dsh-runtime-evaluation.yml`
- `.github/workflows/runner-resource-probe.yml`
- `scripts/pool-supervisor.mjs`

Supervisor поддерживает schedule, issue events, worker workflow completion, workflow_dispatch и reconciliation. Allowlist пока содержит только профиль `dsh-headless-probe`. Это scaffold, а не доказательство готового универсального пула.
Dispatch feature gate: `POOL_DISPATCH_ENABLED` должен быть literal `true`, но оставлять его выключенным до завершения governance.

GitHub-hosted runners эфемерные; не проектировать их как постоянные daemon VM. До 20 логических профилей — это не 20 постоянно работающих машин; concurrency ограничивается доступными квотами GitHub.

## PR #3 — worker input shell safety

https://github.com/VlDMlNSh/developer-cloud-pool/pull/3

- Branch: `fix/worker-shell-input-escaping-2026-11-04`
- Last known head: `9a21c52afae02ac2b446d4ac1b5ae33fbbdad6df`
- Workflow blob SHA: `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`
- Report blob SHA: `a4e05984ee85394fe528b57de3c5d02c67e79ede`
- Fix passes `workflow_dispatch` input through environment variable `TASK_ISSUE`, not directly into Bash source.
- Source inspection: VERIFIED.
- YAML parser/actionlint: NOT RUN.
- Exact-head CI: NOT VERIFIED.
- Independent security review: NOT RUN.
- PR was open at last known check. Recheck live status.

## PR #4 — Media Intelligence / Skills architecture

https://github.com/VlDMlNSh/developer-cloud-pool/pull/4

- Branch: `feat/media-intelligence-skills-2026-11-04`
- Last known head: `ab43af86b63a731202fa0f8fa6f27f009b0d4aac`
- Base: `Основной` at `4597617db0de7cc698cce936a540594ee3d25bf2`
- Architecture blob: `7f51531bfb96c9a990b357553c6439fdc78bf0b8`
- Skills policy blob: `0c504d74e9f4f07b360e551a564bad12174aed48`
- Discovery report blob: `304855fa3c8ca191537672b69e550cefae25f52e`
- Social/publishing report blob: `665bdb77e4a61f12b48fdd69f022cb922b2e97ea`
- README blob: `39d6f1135f258444c762cb60cf030150decee5d9`
- Documentation read-back was VERIFIED.
- Exact-head CI: NOT VERIFIED (zero check contexts / no associated PR workflow runs at last check).
- Independent review: NOT RUN.
- No skills/plugins installed, no workers dispatched, no social credentials, no content published.
- PR was open at last known check. Recheck live status.

### Media Intelligence design

Ten logical profiles:
1. MI-01 Web Reader.
2. MI-02 Search Research.
3. MI-03 Video Metadata.
4. MI-04 Video/Audio Understanding.
5. MI-05 Social Listening.
6. MI-06 Evidence & Fact Check.
7. MI-07 Media QA.
8. MI-08 Editorial & Asset Preparation.
9. MI-09 Publication Orchestrator.
10. MI-10 Publication Verification.

Research is read-only; editorial is draft-only; publishing is an isolated write plane; verification is read-only. Publishing stays DISABLED until platform-specific adapters, rights, scoped credentials, allowlists, idempotency and audit controls qualify. No private account access, DMs, likes, follows, comments, unsolicited outreach, access-control bypass, CAPTCHA bypass, DRM circumvention or platform rate-limit bypass. Platform API references are design research only; real account permissions are NOT VERIFIED.

## Candidate tools and skills

- agent-browser: https://github.com/vercel-labs/agent-browser — candidate only.
- Crawl4AI: https://github.com/unclecode/crawl4ai — candidate only.
- Docling: https://github.com/docling-project/docling — candidate only.
- Whisper: https://github.com/openai/whisper — candidate only.
- FFmpeg — bounded media processing candidate.
- No skill/plugin has been installed or qualified in the pool.
- Skills are instruction packages; runtime plugins are executable code. Both require source review, pinning, provenance and allowlisting.
- Per-job ephemeral install only; no global install on shared runners; no dynamic install based on task/model text.

## Estimates last communicated

Based on the prior partial implementation and outstanding gates:
- First controlled cloud worker launch: 8–14 focused engineering hours.
- Qualified basic cloud pool: 26–47 focused engineering hours.
- Media Intelligence/social research and publication extension: +20–40 hours.
These are engineering-hour estimates, not calendar guarantees. Revise only with new evidence.

## Что делать следующим проходом

1. Повторно проверить repository metadata, default branch HEAD, rulesets list and exact ruleset details, branch API, Issues #1/#2 comments, PR #3/#4 states, exact-head CI, review status.
2. Проверить, не создал ли владелец новый Ruleset после последнего сообщения.
3. Если новый Ruleset есть — проверить exact selector, active enforcement, all required rules and absence of bypass; только после этого проверить возможность безопасного удаления старого.
4. Если нового Ruleset нет, connector не может создавать/удалять Rulesets. Не имитировать такую операцию; дать владельцу краткую точную инструкцию, если действие действительно требуется.
5. Не включать dispatch; Actions variable остаётся NOT VERIFIED до доступного подтверждения.
6. Продолжать безопасную независимую работу: read-only аудит контрактов, статическая проверка YAML/workflow без запуска рабочих jobs, тесты локально/в безопасной ветке, если среда позволяет.
7. Не делать merge PR #3/#4 без актуальных CI, review и governance evidence.
8. После каждого изменения перечитать файлы и проверить blob SHA; фиксировать dated report и checkpoint.
9. Статусы использовать строго: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

---

# Мастер-промт для нового чата

Ты продолжаешь работу над **Developer Cloud Pool**. Рабочий репозиторий: https://github.com/VlDMlNSh/developer-cloud-pool. Не смешивай его с MediaHub OS.

Работай автономно и доказательно. В начале каждого `/next` заново проверь live GitHub refs/HEAD/SHA, Issues #1/#2, PR #3/#4, rulesets, branch protection, exact-head CI, reviews и доступность исполнителей. Не полагайся на этот документ как на актуальное состояние GitHub — это checkpoint предыдущего прохода.

Сначала прочитай этот checkpoint:
https://github.com/VlDMlNSh/developer-cloud-pool/blob/docs/continuation-context-2026-11-04/docs/checkpoints/2026-11-04-chat-continuation-context-and-master-prompt.md

Затем изучи текущие workflow и supervisor contracts, прежде чем менять код.

Главный текущий блокер — governance. Последняя API-проверка показала Ruleset #26535481 активным, но с пустыми ref include/exclude, `require_code_owner_review=true` и `require_extra_approval_for_unattributed_changes=true`, несмотря на комментарий владельца об отключении этих настроек. Владелец сказал, что редактировать старый Ruleset не может, поэтому обсуждается создание нового корректного Ruleset, его независимая API-проверка и только затем удаление старого. Никогда не удаляй старый Ruleset до доказанного действия нового; не допускай окна без защиты. Проверь, не появился ли новый Ruleset с момента checkpoint.

`POOL_DISPATCH_ENABLED` держать unset/false. Его фактическое значение через доступный API не подтверждено. Не запускать worker, DSH, Resource Probe, модельные вызовы или платный fallback, пока governance и все необходимые gates не VERIFIED.

Продолжай безопасные read-only и статические задачи, не простаивай из-за одного блокера. PR #3 и PR #4 проверить заново; не сливать без актуального CI и независимого review. Пустой CI/review — NOT VERIFIED, не PASS.

Цель проекта: безопасный cloud engineering pool на эфемерных GitHub-hosted runners, с ограниченными профилями, event-driven supervisor, безопасной маршрутизацией моделей, возобновляемыми квотами, provenance, аудитом и изоляцией секретов. До 20 профилей — логические профили/динамические слоты, не 20 постоянных VM. Не устанавливай зависимости глобально на shared runners; используй pinned provenance и ephemeral per-job installs. Не смешивай research/read-only и publishing/write permissions.

Сохраняй исторические evidence, не переписывай неизвестное состояние как успех. После каждого прохода перечитай изменённые файлы, проверь blob SHA и exact-head CI; создай датированный отчёт и обнови checkpoint при существенных изменениях. Указывай commit/blob SHA, проверки, блокеры и следующий шаг. В конце каждого `/next` дай прямые ссылки и один следующий полезный шаг. Если требуется действие владельца, добавь в самом конце отдельный блок с жирным заголовком БОЛЬШИМИ БУКВАМИ, точными пошаговыми инструкциями, ссылками, копируемым текстом и ожидаемым результатом. Если действие владельца не требуется, такой блок не добавляй.

Не заявляй о dispatch, запуске, тестировании, квалификации или приёмке без соответствующих доказательств. Статусы различай строго: PLANNED, DISPATCHED, RUNNING, SUCCEEDED, VERIFIED, QUALIFIED, ACCEPTED, NOT RUN, BLOCKED, FAILED, NOT VERIFIED.

Начни с повторной проверки governance и актуального GitHub состояния, затем выполни один ограниченный и максимально полезный безопасный проход.


---

## Addendum — live governance recheck, 2026-11-04 17:26 +03:00

Detailed evidence report: [Ruleset governance recheck](../reports/2026-11-04-ruleset-governance-recheck.md).

Live API recheck confirms the previous blocker remains:
- Only Ruleset `26535481` exists; enforcement is active.
- `conditions.ref_name.include=[]` and `exclude=[]`; exact `refs/heads/Основной` targeting is not demonstrated.
- `require_code_owner_review=true` and `require_extra_approval_for_unattributed_changes=true`, contrary to the owner comment in Issue #2.
- Deletion and non-fast-forward restrictions are enabled; bypass actor list is empty.
- Default branch `Основной` remains at `4597617db0de7cc698cce936a540594ee3d25bf2`; branch API still reports `protected=false`.
- `POOL_DISPATCH_ENABLED` remains NOT VERIFIED because repository Actions variables are not readable through the available integration. Keep it unset/false.
- PR #3 and #4 remain open. Both have zero exact-head check runs, zero associated workflow runs and no review submissions.
- Default-branch check-runs contain two successful supervisor reconciliation checks, but combined status is pending with zero status contexts. These checks do not qualify a worker or runtime profile.
- PR #3's proposed worker workflow fix was re-read at blob `fe1ee4c41a86807810a6b6bc85c677b46c3cebb4`; shell summary uses `TASK_ISSUE` from environment. Exact-head CI and independent review remain NOT VERIFIED.

No worker, DSH, Resource Probe, model call, dispatch, Ruleset mutation or PR merge was performed.

### Updated next step

The connected GitHub interface exposes Ruleset GET only, not create/update/delete. Owner-side creation of a replacement Ruleset is therefore required. Keep Ruleset `26535481` active until a new active Ruleset has been independently read back and verified with exact selector `refs/heads/Основной`, PR required, approvals 0, CODEOWNERS review OFF, unattributed-change extra approval OFF, deletion and non-fast-forward restrictions ON, and no bypass actors. Only then may the old Ruleset be removed and the resulting inventory re-read.

Continue safe static/documentation work on this evidence branch while the governance gate is blocked. This addendum and report are on `docs/continuation-context-2026-11-04`, not on canonical default branch `Основной`; they are documentation work in progress and are not accepted into the default branch.
