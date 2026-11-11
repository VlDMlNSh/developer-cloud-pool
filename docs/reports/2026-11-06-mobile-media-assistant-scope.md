# Engineering report — 2026-11-06: Mobile Developer AI media-assistant scope

## Immutable baseline

- Repository: https://github.com/VlDMlNSh/developer-cloud-pool
- Default branch: `Основной`
- Target base SHA: `64d2636d4500127e635c214ccfb722c6b3fcda80`
- Mobile feature issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/21
- Primary web-console issue: https://github.com/VlDMlNSh/developer-cloud-pool/issues/22
- Related Media Intelligence design: https://github.com/VlDMlNSh/developer-cloud-pool/pull/4

## Owner priority

1. Secure remote web console for the running pool, usable from desktop and iPhone browser.
2. Native iOS Developer Mobile AI and Media Assistant.
3. External owner-operated server integration.

This report records design scope only. It does not reorder or delay the web-first milestone.

## Work recorded

Expanded Issue #21 from a task-preparation mobile node into a broader local Media Assistant scope:

- Media intake and classification for explicitly user-selected images, video, audio, documents and text.
- Metadata extraction, OCR/transcription/scene summaries where authorized and supported, confidence labeling, tagging, collections and duplicate detection.
- Mobile media workspace, user-controlled import/preview/organization/export, project presets and reusable user-provided style instructions.
- Image-generation assistance: prompt construction, variants, constraints, reference preparation and generation settings.
- Instruction/document authoring: briefs, procedures, checklists, production plans, scripts, captions and metadata.
- Video assistance: concept, script, shot list, storyboard, timing, voiceover/captions and editing instructions.
- Optional qualified image/video generation providers and cloud media workers, without assuming full media generation runs locally on iPhone.
- Provenance, explicit data-transfer consent, original/derived asset separation, and Pool Bridge-only delegation.

## Architecture boundaries

- On-device: lightweight metadata, hashing, feasible classification, prompt/instruction/storyboard drafting and offline drafts.
- Qualified cloud route: heavy OCR/transcription/media analysis, rendering and image/video generation where device benchmarks do not justify local execution.
- Mobile app has no provider keys, PATs, GitHub App private keys or privileged workflow tokens.
- The app cannot dispatch, approve, publish, mint capabilities or change governance.
- Media research, editorial preparation and publication remain separate capability classes. Publication remains disabled until its independent gates pass.
- User-selected media only; no background media-library scraping or automatic upload.
- Explicit confirmation before media leaves the device; preserve rights, consent and source provenance.

## Reuse-before-build review

The existing [Media Intelligence and Skills Architecture](https://github.com/VlDMlNSh/developer-cloud-pool/pull/4) already defines useful cloud-side media capabilities: Docling, Whisper, FFmpeg/OCR, media QA, editorial preparation, platform-specific source handling and separated publication authority. Reuse these as candidates and contracts; do not duplicate the cloud media pipeline inside the iOS app.

PR #4 remains OPEN / NOT MERGED / NOT QUALIFIED. Its candidate components are not installed or accepted as operational dependencies. Any mobile SDK/runtime selection requires a separate maintained-project, license, iOS compatibility, privacy and device-performance evaluation.

## Verification

- Issue #21 body expanded and title updated: VERIFIED by GitHub read-back.
- This report branch is documentation-only and is based on immutable default SHA `64d2636d4500127e635c214ccfb722c6b3fcda80`.
- No application code, provider credentials, model calls, media uploads, generation jobs, publication or dispatch were performed.
- No iOS runtime or media provider has been selected or qualified.
- Mobile implementation: NOT STARTED.
- Local inference: NOT IMPLEMENTED / NOT QUALIFIED.
- Image/video generation integration: NOT IMPLEMENTED / NOT QUALIFIED.
- Independent review and exact-head CI: pending PR creation.

## Next step

Complete the web-first Experience API/authentication architecture in Issue #22. In parallel, keep this mobile issue design-only; after web-console acceptance, qualify a small offline iOS prototype for local media metadata/classification and prompt/instruction/storyboard assistance before adding cloud generation adapters.
