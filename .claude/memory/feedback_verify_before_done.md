---
name: Verify before declaring done
description: Don't say work is "done" until it has been actually verified end-to-end — visually checked, type-checked, and audited for the specific issue at hand.
type: feedback
---
Don't tell the user a task is "done" until it really is — verified end-to-end.

**Why:** After the bottle-centric Renal form rewrite, the work was called complete prematurely; a second pass found duplicate "Measurements" and "Descriptors" labels (because `MeasurementList` and `DescriptorChips` already render their own headings — wrapper labels were added on top of them). A 2-minute audit of the rendered page would have caught it before reporting done.

**How to apply:**
- For UI/component work: read every component being composed to know what it renders internally before adding headers/labels around it. Don't trust prop names — open the file.
- After a non-trivial edit, mentally walk through the rendered tree top-to-bottom and check for the specific issue type (duplicate headers, redundant labels, dead state, etc.) before reporting.
- Run `npx tsc -b --noEmit` after rewrites — it catches dangling references and unused props quickly.
- Check the Vite dev server output for HMR errors, not just compile success.
- The bar for "done" is "I have evidence it works correctly," not "I think it should work."
