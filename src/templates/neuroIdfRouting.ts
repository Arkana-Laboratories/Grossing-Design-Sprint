import type { KeywordRoute } from './renalIdfRouting';

export type NeuroSpecimenKey = 'specimenA' | 'specimenB';

// Section-switch keywords for neuro. Bottle words (formalin / glute / fresh)
// are intentionally NOT routes here — in the Neuro IDF they describe fields
// inside the active specimen, not which specimen to switch to. (Phase 2:
// add fieldHint routes for bottle words.)
const FIXED_NEURO_ROUTES: KeywordRoute<NeuroSpecimenKey>[] = [
  { keyword: 'specimen a',      targets: ['specimenA'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'specimen one',    targets: ['specimenA'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'first specimen',  targets: ['specimenA'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'specimen b',      targets: ['specimenB'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'specimen two',    targets: ['specimenB'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'second specimen', targets: ['specimenB'], priority: 100, matchType: 'phrase', source: 'explicit' },
];

export function buildNeuroRoutes(): KeywordRoute<NeuroSpecimenKey>[] {
  return [...FIXED_NEURO_ROUTES].sort((a, b) => b.priority - a.priority);
}

export const NEURO_DEFAULT_TARGET: NeuroSpecimenKey = 'specimenA';

export function humanLabelForNeuroTarget(target: NeuroSpecimenKey): string {
  return target === 'specimenA' ? 'Specimen A' : 'Specimen B';
}
