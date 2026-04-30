---
name: Grossing Design Sprint — project context
description: What the Cortex Grossing demo is, who it's for, and the key design decisions that have shaped it.
type: project
---
This repo is a Vite/React/TypeScript design-sprint prototype for the renal pathology grossing workflow at Arkana Labs — not a production app. It models the IDF (Internal Data Form) a grosser fills in at the bench.

**Why:** Used to evaluate UX directions for an upcoming Cortex Grossing build. UI fidelity matters more than data correctness; backend is a static `mock/data.ts`. PHI is fake; HIPAA-compliant on Arkana's BAA.

**How to apply:**
- Treat changes as design iterations. Expect the data shape and routing to evolve as the team refines the layout.
- Two top-level pages on the same case:
  - `/case/:accession/gross` — editable IDF form (`Grossing.tsx` → `RenalIdfForm.tsx`).
  - `/case/:accession/gross/view` — read-only frozen snapshot (`GrossingView.tsx`). Independent: edits to the live form do **not** mutate the snapshot. Snapshot taken on Submit, persisted to `localStorage` under `cortex.submittedIdfs`. CaseSummary and EmFinal still render from the live session, not the snapshot — call out if you change that.
- Form architecture has shifted from **procedure-centric** (LM / IF / EM cards) to **bottle-centric** (Formalin / Michel's / optional extra). The underlying `RenalIdfState.procedures` shape (lightMicroscopy / immunofluorescence / electronMicroscopy) is preserved for snapshot back-compat — bottle cards write into the matching procedure under the hood. Don't rename or restructure that state without updating the readonly view's fallback path.
- Per-piece descriptors live on `Measurement.descriptors` (in `lib/measurements.ts`). Storage format: `2@0.5×0.1×0.1[tan,fatty]`. The bottle-level `procedure.descriptors` field is preserved as a backward-compat fallback for old snapshots — don't delete it.
- Renal-only so far. Neuro form (`NeuroIdfForm.tsx`) has not been touched and has a known pre-existing tsc error (`totalPiecesFromMeasurements` not imported). Neuro adapts later.
- "Ends" terminology is EM-only. Everything else uses "pieces" / "pcs". Driven by `bottleKey === 'glutaraldehyde'` or `procedureKey === 'electronMicroscopy'`.
- PIF (Problem-In-Field) chips removed from the editable form UI, but the `isPif`/`pifReason` fields are still in the data model and still render in the readonly view for old snapshots — leave them alone unless explicitly asked.
