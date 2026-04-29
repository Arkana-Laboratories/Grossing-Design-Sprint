import {
  parseDictation,
  joinMeasurements,
  totalPiecesFromMeasurements,
  detectThinFromSize,
} from './parseDictation';
import {
  type KeywordRoute,
  buildRenalRoutes,
  RENAL_DEFAULT_TARGET,
} from '../templates/renalIdfRouting';
import {
  buildNeuroRoutes,
  NEURO_DEFAULT_TARGET,
  type NeuroSpecimenKey,
} from '../templates/neuroIdfRouting';
import type { RenalIdfState, RenalProcedureKey } from '../templates/renalIdf';
import type { NeuroIdfState, NeuroSpecimenState } from '../templates/neuroIdf';
import type { TissueDescriptor } from '../templates/descriptors';

export interface Clause {
  keyword: string | null;
  route: KeywordRoute<string> | null;
  body: string;
  sourceText: string;
}

export interface RoutedClause {
  targets: string[];
  measurements: string[];
  sourceKeyword: string | null;
  sourceText: string;
  reason: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function tokenize(
  transcript: string,
  routes: KeywordRoute<string>[],
): Clause[] {
  const trimmed = transcript.trim();
  if (!trimmed) return [];

  const sorted = [...routes].sort((a, b) => b.keyword.length - a.keyword.length);
  const patterns = sorted.map((r) =>
    r.matchType === 'exact'
      ? `\\b${escapeRegex(r.keyword)}\\b`
      : escapeRegex(r.keyword),
  );

  if (patterns.length === 0) {
    return [{ keyword: null, route: null, body: trimmed, sourceText: trimmed }];
  }

  const re = new RegExp(`(${patterns.join('|')})`, 'gi');

  const matches: Array<{
    start: number;
    end: number;
    matchedText: string;
    route: KeywordRoute<string>;
  }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(trimmed)) !== null) {
    const matchedText = m[0];
    const matchedLower = matchedText.toLowerCase();
    const route = sorted.find((r) => r.keyword.toLowerCase() === matchedLower);
    if (route) {
      matches.push({
        start: m.index,
        end: m.index + matchedText.length,
        matchedText,
        route,
      });
    }
  }

  if (matches.length === 0) {
    return [{ keyword: null, route: null, body: trimmed, sourceText: trimmed }];
  }

  const clauses: Clause[] = [];

  const prefix = trimmed.slice(0, matches[0]!.start).trim();
  if (prefix) {
    clauses.push({ keyword: null, route: null, body: prefix, sourceText: prefix });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i]!;
    const next = matches[i + 1];
    const bodyStart = cur.end;
    const bodyEnd = next ? next.start : trimmed.length;
    const body = trimmed.slice(bodyStart, bodyEnd).trim().replace(/^[,.;:]\s*/, '');
    const sourceText = trimmed.slice(cur.start, bodyEnd).trim();
    clauses.push({
      keyword: cur.matchedText,
      route: cur.route,
      body,
      sourceText,
    });
  }

  return clauses;
}

export function routeClauses(
  clauses: Clause[],
  defaultTarget: string,
): RoutedClause[] {
  const result: RoutedClause[] = [];
  let currentTargets: string[] | null = null;

  for (const clause of clauses) {
    let targets: string[];
    let sourceKeyword: string | null;
    let reason: string;

    if (clause.route) {
      targets = [...clause.route.targets];
      currentTargets = targets;
      sourceKeyword = clause.keyword;
      const sourceLabel = clause.route.source;
      reason =
        targets.length > 1
          ? `${clause.keyword} (${sourceLabel}, fanned to ${targets.length} sections)`
          : `${clause.keyword} (${sourceLabel})`;
    } else if (currentTargets) {
      targets = [...currentTargets];
      sourceKeyword = null;
      reason = 'inherited from previous';
    } else {
      targets = [defaultTarget];
      sourceKeyword = null;
      reason = 'default (no keyword detected)';
    }

    const measurements = parseDictation(clause.body);
    result.push({
      targets,
      measurements,
      sourceKeyword,
      sourceText: clause.sourceText,
      reason: measurements.length === 0 ? `${reason} (no measurements)` : reason,
    });
  }

  return result;
}

// ─── Renal application ───────────────────────────────────────────────────────

export function applyToRenal(
  current: RenalIdfState,
  routed: RoutedClause[],
): RenalIdfState {
  const nextProcedures = { ...current.procedures };
  for (const r of routed) {
    if (r.measurements.length === 0) continue;
    for (const target of r.targets) {
      const key = target as RenalProcedureKey;
      const proc = nextProcedures[key];
      if (!proc) continue;
      const nextSize = joinMeasurements(proc.size, r.measurements);
      const allMeasurements = nextSize.split(',').map((s) => s.trim()).filter(Boolean);
      const pieces = totalPiecesFromMeasurements(allMeasurements);
      const thin: TissueDescriptor = 'thin';
      const nextDescriptors =
        detectThinFromSize(nextSize) && !proc.descriptors.includes(thin)
          ? [...proc.descriptors, thin]
          : proc.descriptors;
      nextProcedures[key] = {
        ...proc,
        size: nextSize,
        pieces: pieces > 0 ? pieces : proc.pieces,
        descriptors: nextDescriptors,
      };
    }
  }
  return { ...current, procedures: nextProcedures };
}

export function routeRenalDictation(transcript: string): {
  routes: KeywordRoute<string>[];
  clauses: Clause[];
  routed: RoutedClause[];
} {
  const routes = buildRenalRoutes(transcript);
  const clauses = tokenize(transcript, routes);
  const routed = routeClauses(clauses, RENAL_DEFAULT_TARGET);
  return { routes, clauses, routed };
}

// ─── Neuro application ───────────────────────────────────────────────────────

export function applyToNeuro(
  current: NeuroIdfState,
  routed: RoutedClause[],
): NeuroIdfState {
  let next: NeuroIdfState = { ...current };
  for (const r of routed) {
    if (r.measurements.length === 0) continue;
    for (const target of r.targets) {
      const key = target as NeuroSpecimenKey;
      if (key !== 'specimenA' && key !== 'specimenB') continue;
      const specimen: NeuroSpecimenState = key === 'specimenA' ? next.specimenA : next.specimenB;
      const nextSizeCm = joinMeasurements(specimen.sizeCm, r.measurements);
      const allMeasurements = nextSizeCm.split(',').map((s) => s.trim()).filter(Boolean);
      const fragmentCount = totalPiecesFromMeasurements(allMeasurements);
      const thin: TissueDescriptor = 'thin';
      const nextDescriptors =
        detectThinFromSize(nextSizeCm) && !specimen.descriptors.includes(thin)
          ? [...specimen.descriptors, thin]
          : specimen.descriptors;
      const updatedSpecimen: NeuroSpecimenState = {
        ...specimen,
        sizeCm: nextSizeCm,
        fragmentCount: fragmentCount > 0 ? fragmentCount : specimen.fragmentCount,
        descriptors: nextDescriptors,
      };
      if (key === 'specimenA') {
        next = { ...next, specimenA: updatedSpecimen };
      } else {
        next = { ...next, specimenB: updatedSpecimen, specimenBEnabled: true };
      }
    }
  }
  return next;
}

export function routeNeuroDictation(transcript: string): {
  routes: KeywordRoute<string>[];
  clauses: Clause[];
  routed: RoutedClause[];
} {
  const routes = buildNeuroRoutes();
  const clauses = tokenize(transcript, routes);
  const routed = routeClauses(clauses, NEURO_DEFAULT_TARGET);
  return { routes, clauses, routed };
}
