// Canonical measurement model for Cortex Grossing.
//
// One uniform shape (DimRange) for every dimension. Exact values are stored
// as a degenerate range where min === max. This collapses every numeric
// operation to a single non-branching path.
//
// Storage string format (round-trip stable):
//   1@2.8×0.1×0.1               — all dims exact
//   2@0.1-0.3×0.4-0.7×0.1       — mixed: any dim can be "min-max"
//   2@0.1-0.3×0.1×0.05          — partial: only some dims ranged

export interface DimRange {
  min: number;
  max: number;
}

export interface Measurement {
  count: number;
  dimensions: DimRange[];
}

// ─── Construction ────────────────────────────────────────────────────────────

export function exact(value: number): DimRange {
  return { min: value, max: value };
}

export function range(a: number, b: number): DimRange {
  return a <= b ? { min: a, max: b } : { min: b, max: a };
}

export function isExact(d: DimRange): boolean {
  return d.min === d.max;
}

// ─── Parse / serialize ───────────────────────────────────────────────────────

export function parseDim(text: string): DimRange | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.includes('-') && !trimmed.startsWith('-')) {
    const [a, b] = trimmed.split('-');
    const min = Number(a);
    const max = Number(b);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return range(min, max);
  }

  const v = Number(trimmed);
  if (!Number.isFinite(v)) return null;
  return exact(v);
}

function parseSegment(seg: string): Measurement | null {
  const m = seg.match(/^(\d+(?:\.\d+)?)@(.+)$/);
  if (!m) return null;
  const count = Number(m[1]);
  if (!Number.isFinite(count) || count < 1) return null;
  const dimStrs = m[2]!.split('×');
  if (dimStrs.length < 2) return null;
  const dimensions: DimRange[] = [];
  for (const ds of dimStrs) {
    const d = parseDim(ds);
    if (!d) return null;
    dimensions.push(d);
  }
  return { count, dimensions };
}

export function parse(stored: string): Measurement[] {
  if (!stored.trim()) return [];
  const out: Measurement[] = [];
  for (const seg of stored.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = parseSegment(seg);
    if (m) out.push(m);
  }
  return out;
}

function serializeDim(d: DimRange): string {
  return isExact(d) ? String(d.min) : `${d.min}-${d.max}`;
}

export function serializeMeasurement(m: Measurement): string {
  return `${m.count}@${m.dimensions.map(serializeDim).join('×')}`;
}

export function serialize(measurements: Measurement[]): string {
  return measurements.map(serializeMeasurement).join(', ');
}

// ─── Display ─────────────────────────────────────────────────────────────────

export function formatDim(d: DimRange): string {
  if (!isExact(d)) return `${d.min}-${d.max}`;
  const v = d.min;
  return Number.isInteger(v) ? `${v}.0` : String(v);
}

export function formatMeasurement(m: Measurement): string {
  return `${m.count} @ ${m.dimensions.map(formatDim).join('x')}`;
}

// ─── Aggregates / domain ops ─────────────────────────────────────────────────

export function totalCount(ms: Measurement[]): number {
  return ms.reduce((sum, m) => sum + m.count, 0);
}

export function boundingBox(ms: Measurement[]): DimRange[] {
  if (ms.length === 0) return [];
  const dimCount = ms[0]!.dimensions.length;
  const result: DimRange[] = [];
  for (let i = 0; i < dimCount; i++) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const m of ms) {
      const d = m.dimensions[i];
      if (!d) continue;
      if (d.min < min) min = d.min;
      if (d.max > max) max = d.max;
    }
    result.push({ min, max });
  }
  return result;
}

export function volumeRange(m: Measurement): { min: number; max: number } {
  let lo = 1;
  let hi = 1;
  for (const d of m.dimensions) {
    lo *= d.min;
    hi *= d.max;
  }
  return { min: lo, max: hi };
}

export function totalVolumeRange(ms: Measurement[]): { min: number; max: number } {
  let lo = 0;
  let hi = 0;
  for (const m of ms) {
    const v = volumeRange(m);
    lo += v.min * m.count;
    hi += v.max * m.count;
  }
  return { min: lo, max: hi };
}

const THIN_THRESHOLD = 0.1;

export function hasThinDimension(m: Measurement, threshold = THIN_THRESHOLD): boolean {
  // Auto-Thin rule: any dimension whose minimum is strictly less than threshold.
  // For exact dims this collapses to "value < threshold"; for ranges this fires
  // as soon as part of the range is below threshold.
  return m.dimensions.some((d) => d.min < threshold);
}

export function hasAnyThin(ms: Measurement[], threshold = THIN_THRESHOLD): boolean {
  return ms.some((m) => hasThinDimension(m, threshold));
}

// ─── Stored-string convenience wrappers ──────────────────────────────────────
// Useful where callers hold the raw storage string and don't want to parse
// twice. All of these are O(parse).

export function totalCountFromStored(stored: string): number {
  return totalCount(parse(stored));
}

export function detectThinFromStored(stored: string, threshold = THIN_THRESHOLD): boolean {
  return hasAnyThin(parse(stored), threshold);
}

export function joinStored(existing: string, incoming: string[]): string {
  const incomingJoined = incoming.join(', ');
  if (!existing.trim()) return incomingJoined;
  if (!incomingJoined) return existing;
  return `${existing}, ${incomingJoined}`;
}
