---
name: IDF system — key files
description: Where the renal grossing IDF data, form, snapshot, and readonly view live, and what each owns.
type: reference
---
When working on the IDF flow, these are the files that matter and what each one owns. Verify file paths still exist before relying on them — files may have been renamed or moved.

**Templates / data shape**
- `src/templates/renalIdf.ts` — `RenalIdfState`, `BottleCounts`, `RENAL_BOTTLE_DEFINITIONS`, `RENAL_BOTTLE_QA_FINDINGS`, `RENAL_PROCEDURE_ROWS`, plus the empty-state factory. Edit this for any bottle / chip / panel-subtitle change.
- `src/templates/neuroIdf.ts` — neuro counterpart (untouched in renal-only sprints).
- `src/templates/descriptors.ts` — `TissueDescriptor` union and `TISSUE_DESCRIPTORS` chip list.

**Measurement library**
- `src/lib/measurements.ts` — canonical `Measurement` type with per-row `descriptors: string[]`. Storage format `count@LxWxD[d1,d2]`. `parse`/`serialize`/`splitSegments` are bracket-aware.
- `src/lib/parseDictation.ts` — speech-to-string conversion ("two at zero point five..." → `2@0.5×0.1×0.1`).
- `src/lib/routeDictation.ts` — keyword routing (formalin/michel's/glute → procedure key); `applyToRenal` joins routed measurements onto procedure state.

**Editable form**
- `src/routes/Grossing.tsx` — route shell.
- `src/components/RenalIdfForm.tsx` — the form. Bottle cards are mapped from `RENAL_BOTTLE_DEFINITIONS`. Findings live in card header. No-tissue chip hides measurements/descriptors/routed tiles.
- `src/components/MeasurementList.tsx` — vertical 2-col layout with per-row descriptors. Auto-adds `'thin'` on add when a dim is < 0.1.
- `src/components/DescriptorChips.tsx` — chip rack; supports `hideLabel` for inline use.

**Snapshot system**
- `src/state/CaseSessionContext.tsx` — `submitIdf()` deep-clones the live IDF and stores it under `cortex.submittedIdfs` in localStorage. `getSubmittedIdf(accession)` reads it. The live editable session and the frozen snapshot are independent.

**Readonly views (consume snapshot OR live session, depending)**
- `src/components/IdfReadonlyView.tsx` — `RenalReadonlyView` / `NeuroReadonlyView` / `SummaryRow`. Per-measurement display with per-row descriptors; falls back to bottle-level `procedure.descriptors` chip cloud for old snapshots.
- `src/routes/GrossingView.tsx` — reads only from the snapshot.
- `src/routes/CaseSummary.tsx`, `src/routes/EmFinal.tsx` — currently read from the live session, not the snapshot. Flag this if they need to be frozen too.
