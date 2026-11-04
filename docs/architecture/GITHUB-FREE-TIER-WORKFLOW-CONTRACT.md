# GitHub Free-only workflow contract

This repository's execution policy is **zero automatic charges**.

- Repository must remain public for standard GitHub-hosted runner execution to remain free under the current GitHub policy. If visibility changes, stop and revalidate.
- Allowed runner labels are literal standard hosted SKUs: `ubuntu-latest`, `ubuntu-XX.XX`, `windows-latest`, `windows-XX`, `macos-latest`, or `macos-XX`.
- Larger runners, GPU runners, self-hosted runners, runner groups, dynamic runner selection, and custom job images/containers are not permitted by this profile.
- Every job must declare `timeout-minutes` from 1 through 30. Longer work must be split into resumable bounded jobs rather than increasing the ceiling.
- Any matrix must declare `max-parallel` from 1 through 4.
- No paid model/API fallback, automatic provider upgrade, or paid external compute/storage/browser service is permitted.
- GitHub Free does not provide model API credits. Provider routes stay disabled until a free quota is verified independently; exhaustion means queue or `BLOCKED_QUOTA`.
- Standard macOS hosted jobs are allowed on demand for Xcode/Simulator in this public repository; they must remain ephemeral, bounded and concurrency-limited.

The parser rejects duplicate mapping keys, YAML merge keys, and non-scalar mapping keys before loading values; aliases remain supported but cannot introduce ambiguous merged mappings.

The validator is intentionally conservative: unsupported/dynamic runner selection fails closed and requires an explicit policy review before adoption.


## Validation implementation

The policy check uses Ruby Psych to parse the complete YAML document structure, not line-oriented regular expressions. It rejects non-literal runner selectors, custom job/service images, unbounded matrix parallelism, invalid timeouts, enabled paid-fallback flags, and external reusable workflows. Local reusable workflows are resolved recursively and validated as part of the same workflow set. Missing references, invalid YAML and cycles fail closed. The validator is exercised by adversarial Minitest fixtures in `scripts/validate-free-tier-policy-test.rb`.
