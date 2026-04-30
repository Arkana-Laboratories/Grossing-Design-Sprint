# Cortex Grossing — design sprint prototype

Vite/React/TypeScript prototype for the renal pathology grossing IDF (Internal Data Form) at Arkana Labs. UX evaluation, not production.

## Run

```bash
npm install
npm run dev
```

Default credentials are bypassed; pick any case from Search or jump directly to a case URL (see Demo paths below).

## Demo paths

- `/` — landing.
- `/gross` — start grossing (scan or input accession).
- `/case/S26-12500/gross` — editable IDF form for that case.
- `/case/S26-12500/gross/view` — read-only frozen snapshot of the IDF (after submit).
- `/case/S26-12500/summary` — case summary post-submit.
- `/case/S26-12500/em-final` — EM Final view.

The snapshot at `/gross/view` is independent of the live editable session — edits to the form do not mutate it. Snapshots are taken on Submit and persisted to `localStorage` under `cortex.submittedIdfs`.

## Architecture orientation

- **Editable form:** `src/components/RenalIdfForm.tsx`. Bottle-centric layout. Default bottle cards are Formalin and Michel's; "+ Add bottle" reveals an optional Glutaraldehyde card with an editable name. Each card has a header row, then `# Bottles [stepper]   Received: [findings chips]`, then measurements / per-row descriptors / notes, then a "Routes to" tray with panel summaries.
- **Data-driven config:** Bottle definitions, finding chips, and routed panel tiles live in `src/templates/renalIdf.ts` (`RENAL_BOTTLE_DEFINITIONS`, `RENAL_BOTTLE_QA_FINDINGS`). The form maps over these — don't hardcode bottle/finding/panel literals in components.
- **Per-piece descriptors:** `Measurement.descriptors` (in `src/lib/measurements.ts`) — each measurement row has its own descriptor chips. Storage format: `2@0.5×0.1×0.1[tan,fatty]`. Backward-compat fallback to bottle-level `procedure.descriptors` is preserved for old snapshots.
- **Snapshot system:** `src/state/CaseSessionContext.tsx`. `submitIdf()` deep-clones the live IDF on submit; `getSubmittedIdf(accession)` reads from localStorage.
- **Readonly views:** `src/components/IdfReadonlyView.tsx` (consumed by `GrossingView.tsx`, `CaseSummary.tsx`, `EmFinal.tsx`).
- **Dictation:** `src/lib/parseDictation.ts` (speech → measurement strings) and `src/lib/routeDictation.ts` (bottle keywords → procedure routing). `RenalIdfForm.handleTranscriptComplete` distributes any procedure-level descriptors from preset patches onto each measurement so per-piece chips render.

## Conventions

- "Ends" terminology is EM-only. Everything else uses "pieces" / "pcs".
- PIF chips have been removed from the editable form UI but remain in the data model and readonly view for old snapshots — leave the fields alone unless explicitly asked to remove them.
- Renal-only so far. `NeuroIdfForm.tsx` is untouched and has a known pre-existing tsc error (`totalPiecesFromMeasurements` not imported) — don't fix as a side effect.

## Deeper context

See `.claude/memory/` for the full project, feedback, and reference notes — including non-obvious decisions and pitfalls. Index at [`.claude/memory/MEMORY.md`](.claude/memory/MEMORY.md).
