import type { RenalProcedureKey } from './renalIdf';

export type RouteSourceKind = 'explicit' | 'bottle' | 'inherit' | 'default';

export interface KeywordRoute<TargetKey extends string = string> {
  keyword: string;
  targets: TargetKey[];
  priority: number;
  matchType: 'phrase' | 'exact';
  source: RouteSourceKind;
}

const GLUTE_RE = /\bglut(araldehyde|e)?\b/i;

export function transcriptHasGlute(transcript: string): boolean {
  return GLUTE_RE.test(transcript);
}

const FIXED_EXPLICIT_ROUTES: KeywordRoute<RenalProcedureKey>[] = [
  { keyword: 'light microscopy', targets: ['lightMicroscopy'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'lm',                targets: ['lightMicroscopy'], priority: 100, matchType: 'exact',  source: 'explicit' },
  { keyword: 'electron microscopy', targets: ['electronMicroscopy'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'em',                targets: ['electronMicroscopy'], priority: 100, matchType: 'exact',  source: 'explicit' },
  { keyword: 'immunofluorescence', targets: ['immunofluorescence'], priority: 100, matchType: 'phrase', source: 'explicit' },
  { keyword: 'if',                targets: ['immunofluorescence'], priority: 100, matchType: 'exact',  source: 'explicit' },
];

const FIXED_BOTTLE_ROUTES: KeywordRoute<RenalProcedureKey>[] = [
  { keyword: "michel's",       targets: ['immunofluorescence'], priority: 50, matchType: 'phrase', source: 'bottle' },
  { keyword: 'michel',         targets: ['immunofluorescence'], priority: 50, matchType: 'phrase', source: 'bottle' },
  { keyword: 'michels',        targets: ['immunofluorescence'], priority: 50, matchType: 'phrase', source: 'bottle' },
  { keyword: 'glutaraldehyde', targets: ['electronMicroscopy'], priority: 50, matchType: 'phrase', source: 'bottle' },
  { keyword: 'glute',          targets: ['electronMicroscopy'], priority: 50, matchType: 'phrase', source: 'bottle' },
];

export function buildRenalRoutes(transcript: string): KeywordRoute<RenalProcedureKey>[] {
  const formalinTargets: RenalProcedureKey[] = transcriptHasGlute(transcript)
    ? ['lightMicroscopy']
    : ['lightMicroscopy', 'electronMicroscopy'];

  const formalinRoute: KeywordRoute<RenalProcedureKey> = {
    keyword: 'formalin',
    targets: formalinTargets,
    priority: 50,
    matchType: 'phrase',
    source: 'bottle',
  };

  return [...FIXED_EXPLICIT_ROUTES, ...FIXED_BOTTLE_ROUTES, formalinRoute].sort(
    (a, b) => b.priority - a.priority,
  );
}

export const RENAL_DEFAULT_TARGET: RenalProcedureKey = 'lightMicroscopy';
