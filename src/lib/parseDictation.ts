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

export function parseDictation(transcript: string): string[] {
  const segments = transcript.split(/\s*comma\s*/i).filter(Boolean);
  const measurements: string[] = [];
  for (const seg of segments) {
    const atMatch = seg.match(/^(.*?)\s+at\s+(.*)$/i);
    if (!atMatch) continue;
    const countWords = atMatch[1] ?? '';
    const dimWords = atMatch[2] ?? '';
    const count = wordsToDecimal(countWords);
    const dimParts = dimWords.split(/\s+by\s+/i).map((p) => wordsToDecimal(p));
    if (count && dimParts.length >= 2 && dimParts.every(Boolean)) {
      measurements.push(`${count}@${dimParts.join('×')}`);
    }
  }
  return measurements;
}

export function totalPiecesFromMeasurements(measurements: string[]): number {
  let total = 0;
  for (const m of measurements) {
    const match = m.match(/^(\d+(?:\.\d+)?)@/);
    if (match && match[1]) {
      total += Number(match[1]);
    }
  }
  return total;
}

export function joinMeasurements(existing: string, incoming: string[]): string {
  const incomingJoined = incoming.join(', ');
  if (!existing.trim()) return incomingJoined;
  if (!incomingJoined) return existing;
  return `${existing}, ${incomingJoined}`;
}

const THIN_THRESHOLD = 0.1;

export function detectThinFromSize(size: string): boolean {
  if (!size.trim()) return false;
  const segments = size.split(',').map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const afterAt = seg.includes('@') ? seg.split('@')[1] ?? '' : seg;
    const dims = afterAt
      .split('×')
      .map((d) => Number(d.trim()))
      .filter((n) => !Number.isNaN(n));
    if (dims.length >= 2 && dims.some((d) => d < THIN_THRESHOLD)) return true;
  }
  return false;
}
