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
  timestamp: string;
  accessionNumber: string;
  patient: string;
  caseType: string;
  event: string;
  category: EventCategory;
  variant: 'info' | 'success' | 'warning' | 'danger';
  user: string;
  tags?: AccessionTagKey[];
}

// Sort key for the human-readable timestamp strings. "Yesterday X" sorts
// before any "today X". Bigger number = more recent.
function timestampSortKey(ts: string): number {
  const isYesterday = ts.startsWith('Yesterday ');
  const timePart = isYesterday ? ts.slice('Yesterday '.length) : ts;
  const m = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return Number.NEGATIVE_INFINITY;
  let hour = parseInt(m[1]!, 10);
  const minute = parseInt(m[2]!, 10);
  if (hour === 12) hour = 0;
  if (m[3]!.toUpperCase() === 'PM') hour += 12;
  const minutesInDay = hour * 60 + minute;
  return (isYesterday ? -10000 : 0) + minutesInDay;
}

const logEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '11:42 AM',
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
    timestamp: '11:42 AM',
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
    timestamp: '11:18 AM',
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
    timestamp: '10:55 AM',
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
    timestamp: '10:30 AM',
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
    timestamp: '09:48 AM',
    accessionNumber: 'S26-12533',
    patient: 'Maria Lopez',
    caseType: 'Consult Muscle',
    event: 'Materials received',
    category: 'intake',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-7',
    timestamp: 'Yesterday 4:12 PM',
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
    timestamp: 'Yesterday 2:02 PM',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    caseType: 'Surgical Transplant',
    event: 'Case finalized',
    category: 'finalize',
    variant: 'success',
    user: 'MS',
    tags: ['tx', 'special_stains'],
  },

  // ─── Additional filter coverage entries ──────────────────────────────────
  {
    id: 'log-9',
    timestamp: '12:25 PM',
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
    timestamp: '12:08 PM',
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
    timestamp: '11:50 AM',
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
    timestamp: '11:22 AM',
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
    timestamp: '10:48 AM',
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
    timestamp: '10:15 AM',
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
    timestamp: '09:42 AM',
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
    timestamp: '09:10 AM',
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
    timestamp: '08:35 AM',
    accessionNumber: 'S26-12603',
    patient: 'Wei Chen',
    caseType: 'Surgical Transplant',
    event: 'Comprehensive TX workup — PIF + amyloid + special stains',
    category: 'flag',
    variant: 'warning',
    user: 'MS',
    tags: ['tx', 'special_stains', 'congo_red'],
  },
];

const ALL_CASE_TYPES = '__all__';
const ALL_USERS = '__all__';

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

export function AccessionLogs() {
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>(ALL_CASE_TYPES);
  const [userFilter, setUserFilter] = useState<string>(ALL_USERS);
  const [activeTags, setActiveTags] = useState<Set<AccessionTagKey>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const caseGroups = useMemo<CaseGroup[]>(() => {
    const map = new Map<string, LogEntry[]>();
    for (const e of logEntries) {
      const arr = map.get(e.accessionNumber) ?? [];
      arr.push(e);
      map.set(e.accessionNumber, arr);
    }
    const groups: CaseGroup[] = [];
    for (const [accessionNumber, entries] of map) {
      const sorted = [...entries].sort(
        (a, b) => timestampSortKey(b.timestamp) - timestampSortKey(a.timestamp),
      );
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
    groups.sort(
      (a, b) =>
        timestampSortKey(b.latestEntry.timestamp) -
        timestampSortKey(a.latestEntry.timestamp),
    );
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

  const filteredGroups = useMemo(() => {
    return caseGroups.filter((g) => {
      if (caseTypeFilter !== ALL_CASE_TYPES && g.caseType !== caseTypeFilter) {
        return false;
      }
      if (userFilter !== ALL_USERS && !g.users.includes(userFilter)) {
        return false;
      }
      if (activeTags.size === 0) return true;
      for (const required of activeTags) {
        if (!g.tags.includes(required)) return false;
      }
      return true;
    });
  }, [caseGroups, caseTypeFilter, userFilter, activeTags]);

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
  }

  const hasActiveFilters =
    caseTypeFilter !== ALL_CASE_TYPES ||
    userFilter !== ALL_USERS ||
    activeTags.size > 0;

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-arkana-black mt-1">Accession Logs</h1>
        <p className="text-arkana-gray-500 mt-1">Recent intake activity across the bench.</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <label
                htmlFor="case-type-filter"
                className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500"
              >
                Case Type
              </label>
              <select
                id="case-type-filter"
                value={caseTypeFilter}
                onChange={(e) => setCaseTypeFilter(e.target.value)}
                className="h-9 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
              >
                <option value={ALL_CASE_TYPES}>All case types</option>
                {caseTypeOptions.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label
                htmlFor="user-filter"
                className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500"
              >
                User
              </label>
              <select
                id="user-filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="h-9 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
              >
                <option value={ALL_USERS}>All users</option>
                {userOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500">
              Tags
            </span>
            {ACCESSION_TAG_DEFS.map((def) => {
              const selected = activeTags.has(def.key);
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => toggleTag(def.key)}
                  aria-pressed={selected}
                  className={`inline-flex items-center rounded-full border px-3 h-7 text-xs font-semibold transition ${
                    def.classes
                  } ${
                    selected
                      ? 'ring-2 ring-offset-1 ring-arkana-black/40'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {selected && <span className="mr-1" aria-hidden>✓</span>}
                  {def.label}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 text-xs text-arkana-gray-500 hover:text-arkana-red underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-xs text-arkana-gray-500">
          Showing {filteredGroups.length} of {caseGroups.length} cases
        </div>
      </Card>

      <Card>
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-arkana-gray-500 italic py-4 text-center">
            No cases match the current filters.
          </p>
        ) : (
          <ul className="divide-y divide-arkana-gray-200">
            {filteredGroups.map((group) => {
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
                        Latest: {group.latestEntry.timestamp} · {group.latestEntry.event}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-arkana-gray-500 tabular-nums">
                        {group.entries.length} {group.entries.length === 1 ? 'event' : 'events'}
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
                          {group.entries.map((entry) => (
                            <li key={entry.id} className="flex items-start gap-3">
                              <div className="text-xs text-arkana-gray-500 w-24 shrink-0 mt-0.5 tabular-nums">
                                {entry.timestamp}
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
