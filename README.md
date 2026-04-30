# Cortex Grossing — Design Sprint

A clickable Vite + React + TypeScript prototype for the renal pathology grossing workflow at Arkana Labs. Used to evaluate UX directions for the IDF (Internal Data Form) ahead of production build.

> **Not production.** Backend is `src/mock/data.ts`. PHI in this repo is fabricated.

## Quick start

```bash
npm install
npm run dev
```

Open the printed URL (Vite picks the next free port from 5173).

## Demo flow

| Path | What it shows |
| --- | --- |
| `/` | Landing |
| `/search` | Case search |
| `/gross` | Start grossing — scan a barcode or input accession |
| `/case/S26-12500/gross` | **Editable IDF form** — bottle-centric, dictation, per-piece descriptors |
| `/case/S26-12500/gross/view` | **Read-only frozen snapshot** of the submitted IDF |
| `/case/S26-12500/summary` | Post-submit case summary |
| `/case/S26-12500/em-final` | EM Final view |

Try `S26-12500`, `S26-12533`, or `S26-12555`. Use the preset selector in the top bar to load demo dictation transcripts.

## Key concepts

- **Bottle-centric form.** Default cards are Formalin and Michel's; "+ Add bottle" adds an optional Glutaraldehyde card with an editable name. Each card holds: bottle count, received-condition findings, per-piece measurements with per-row descriptors, notes, and a "Routes to" tray showing the downstream panels (LM / IF / EM).
- **Per-piece descriptors.** Each measurement row has its own descriptor chips (tan, fatty, thin, …) rather than one shared list per bottle. Storage format `2@0.5×0.1×0.1[tan,fatty]`. Auto-`thin` detection fires when any dimension is < 0.1 cm.
- **Snapshot-based read-only view.** Submitting freezes a deep clone of the IDF state in `localStorage`. `/gross/view` reads from that snapshot only — further edits to the live form don't mutate it. Anyone (e.g. a reviewing physician) can open the read-only URL after the grosser submits.
- **Dictation.** Mic input is faked by typing out a preset transcript. Bottle keywords (`formalin`, `michel's`, `glute`) route the parsed measurements to the matching bottle card.

## Project structure

```
src/
├─ routes/              Page-level routes (Grossing, GrossingView, CaseSummary, EmFinal, …)
├─ components/
│  ├─ RenalIdfForm.tsx       editable form, driven by config
│  ├─ MeasurementList.tsx    vertical 2-col layout w/ per-row descriptors
│  ├─ IdfReadonlyView.tsx    snapshot rendering
│  ├─ DescriptorChips.tsx    chip rack (supports `hideLabel` for inline use)
│  └─ ui/                    Card, Button, Tag primitives
├─ templates/
│  ├─ renalIdf.ts            bottle definitions, finding chips, panel summaries — single source of truth
│  ├─ neuroIdf.ts            (untouched in current sprints)
│  └─ descriptors.ts         tissue descriptor union + chip list
├─ lib/
│  ├─ measurements.ts        canonical Measurement type, parse/serialize, smart-split
│  ├─ parseDictation.ts      speech → measurement strings
│  └─ routeDictation.ts      bottle keyword → procedure routing
├─ state/CaseSessionContext  live editable session + submitted snapshots (localStorage)
└─ mock/                     fake cases, materials, panels
```

## Conventions

- **Single source of truth for bottles, findings, panels:** `src/templates/renalIdf.ts`. Add a bottle type or finding chip there, not in JSX.
- **Terminology:** "Ends" is EM-only; everything else is "pieces" / "pcs".
- **PIF (Problem-In-Field):** chips removed from the editable form UI. Data model fields (`isPif`, `pifReason`) are still rendered in the read-only view for old snapshots.
- **Renal only.** Neuro form (`NeuroIdfForm.tsx`) has not been migrated and has one pre-existing tsc error.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | tsc project build + Vite production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Working with Claude Code

This repo includes a `CLAUDE.md` primer at the root and longer-form notes under `.claude/memory/`. If you use Claude Code, that context auto-loads — see `.claude/memory/MEMORY.md` for the index of project decisions, conventions, and file pointers.
