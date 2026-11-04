# Engineering report — 2026-11-04: Jarvis hybrid platform design

## Scope
A bounded architecture and component-selection pass for Developer Cloud Pool. This is a separate project from MediaHub OS.

## Repository baseline
- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: Основной
- Branch protection: disabled at time of inspection
- Baseline HEAD before this pass: de860cb9f61b998713ae1bbf4fc3b48908a0e004
- Actions workflow runs at inspection: 0
- Existing resource probe: IMPLEMENTED, NOT RUN

## Work completed
1. Researched current GitHub-hosted runner specifications and concurrency limits.
2. Researched candidate agent runtimes, model gateway, orchestration, browser automation, crawling, document ingestion, vector retrieval, private networking and observability.
3. Designed the placement of responsibilities across three local nodes:
   - L1 Mac mini Server 2011: lightweight utility, secondary worker and backup target after disk verification.
   - L2 Mac mini 2018: control plane, PostgreSQL/pgvector, LangGraph, gateway and durable state.
   - L3 remote GPU server: Ollama, embeddings, reranking and GPU workloads.
4. Designed 20 elastic cloud job classes, avoiding permanent slot reservations.
5. Added security boundaries for public PR workflows, local task leases, short-lived GitHub App credentials, provider routing, audit and evidence.
6. Added deployment order and six qualification gates.
7. Updated README to link the new reference architecture.

## GitHub evidence
- Architecture document commit: 9c84e30aea4fb1fd1244c09878969e27d195925b
- Architecture document blob SHA: 31523c147d0a002b3bf82c87a0f6e8165f9a3396
- README update commit: dafde1e7eab188a0f4c2d94d7354fd4bcf4a644a
- README blob SHA after update: d5e9b0172826a90712bb834a476c9e150be85985
- Expected current HEAD after this report commit: this report commit SHA will be captured after creation.

## Decisions
- LangGraph + PostgreSQL is the initial agent orchestration and persistence baseline.
- PostgreSQL + pgvector is the initial memory/retrieval baseline; Qdrant is deferred until benchmarks justify another stateful service.
- LiteLLM is the model gateway candidate, with PostgreSQL-backed budget enforcement required. Paid fallback remains disabled unless separately approved.
- Ollama model weights belong on the GPU server, not on the 14 GB ephemeral GitHub Runner.
- SearXNG + Crawl4AI are the first self-hosted research/crawl candidates.
- Docling is the first document parsing candidate; fallback parsers and OCR are added only when tests require them.
- agent-browser + Chromium and Playwright remain separate profiles.
- Persistent local machines are not exposed as self-hosted runners to untrusted public PR code.
- Redis, Temporal, n8n and Qdrant are conditional additions, not default dependencies.

## Status
- Research: COMPLETED for this design pass; candidate evaluation is preliminary.
- Architecture: DOCUMENTED / PROPOSED.
- GitHub documentation commits: CREATED.
- Resource probe: NOT RUN.
- Local host inventory: NOT RUN.
- Component installation: NOT RUN.
- Pool Bridge implementation: NOT RUN.
- Agent profile qualification: NOT RUN.
- End-to-end acceptance: NOT RUN.

## Constraints and blockers
- Actual CPU/RAM/disk/network/GPU facts for the three local hosts are not yet verified.
- Exact SentinelX host IDs, capabilities and allowlists have not been inspected in this pass.
- Runner resource probe has no recorded workflow run.
- No service deployment or provider credential configuration was performed.
- Default branch is unprotected; production dispatch should remain blocked until branch governance and workflow security gates are established.

## Next step
1. Run the existing read-only GitHub Runner Resource Probe.
2. Perform read-only inventory of L1/L2/L3 using exact enrolled host IDs and approved capabilities.
3. Qualify L2 disk, network and backup/restore before installing stateful services.
4. Do not install the complete stack until the host inventory and resource probe are reviewed.

## Research sources
- GitHub runner specs: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
- GitHub Actions limits: https://docs.github.com/en/actions/reference/limits
- GitHub secure use: https://docs.github.com/en/actions/reference/security/secure-use
- OpenHands SDK architecture: https://github.com/OpenHands/docs/blob/main/sdk/arch/overview.mdx
- Goose extensions: https://goose-docs.ai/docs/getting-started/using-extensions/
- agent-browser skills: https://agent-browser.dev/skills
- LiteLLM request architecture: https://docs.litellm.ai/docs/proxy/architecture
- LiteLLM budgets: https://docs.litellm.ai/docs/proxy/users
- Ollama OpenAI compatibility: https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx
- LangGraph persistence: https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/persistence.mdx
- SearXNG: https://docs.searxng.org/
- Crawl4AI: https://docs.crawl4ai.com/
- Docling: https://github.com/docling-project/docling
- Qdrant hybrid search: https://qdrant.tech/documentation/hybrid-queries/
- Tailscale access control: https://tailscale.com/docs/features/access-control/grants
- Apple Mac mini Server 2011: https://support.apple.com/en-vn/112006
- Apple Mac mini 2018: https://support.apple.com/en-ie/111912
