# Pass 115 — Spec Kit adoption and llm.asm Reuse First assessment

Date: 2026-11-28  
Target default SHA: 565404f84b6b86afb4dc2d8fa939341f42df6eca  
Branch: docs/pass115-spec-kit-adoption-2026-11-28  
Scope: documentation/specification only; Contour A

## 1. Executive result
- Spec Kit: ADOPT WITH ADAPTATION. Repository-local constitution/templates created; next Controller/API/attested-D1 integration specified.
- Spec Kit CLI: NOT RUN / NOT INSTALLED. No authorized local runtime established; no Python/uv dependency added.
- llm.asm: RESEARCH ONLY / DEFERRED. No clone, build, model download, benchmark or execution.
- No Cloud Pool runtime, controller, D1 migration, workflow permission, dispatch or provider route changed.

## 2. llm.asm upstream assessment
Source: https://github.com/alesha-pro/llm.asm  
License shown upstream: MIT. Repository creation reported 2026-11-25; young project with one primary contributor at review time.

Upstream README describes:
1. Static Linux x86-64 inference executable: 14,712 bytes in FAST_Q8=1.
2. Bare-metal bootable OS image: 24,252 bytes.
3. Mini-GPT trainer executable: 32,944 bytes.

The model weights are not 14 KB. Upstream README lists Qwen3-0.6B Q8_0 .asmbin weights at approximately 613.66 MiB. The small figure describes the executable, not model storage or runtime memory.

Upstream states AVX2/FMA/F16C requirements and reports performance/parity measurements on AMD EPYC 7642. These remain maintainer-reported and were not independently reproduced. Scope is narrow: one model size/family, one quantization, one CPU platform and a limited benchmark set. The README also notes differing prompt-prefill approaches. Treat throughput advantage as a hypothesis pending independent reproducible benchmarks.

### Reuse First
| Component | Decision | Reason |
|---|---|---|
| Linux x86-64 inference engine | DEFER / R&D candidate | Potential CPU benchmark after Contour A; not qualified |
| Qwen3-0.6B Q8_0 weights | DEFER | Separate ~613.66 MiB artifact; provenance, license, memory/RSS and throughput require assessment |
| Bare-metal OS | REJECT for control plane | Experimental environment lacks required network and memory isolation/security controls |
| Mini-GPT trainer | DEFER / educational R&D | Does not address current controller/D1 blocker |
| Assembly kernels | STUDY ONLY | Optimization reference, not a dependency |

No code was copied/vendored/built/executed. No model weights downloaded.

## 3. Spec Kit assessment
Source: https://github.com/github/spec-kit  
License: MIT. Upstream documents constitution, specify, plan, tasks, implement and converge, with optional clarify/analyze/checklist. CLI prerequisites include Python 3.11+ and recommended uv.

Decision: ADAPT process/templates into Cloud Pool; do not install CLI or extensions in this pass. This avoids a new toolchain dependency while retaining project-specific constraints.

## 4. Implemented artifacts
- .specify/memory/constitution.md
- .specify/templates/spec-template.md
- .specify/templates/plan-template.md
- .specify/templates/tasks-template.md
- specs/115-controller-api-d1-composition/spec.md
- specs/115-controller-api-d1-composition/plan.md
- specs/115-controller-api-d1-composition/tasks.md
- docs/architecture/SPEC-KIT-ADOPTION.md

## 5. Baseline and governance
- Default branch: Основной.
- Latest default commit observed via GitHub commit search: 565404f84b6b86afb4dc2d8fa939341f42df6eca.
- PR #183: OPEN; Pass 114 read-only poolctl remains separate and unmerged.
- PR #176: OPEN; controller foundation is read-only and its PR description explicitly excludes D1 composition.
- Combined commit status contexts on default SHA: none returned.
- PR-triggered workflow runs for default SHA: none returned by available query. Empty results do not prove CI passed.
- New branch exact-head CI: NOT RUN at report creation.
- Independent security review: NOT RUN.
- Gemini/Claude: NOT RUN; no controller dispatch or server-3 authorization established.
- No secrets read, D1 writes, provider calls, deployment or merge.

## 6. Metrics
- New runtime dependencies: 0.
- New hosted services: 0.
- Runtime/code changes: 0.
- Spec/plan/task artifacts: 7.
- llm.asm build/benchmark: NOT RUN.
- Spec Kit CLI install: NOT RUN.
- Active engineering time: NOT MEASURED.
- CI on new branch: NOT RUN at report creation.

## 7. Status and next step
- Spec Kit repository-local adoption: VERIFIED as documentation artifacts; CLI NOT RUN.
- llm.asm: RESEARCH ONLY / DEFERRED.
- Controller/API/attested-D1 composition: PLANNED; implementation BLOCKED pending ancestry/schema reconciliation.
- Contour A: BLOCKED / NOT ACCEPTED.
- Contour B: DEFERRED.

Next: use the spec to conduct source-level ancestry/schema overlap across PRs #176–#183 and Pass 110/111; implement only after selecting one compatible canonical path.

## 8. Post-creation verification
- PR #184: OPEN / DRAFT / UNMERGED; branch final commit at verification: 46284f0fbaa9ea17c7659e0bf3b1253f4595b9b9.
- Compare against frozen default base: 12 commits, 12 changed files, 438 additions, 0 deletions; all paths are documentation/specification.
- Eight principal artifacts were fetched back from GitHub and passed static structural assertions: Markdown headers present, no dispatch:true or executionAuthorized:true markers; FR/SEC/AC and scope-exclusion checks passed.
- Existing Pool Contract Validation path filter excludes .specify/**, specs/** and these docs; no exact-head CI run was expected or observed. CI status: NOT RUN, not PASS.
- PR #184 has zero formal reviews and zero review threads at last readback. Independent review NOT RUN.


## Addendum — complete user-supplied llm.asm data captured (2026-11-28)

The following figures and instructions were supplied by the project owner in chat and are preserved here as **user-provided upstream claims**, not independently reproduced measurements:

### Project identity and scope
- Repository: https://github.com/alesha-pro/llm.asm
- Author attribution supplied: Алексей Фатеев (`alesha-pro`).
- Claimed creation date: 2026-11-25; claimed popularity snapshot: approximately 1,800 stars as of 2026-11-27.
- Claimed license: MIT.
- Claimed implementation: three x86-64 assembly projects, no C, libc or third-party runtime dependencies; approximately 17,252 lines of assembly.
- Model scope: Qwen3-0.6B; stated inference format Q8_0; CPU-only benchmark scope on AMD EPYC 7642.

### Binary sizes and behavior
- Linux inference executable: 14,712 bytes with `FAST_Q8=1`.
- Bare-metal OS image: 24,252 bytes; claimed time from boot to chat: 74–94 ms.
- Mini-GPT trainer: approximately 32 KB (user-provided rounded figure; upstream README's more precise figure was recorded separately as 32,944 bytes).
- Chat context: approximately 2,048 tokens before reset, per the supplied description.
- The 14,712-byte figure is the executable size, not model weights. The separately recorded upstream README figure for Qwen3-0.6B Q8_0 weights is approximately 613.66 MiB.

### Performance and parity claims
- Decode: 126.8 tokens/s at 40 CPU threads; 20.7 tokens/s at one thread.
- Claimed advantage over llama.cpp CPU Q8_0: 18–36% across 1–40 threads.
- Claimed bare-metal advantage over Linux llama.cpp: up to 54%.
- Claimed PyTorch FP32 greedy parity: 64/64 tokens; cosine similarity 0.99965.
- All figures above are author/user-supplied claims. No independent reproduction was performed in Pass 115/116; differences in prefill, benchmark harness, thread placement, compiler flags, memory bandwidth and measurement method remain open.

### Platform prerequisites and supplied build procedure
- CPU: x86-64 with AVX2, FMA and F16C; Haswell generation or newer.
- Linux build prerequisites supplied: `nasm` and `binutils`.
- Supplied procedure:

```sh
sudo apt install nasm binutils
git clone https://github.com/alesha-pro/llm.asm
cd llm.asm
python3 scripts/export_weights.py --model-dir models/qwen3-0.6b-bf16 --out models/qwen3-0.6b-q8_0.asmbin --scale-dtype fp16
make inference FAST_Q8=1
./build/asm-llm -m models/qwen3-0.6b-q8_0.asmbin -p "запрос" -n 128 -t 16
make os FAST_Q8=1
make os-run MODEL=models/qwen3-0.6b-q8_0.asmbin SMP=16
```

### Explicit limitations supplied
- One model family/size (Qwen3-0.6B), one stated quantization (Q8_0), one CPU architecture family/platform; no broad model/hardware qualification.
- Author performance measurements are not independently verified.
- Bare-metal OS has no network and no memory protection according to the supplied description; experimental only, not production suitable.
- Context resets around 2,048 tokens.
- No clone, build, model download, benchmark or execution was performed by Cloud Pool in Pass 115/116. The build procedure is recorded for a future isolated R&D evaluation only, after Contour A acceptance.
