import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';

type AccessionTagKey = 'tx' | 'special_stains' | 'congo_red';

interface AccessionTagDef {
  key: AccessionTagKey;
  label: string;
  classes: string;
}

const ACCESSION_TAG_DEFS: AccessionTagDef[] = [
  { key: 'tx', label: 'TX', classes: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { key: 'special_stains', label: 'Special Stains', classes: 'bg-orange-100 text-orange-800 border-orange-300' },
  { key: 'congo_red', label: 'Congo Red', classes: 'bg-pink-100 text-pink-800 border-pink-300' },
];

const TAG_DEF_BY_KEY: Record<AccessionTagKey, AccessionTagDef> = ACCESSION_TAG_DEFS.reduce(
  (acc, def) => {
    acc[def.key] = def;
    return acc;
  },
  {} as Record<AccessionTagKey, AccessionTagDef>,
);

type EventCategory = 'intake' | 'flag' | 'submit' | 'finalize';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  intake: 'Intake',
  flag: 'Flag',
  submit: 'Submit',
  finalize: 'Finalize',
};

interface LogEntry {
  id: string;
  at: string; // ISO datetime, e.g. "2026-04-30T11:42:00"
  accessionNumber: string;
  patient: string;
  caseType: string;
  event: string;
  category: EventCategory;
  variant: 'info' | 'success' | 'warning' | 'danger';
  user: string;
  tags?: AccessionTagKey[];
}

// Demo's "today" anchor. Keeps the date filter default and the
// "Yesterday / today" display labels stable regardless of when the
// demo is run.
const DEMO_TODAY_YMD = '2026-04-30';

function dateToYmd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function entryYmd(entry: LogEntry): string {
  return entry.at.slice(0, 10);
}

function formatTimestampForDisplay(at: string): string {
  const d = new Date(at);
  const ymd = at.slice(0, 10);
  const today = new Date(`${DEMO_TODAY_YMD}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayYmd = dateToYmd(yesterday);

  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (ymd === DEMO_TODAY_YMD) return time;
  if (ymd === yesterdayYmd) return `Yesterday ${time}`;
  const month = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${month}, ${time}`;
}

const logEntries: LogEntry[] = [
  // ─── Apr 30 (today) ────────────────────────────────────────────────
  {
    id: 'log-1',
    at: '2026-04-30T11:42:00',
    accessionNumber: 'S26-12500',
    patient: 'Jane Doe',
    caseType: 'Surgical',
    event: 'Materials scanned & verified',
    category: 'intake',
    variant: 'success',
    user: 'JD',
    tags: ['special_stains'],
  },
  {
    id: 'log-2',
    at: '2026-04-30T11:42:00',
    accessionNumber: 'S26-12500',
    patient: 'Jane Doe',
    caseType: 'Surgical',
    event: 'Labels printed (Bench 3)',
    category: 'intake',
    variant: 'info',
    user: 'JD',
    tags: ['special_stains'],
  },
  {
    id: 'log-3',
    at: '2026-04-30T11:18:00',
    accessionNumber: 'S26-12533',
    patient: 'Maria Lopez',
    caseType: 'Consult Muscle',
    event: 'Grossing started',
    category: 'submit',
    variant: 'info',
    user: 'JD',
    tags: ['special_stains'],
  },
  {
    id: 'log-4',
    at: '2026-04-30T10:55:00',
    accessionNumber: 'S26-12555',
    patient: 'Priya Shah',
    caseType: 'Surgical',
    event: 'Flag raised: bottle leaked',
    category: 'flag',
    variant: 'danger',
    user: 'JD',
    tags: ['congo_red', 'special_stains'],
  },
  {
    id: 'log-5',
    at: '2026-04-30T10:30:00',
    accessionNumber: 'S26-12555',
    patient: 'Priya Shah',
    caseType: 'Surgical',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'JD',
    tags: ['congo_red'],
  },
  {
    id: 'log-6',
    at: '2026-04-30T09:48:00',
    accessionNumber: 'S26-12533',
    patient: 'Maria Lopez',
    caseType: 'Consult Muscle',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-9',
    at: '2026-04-30T12:25:00',
    accessionNumber: 'S26-12603',
    patient: 'Wei Chen',
    caseType: 'Surgical Transplant',
    event: 'Insufficient cores on TX biopsy — flagged PIF',
    category: 'flag',
    variant: 'warning',
    user: 'JD',
    tags: ['tx', 'special_stains'],
  },
  {
    id: 'log-10',
    at: '2026-04-30T12:08:00',
    accessionNumber: 'S26-12604',
    patient: 'Michael Brown',
    caseType: 'Implantation',
    event: 'Congo Red ordered — amyloid screen on implant',
    category: 'submit',
    variant: 'info',
    user: 'MS',
    tags: ['tx', 'congo_red'],
  },
  {
    id: 'log-11',
    at: '2026-04-30T11:50:00',
    accessionNumber: 'S26-12608',
    patient: 'Sofia Reyes',
    caseType: 'Conjunctiva',
    event: 'IF insufficient — special stains added on LM block',
    category: 'flag',
    variant: 'warning',
    user: 'JD',
    tags: ['special_stains'],
  },
  {
    id: 'log-12',
    at: '2026-04-30T11:22:00',
    accessionNumber: 'S26-12606',
    patient: 'James Patel',
    caseType: 'Surgical Heart',
    event: 'Cardiac amyloid workup — Congo Red + Trichrome ordered',
    category: 'submit',
    variant: 'info',
    user: 'MS',
    tags: ['special_stains', 'congo_red'],
  },
  {
    id: 'log-13',
    at: '2026-04-30T10:48:00',
    accessionNumber: 'S26-12603',
    patient: 'Wei Chen',
    caseType: 'Surgical Transplant',
    event: 'Special stains added on remaining TX cores',
    category: 'submit',
    variant: 'info',
    user: 'JD',
    tags: ['tx', 'special_stains'],
  },
  {
    id: 'log-14',
    at: '2026-04-30T10:15:00',
    accessionNumber: 'S26-12604',
    patient: 'Michael Brown',
    caseType: 'Implantation',
    event: 'PIF flagged — Congo Red queued for repeat block',
    category: 'flag',
    variant: 'danger',
    user: 'JD',
    tags: ['tx', 'special_stains', 'congo_red'],
  },
  {
    id: 'log-15',
    at: '2026-04-30T09:42:00',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    caseType: 'Surgical Transplant',
    event: 'Amyloid screen requested on TX biopsy',
    category: 'submit',
    variant: 'info',
    user: 'MS',
    tags: ['tx', 'special_stains', 'congo_red'],
  },
  {
    id: 'log-16',
    at: '2026-04-30T09:10:00',
    accessionNumber: 'S26-12555',
    patient: 'Priya Shah',
    caseType: 'Surgical',
    event: 'Insufficient tissue — amyloid + special stains workup adjusted',
    category: 'flag',
    variant: 'warning',
    user: 'JD',
    tags: ['special_stains', 'congo_red'],
  },
  {
    id: 'log-17',
    at: '2026-04-30T08:35:00',
    accessionNumber: 'S26-12603',
    patient: 'Wei Chen',
    caseType: 'Surgical Transplant',
    event: 'Comprehensive TX workup — PIF + amyloid + special stains',
    category: 'flag',
    variant: 'warning',
    user: 'MS',
    tags: ['tx', 'special_stains', 'congo_red'],
  },

  // ─── Apr 29 (yesterday) ────────────────────────────────────────────
  {
    id: 'log-7',
    at: '2026-04-29T16:12:00',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    caseType: 'Surgical Transplant',
    event: 'CR requested — age change',
    category: 'flag',
    variant: 'warning',
    user: 'MS',
    tags: ['tx'],
  },
  {
    id: 'log-8',
    at: '2026-04-29T14:02:00',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    caseType: 'Surgical Transplant',
    event: 'Case finalized',
    category: 'finalize',
    variant: 'success',
    user: 'MS',
    tags: ['tx', 'special_stains'],
  },

  // ─── Apr 28 ────────────────────────────────────────────────────────
  {
    id: 'log-18',
    at: '2026-04-28T14:00:00',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    caseType: 'Surgical Transplant',
    event: 'Materials received — TX biopsy',
    category: 'intake',
    variant: 'info',
    user: 'MS',
    tags: ['tx'],
  },

  // ─── Apr 27 ────────────────────────────────────────────────────────
  {
    id: 'log-19',
    at: '2026-04-27T08:30:00',
    accessionNumber: 'S26-12609',
    patient: 'Ahmed Hassan',
    caseType: 'Surgical Nerve',
    event: 'Grossing started',
    category: 'submit',
    variant: 'info',
    user: 'JD',
  },

  // ─── Apr 26 ────────────────────────────────────────────────────────
  {
    id: 'log-20',
    at: '2026-04-26T13:00:00',
    accessionNumber: 'S26-12601',
    patient: 'David Kim',
    caseType: 'Surgical',
    event: 'Case finalized',
    category: 'finalize',
    variant: 'success',
    user: 'JD',
    tags: ['special_stains'],
  },

  // ─── Apr 25 ────────────────────────────────────────────────────────
  {
    id: 'log-21',
    at: '2026-04-25T10:30:00',
    accessionNumber: 'S26-12602',
    patient: 'Alice Reed',
    caseType: 'Surgical',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'JD',
  },

  // ─── Apr 24 ────────────────────────────────────────────────────────
  {
    id: 'log-22',
    at: '2026-04-24T10:45:00',
    accessionNumber: 'S26-12609',
    patient: 'Ahmed Hassan',
    caseType: 'Surgical Nerve',
    event: 'Damaged FedEx package — bottle leaked',
    category: 'flag',
    variant: 'danger',
    user: 'KL',
  },

  // ─── Apr 23 ────────────────────────────────────────────────────────
  {
    id: 'log-23',
    at: '2026-04-23T11:20:00',
    accessionNumber: 'S26-12601',
    patient: 'David Kim',
    caseType: 'Surgical',
    event: 'Grossing started',
    category: 'submit',
    variant: 'info',
    user: 'JD',
    tags: ['special_stains'],
  },

  // ─── Apr 22 ────────────────────────────────────────────────────────
  {
    id: 'log-24',
    at: '2026-04-22T09:15:00',
    accessionNumber: 'S26-12601',
    patient: 'David Kim',
    caseType: 'Surgical',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'JD',
    tags: ['special_stains'],
  },

  // ─── Apr 21 ────────────────────────────────────────────────────────
  {
    id: 'log-25',
    at: '2026-04-21T15:45:00',
    accessionNumber: 'S26-12605',
    patient: 'Julia Romano',
    caseType: 'Preimplantation Kidney Biopsy',
    event: 'Case finalized',
    category: 'finalize',
    variant: 'success',
    user: 'MS',
    tags: ['tx'],
  },

  // ─── Apr 20 ────────────────────────────────────────────────────────
  {
    id: 'log-26',
    at: '2026-04-20T11:30:00',
    accessionNumber: 'S26-12431',
    patient: 'Daniel Cho',
    caseType: 'Surgical Nerve',
    event: 'Case finalized',
    category: 'finalize',
    variant: 'success',
    user: 'JD',
    tags: ['special_stains'],
  },

  // ─── Apr 19 ────────────────────────────────────────────────────────
  {
    id: 'log-27',
    at: '2026-04-19T14:00:00',
    accessionNumber: 'S26-12605',
    patient: 'Julia Romano',
    caseType: 'Preimplantation Kidney Biopsy',
    event: 'Implant biopsy grossed',
    category: 'submit',
    variant: 'info',
    user: 'MS',
    tags: ['tx'],
  },

  // ─── Apr 18 ────────────────────────────────────────────────────────
  {
    id: 'log-28',
    at: '2026-04-18T11:00:00',
    accessionNumber: 'S26-12605',
    patient: 'Julia Romano',
    caseType: 'Preimplantation Kidney Biopsy',
    event: 'Materials received — implantation',
    category: 'intake',
    variant: 'info',
    user: 'MS',
    tags: ['tx'],
  },

  // ─── Apr 17 ────────────────────────────────────────────────────────
  {
    id: 'log-29',
    at: '2026-04-17T10:00:00',
    accessionNumber: 'S26-12431',
    patient: 'Daniel Cho',
    caseType: 'Surgical Nerve',
    event: 'Grossing started',
    category: 'submit',
    variant: 'info',
    user: 'JD',
    tags: ['special_stains'],
  },

  // ─── Apr 16 (oldest) ───────────────────────────────────────────────
  {
    id: 'log-30',
    at: '2026-04-16T09:30:00',
    accessionNumber: 'S26-12431',
    patient: 'Daniel Cho',
    caseType: 'Surgical Nerve',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'KL',
    tags: ['special_stains'],
  },
];

const ALL_CASE_TYPES = '__all__';
const ALL_USERS = '__all__';

type SortKey = 'lastUpdate' | 'caseNumber' | 'caseType';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'lastUpdate', label: 'Last Update' },
  { value: 'caseNumber', label: 'Case #' },
  { value: 'caseType', label: 'Case Type' },
];

function AccessionTag({ tagKey }: { tagKey: AccessionTagKey }) {
  const def = TAG_DEF_BY_KEY[tagKey];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${def.classes}`}
    >
      {def.label}
    </span>
  );
}


interface CaseGroup {
  accessionNumber: string;
  patient: string;
  caseType: string;
  entries: LogEntry[];
  tags: AccessionTagKey[];
  users: string[];
  latestEntry: LogEntry;
}

interface FilteredCaseGroup extends CaseGroup {
  // Latest entry on the selected day, plus only that day's entries.
  latestOnDay: LogEntry;
  entriesOnDay: LogEntry[];
}

export function AccessionLogs() {
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>(ALL_CASE_TYPES);
  const [userFilter, setUserFilter] = useState<string>(ALL_USERS);
  const [activeTags, setActiveTags] = useState<Set<AccessionTagKey>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(DEMO_TODAY_YMD);

  const caseGroups = useMemo<CaseGroup[]>(() => {
    const map = new Map<string, LogEntry[]>();
    for (const e of logEntries) {
      const arr = map.get(e.accessionNumber) ?? [];
      arr.push(e);
      map.set(e.accessionNumber, arr);
    }
    const groups: CaseGroup[] = [];
    for (const [accessionNumber, entries] of map) {
      const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
      const tagSet = new Set<AccessionTagKey>();
      const userSet = new Set<string>();
      for (const e of sorted) {
        for (const t of e.tags ?? []) tagSet.add(t);
        userSet.add(e.user);
      }
      groups.push({
        accessionNumber,
        patient: sorted[0]!.patient,
        caseType: sorted[0]!.caseType,
        entries: sorted,
        tags: Array.from(tagSet),
        users: Array.from(userSet).sort(),
        latestEntry: sorted[0]!,
      });
    }
    return groups;
  }, []);

  const caseTypeOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const g of caseGroups) unique.add(g.caseType);
    return Array.from(unique).sort();
  }, [caseGroups]);

  const userOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const g of caseGroups) for (const u of g.users) unique.add(u);
    return Array.from(unique).sort();
  }, [caseGroups]);

  const filteredGroups = useMemo<FilteredCaseGroup[]>(() => {
    const result: FilteredCaseGroup[] = [];
    for (const g of caseGroups) {
      if (caseTypeFilter !== ALL_CASE_TYPES && g.caseType !== caseTypeFilter) continue;
      if (userFilter !== ALL_USERS && !g.users.includes(userFilter)) continue;
      if (activeTags.size > 0) {
        let allMatch = true;
        for (const required of activeTags) {
          if (!g.tags.includes(required)) {
            allMatch = false;
            break;
          }
        }
        if (!allMatch) continue;
      }
      // Only entries on the selected day. entries is pre-sorted desc by `at`.
      const entriesOnDay = g.entries.filter((e) => entryYmd(e) === selectedDate);
      if (entriesOnDay.length === 0) continue;
      result.push({ ...g, latestOnDay: entriesOnDay[0]!, entriesOnDay });
    }
    return result;
  }, [caseGroups, caseTypeFilter, userFilter, activeTags, selectedDate]);

  const sortedGroups = useMemo<FilteredCaseGroup[]>(() => {
    const sorted = [...filteredGroups].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'lastUpdate') {
        cmp = a.latestOnDay.at.localeCompare(b.latestOnDay.at);
      } else if (sortKey === 'caseNumber') {
        cmp = a.accessionNumber.localeCompare(b.accessionNumber);
      } else if (sortKey === 'caseType') {
        cmp = a.caseType.localeCompare(b.caseType);
        if (cmp === 0) cmp = a.accessionNumber.localeCompare(b.accessionNumber);
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [filteredGroups, sortKey, sortAsc]);

  function toggleExpanded(accessionNumber: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(accessionNumber)) next.delete(accessionNumber);
      else next.add(accessionNumber);
      return next;
    });
  }

  function toggleTag(key: AccessionTagKey) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearFilters() {
    setCaseTypeFilter(ALL_CASE_TYPES);
    setUserFilter(ALL_USERS);
    setActiveTags(new Set());
    setSelectedDate(DEMO_TODAY_YMD);
  }

  const hasActiveFilters =
    caseTypeFilter !== ALL_CASE_TYPES ||
    userFilter !== ALL_USERS ||
    activeTags.size > 0 ||
    selectedDate !== DEMO_TODAY_YMD;

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-arkana-black mt-1">Accession Logs</h1>
        <p className="text-arkana-gray-500 mt-1">Activity across the bench — grouped by case.</p>
      </div>

      <Card className="mb-4">
        {/* Single filter row — date + selects + tag chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            id="selected-date"
            type="date"
            aria-label="Filter by date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value || DEMO_TODAY_YMD)}
            className="h-9 rounded-lg border border-arkana-gray-200 bg-white px-2.5 text-sm text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
          <select
            id="case-type-filter"
            aria-label="Filter by case type"
            value={caseTypeFilter}
            onChange={(e) => setCaseTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-arkana-gray-200 bg-white px-2.5 text-sm text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
          >
            <option value={ALL_CASE_TYPES}>All case types</option>
            {caseTypeOptions.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
          <select
            id="user-filter"
            aria-label="Filter by user"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-9 rounded-lg border border-arkana-gray-200 bg-white px-2.5 text-sm text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
          >
            <option value={ALL_USERS}>All users</option>
            {userOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <span className="mx-1.5 text-arkana-gray-200 select-none" aria-hidden>·</span>
          {ACCESSION_TAG_DEFS.map((def) => {
            const selected = activeTags.has(def.key);
            return (
              <button
                key={def.key}
                type="button"
                onClick={() => toggleTag(def.key)}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1 rounded-full border px-3 h-7 text-xs font-semibold transition ${
                  selected
                    ? def.classes
                    : 'border-arkana-gray-200 bg-white text-arkana-gray-500 hover:border-arkana-gray-400 hover:text-arkana-black'
                }`}
              >
                {selected && <span aria-hidden>✓</span>}
                {def.label}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-arkana-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-arkana-gray-500">
              <span className="font-semibold text-arkana-black tabular-nums">
                {filteredGroups.length}
              </span>{' '}
              of {caseGroups.length} cases
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-arkana-red hover:text-arkana-red-dark underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-arkana-gray-500"
              aria-hidden
            >
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <select
              id="sort-key"
              aria-label="Sort cases"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-8 rounded-lg border border-arkana-gray-200 bg-white px-2 text-xs text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              aria-label={`Sort ${sortAsc ? 'ascending' : 'descending'} — click to toggle`}
              title={sortAsc ? 'Ascending — click for descending' : 'Descending — click for ascending'}
              className="h-8 w-8 rounded-lg border border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-400 flex items-center justify-center text-sm font-bold"
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        {sortedGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-arkana-gray-500 italic mb-3">
              No cases match the current filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-arkana-red hover:text-arkana-red-dark underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-arkana-gray-200">
            {sortedGroups.map((group) => {
              const isOpen = expanded.has(group.accessionNumber);
              return (
                <li key={group.accessionNumber}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(group.accessionNumber)}
                    aria-expanded={isOpen}
                    className="w-full py-3 flex items-start gap-3 text-left hover:bg-arkana-gray-50/60 transition rounded-lg px-2 -mx-2"
                  >
                    <span
                      className={`text-arkana-gray-500 mt-1 transition-transform shrink-0 ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                      aria-hidden
                    >
                      ▶
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-arkana-black">
                          {group.accessionNumber}
                        </span>
                        <span className="text-xs text-arkana-gray-500">·</span>
                        <span className="text-sm text-arkana-gray-500">{group.patient}</span>
                        <span className="text-xs text-arkana-gray-500">·</span>
                        <span className="text-xs text-arkana-gray-500">{group.caseType}</span>
                        {group.tags.length > 0 && (
                          <div className="flex items-center gap-1 ml-1 flex-wrap">
                            {group.tags.map((t) => (
                              <AccessionTag key={t} tagKey={t} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-arkana-gray-500 mt-0.5 truncate">
                        Latest: {formatTimestampForDisplay(group.latestOnDay.at)} ·{' '}
                        {group.latestOnDay.event}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Tag variant={group.latestOnDay.variant}>
                        {CATEGORY_LABEL[group.latestOnDay.category]}
                      </Tag>
                      <span className="text-xs text-arkana-gray-500 tabular-nums hidden sm:inline">
                        {group.entriesOnDay.length} {group.entriesOnDay.length === 1 ? 'event' : 'events'}
                      </span>
                      <div className="flex -space-x-1">
                        {group.users.map((u) => (
                          <div
                            key={u}
                            title={u}
                            className="h-6 w-6 rounded-full bg-arkana-gray-200 text-arkana-black flex items-center justify-center text-[10px] font-semibold ring-2 ring-white"
                          >
                            {u}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-7 pr-2 pb-4 -mt-1">
                      <div className="border-l-2 border-arkana-gray-200 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wide font-bold text-arkana-gray-500">
                            Timeline
                          </span>
                          <Link
                            to={`/case/${group.accessionNumber}`}
                            className="text-xs text-arkana-red hover:text-arkana-red-dark hover:underline"
                          >
                            Open case →
                          </Link>
                        </div>
                        <ul className="space-y-3">
                          {group.entriesOnDay.map((entry) => (
                            <li key={entry.id} className="flex items-start gap-3">
                              <div className="text-xs text-arkana-gray-500 w-28 shrink-0 mt-0.5 tabular-nums">
                                {formatTimestampForDisplay(entry.at)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-arkana-black">{entry.event}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Tag variant={entry.variant}>
                                  {CATEGORY_LABEL[entry.category]}
                                </Tag>
                                <div className="h-6 w-6 rounded-full bg-arkana-gray-200 text-arkana-black flex items-center justify-center text-[10px] font-semibold">
                                  {entry.user}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
