---
name: Prefer data-driven config over hardcoded literals
description: Bottle types, finding chips, panel summaries, and similar repeated structures should be driven from a config in templates/, not duplicated in component JSX.
type: feedback
---
When a component has repeated structures (multiple bottle cards, multiple chip arrays, multiple routed panels), drive them from a config object in `src/templates/` — don't hardcode them in the component.

**Why:** The renal grossing form had hardcoded `<BottleCard title="Formalin" .../>`, `<BottleCard title="Michel's" .../>`, etc., plus a local `PER_BOTTLE_QA` chips array. That gets tedious to maintain across a design sprint where bottle definitions, panel subtitles, and finding chips are iterated frequently.

**How to apply:**
- The renal IDF config lives in `src/templates/renalIdf.ts`. Look at `RENAL_BOTTLE_DEFINITIONS`, `RENAL_BOTTLE_QA_FINDINGS` for the pattern.
- A `RenalBottleDefinition` carries: `key`, `label`, `fragmentSingular`/`Plural`, `itemKey` (QA join key), `primaryProcedureKey` (where measurements/descriptors/notes get stored), `routedTiles` (panel summaries shown beneath), `isDefault`, `isRenameable`.
- A `RenalRoutedTile` carries `procedureKey`, `title`, `subtitle`, `inputKind` (`'none'` for static panel, `'pieces'` for a number input), and unit labels.
- New bottle types, new finding chips, or new panel summaries go in the template, not the form.
- Same applies to anything else that repeats (descriptor lists, validation rules, route keywords). Default to: if it's a list of similar things, it belongs in `src/templates/`.
