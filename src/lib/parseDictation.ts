import {
  totalCountFromStored,
  detectThinFromStored,
  joinStored,
} from './measurements';

const numberWords: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

function wordsToDecimal(input: string): string {
  const tokens = input.trim().split(/\s+/);
  let result = '';
  for (const t of tokens) {
    if (!t) continue;
    if (t === 'point') {
      result += '.';
      continue;
    }
    if (numberWords[t]) {
      result += numberWords[t];
    }
  }
  return result;
}

// "zero point one" → "0.1"
// "zero point one to zero point three" → "0.1-0.3"
function dimWordsToString(input: string): string {
  const rangeMatch = input.match(/^(.+?)\s+to\s+(.+)$/i);
  if (rangeMatch) {
    const min = wordsToDecimal(rangeMatch[1]!);
    const max = wordsToDecimal(rangeMatch[2]!);
    if (min && max) return `${min}-${max}`;
  }
  return wordsToDecimal(input);
}

export function parseDictation(transcript: string): string[] {
  const segments = transcript.split(/\s*comma\s*/i).filter(Boolean);
  const measurements: string[] = [];
  for (const seg of segments) {
    const atMatch = seg.match(/^(.*?)\s+at\s+(.*)$/i);
    if (!atMatch) continue;
    const countWords = atMatch[1] ?? '';
    const dimWords = atMatch[2] ?? '';
    const count = wordsToDecimal(countWords);
    const dimParts = dimWords.split(/\s+by\s+/i).map(dimWordsToString);
    if (count && dimParts.length >= 2 && dimParts.every(Boolean)) {
      measurements.push(`${count}@${dimParts.join('×')}`);
    }
  }
  return measurements;
}

// ─── Compatibility wrappers around the canonical measurements module ─────────
// These keep the old call sites (RenalIdfForm, NeuroIdfForm, routeDictation)
// working unchanged. New code should import from ./measurements directly.

export function totalPiecesFromMeasurements(measurements: string[]): number {
  return totalCountFromStored(measurements.join(', '));
}

export function joinMeasurements(existing: string, incoming: string[]): string {
  return joinStored(existing, incoming);
}

export function detectThinFromSize(size: string): boolean {
  return detectThinFromStored(size);
}
