import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCaseByAccession } from '../mock/data';
import type { QualityFlag, CaseStatus, Material, Preservative } from '../mock/types';
import { Button } from '../components/ui/Button';
import { ScanMaterialsDialog } from '../components/ScanMaterialsDialog';
import { useToast } from '../components/ToastHost';
import { useCaseSession } from '../state/CaseSessionContext';
import { parse, formatDim, type Measurement } from '../lib/measurements';
import type { RenalIdfState } from '../templates/renalIdf';
import { BottleReadonlyList } from '../components/IdfReadonlyView';

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDob(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function calculateAge(iso: string): number {
  const dob = new Date(iso);
  if (isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
  ) age--;
  return age;
}

function formatReceivedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return (
    d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

const specimenCategoryLabel: Record<string, string> = {
  native_kidney:     'Native Kidney',
  kidney_transplant: 'Kidney Transplant',
  tx_implantation:   'TX Implantation',
  pre_implantation:  'Pre-Implantation',
  consult:           'Consult',
  tem:               'TEM',
};

const statusConfig: Record<CaseStatus, { label: string; cls: string }> = {
  intake:      { label: 'Intake',      cls: 'bg-arkana-gray-50 text-arkana-gray-500 border border-arkana-gray-200' },
  in_grossing: { label: 'In Grossing', cls: 'bg-arkana-blue-light text-arkana-blue border border-blue-300' },
  submitted:   { label: 'Submitted',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  finalized:   { label: 'Finalized',   cls: 'bg-arkana-green-light text-arkana-green border border-emerald-300' },
};

const flagConfig: Record<QualityFlag, { label: string; severity: 'danger' | 'warning' }> = {
  fatty:                 { label: 'Fatty Appearance',      severity: 'warning' },
  bloody:                { label: 'Bloody Appearance',     severity: 'warning' },
  no_pw:                 { label: 'No Paperwork',          severity: 'danger'  },
  materials_not_labeled: { label: 'Materials Not Labeled', severity: 'danger'  },
  bottle_leaked:         { label: 'Bottle Leaked',         severity: 'danger'  },
  damaged_items:         { label: 'Damaged Items',         severity: 'danger'  },
};

// ── SVG icons ─────────────────────────────────────────────────────────────────

const sw = { strokeWidth: 2.5, stroke: 'currentColor', fill: 'none' } as const;

function CheckSvg() {
  return <svg width="11" height="11" viewBox="0 0 24 24" {...sw}><path d="M20 6L9 17l-5-5"/></svg>;
}
function WarnSvg({ red }: { red?: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" {...sw}
      className={red ? 'text-arkana-red' : 'text-amber-500'}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
    </svg>
  );
}
function UserSvg()    { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function FlaskSvg()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><path d="M9 3h6m-6 0v7l-4 9h14l-4-9V3"/></svg>; }
function ShieldSvg()  { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function RouteSvg()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function AuditSvg()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>; }
function TableSvg()   { return <svg width="13" height="13" viewBox="0 0 24 24" {...sw}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>; }

// ── Card infrastructure ───────────────────────────────────────────────────────

type IconColor = 'red' | 'blue' | 'green' | 'amber' | 'gray';

function IconBox({ children, color }: { children: ReactNode; color: IconColor }) {
  const cls: Record<IconColor, string> = {
    red:   'bg-arkana-red-light text-arkana-red',
    blue:  'bg-arkana-blue-light text-arkana-blue',
    green: 'bg-arkana-green-light text-arkana-green',
    amber: 'bg-amber-50 text-amber-500',
    gray:  'bg-arkana-gray-50 text-arkana-gray-500',
  };
  return (
    <div className={`w-[26px] h-[26px] rounded-[6px] flex items-center justify-center shrink-0 ${cls[color]}`}>
      {children}
    </div>
  );
}

function CardHeader({ color, title, icon, right }: {
  color: IconColor; title: string; icon: ReactNode; right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-[18px] py-3 border-b border-arkana-gray-50">
      <IconBox color={color}>{icon}</IconBox>
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-arkana-black flex-1">{title}</span>
      {right}
    </div>
  );
}

function RoField({ label, value, mono, large, span2 }: {
  label: string; value?: string | null; mono?: boolean; large?: boolean; span2?: boolean;
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <div className="text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500 mb-[3px]">{label}</div>
      <div className={`py-[7px] border-b border-arkana-gray-50 ${
        value
          ? `text-arkana-black font-medium ${mono ? 'font-mono tracking-[0.04em]' : ''} ${large ? 'text-base font-bold' : 'text-[13px]'}`
          : 'text-arkana-gray-500 italic text-[13px]'
      }`}>
        {value || '—'}
      </div>
    </div>
  );
}

// ── Department badge pill ──────────────────────────────────────────────────────

type DeptAbbr = 'LM' | 'IF' | 'EM';

const DEPT_BADGE_CLS: Record<DeptAbbr, string> = {
  LM: 'bg-arkana-green-light text-arkana-green border-emerald-200',
  IF: 'bg-purple-50 text-purple-700 border-purple-200',
  EM: 'bg-arkana-blue-light text-arkana-blue border-blue-200',
};

function DeptBadge({ dept }: { dept: DeptAbbr }) {
  return (
    <span className={`text-[10px] font-bold px-[7px] py-[2px] rounded-[4px] border ${DEPT_BADGE_CLS[dept]}`}>
      {dept}
    </span>
  );
}

// ── Measurement row ───────────────────────────────────────────────────────────

function MeasRow({ m }: { m: Measurement }) {
  return (
    <div className="flex items-baseline gap-2 py-[2px]">
      <span className="font-mono text-[12px] font-semibold text-arkana-black">
        {m.dimensions.map(formatDim).join(' × ')} cm
      </span>
      {m.count > 1 && (
        <span className="text-[10px] text-arkana-gray-500 font-semibold">×{m.count}</span>
      )}
      {m.descriptors.length > 0 && (
        <span className="text-[10px] text-arkana-gray-500 italic">({m.descriptors.join(', ')})</span>
      )}
    </div>
  );
}

// ── Procedure section inside a bottle card ────────────────────────────────────

function ProcedureSection({ abbr, name, subtitle, pieces, unit, measurements, noEmReason }: {
  abbr: DeptAbbr;
  name: string;
  subtitle: string;
  pieces: number | null;
  unit: string;
  measurements: Measurement[];
  noEmReason?: string | null;
}) {
  const hasData = pieces !== null;

  return (
    <div className="pt-3 first:pt-2">
      {/* Procedure header row */}
      <div className="flex items-start gap-2.5 mb-1.5">
        <DeptBadge dept={abbr} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-arkana-black leading-tight">{name}</div>
          <div className="text-[10px] text-arkana-gray-500 mt-[2px] leading-tight">{subtitle}</div>
        </div>
        {hasData && (
          <div className="text-right shrink-0 pl-2">
            <div className="text-[20px] font-bold leading-none text-arkana-black">{pieces}</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.05em] text-arkana-gray-500">{unit}</div>
          </div>
        )}
      </div>

      {/* Measurements / status */}
      <div className="pl-[34px]">
        {noEmReason ? (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-2.5 py-1.5 italic">
            No {unit} submitted — {noEmReason}
          </div>
        ) : measurements.length > 0 ? (
          <div className="space-y-0">
            {measurements.map((m, i) => <MeasRow key={i} m={m} />)}
          </div>
        ) : hasData ? (
          <p className="text-[11px] italic text-arkana-gray-500">No measurements recorded</p>
        ) : (
          <p className="text-[11px] italic text-arkana-gray-500">Awaiting grossing</p>
        )}
      </div>
    </div>
  );
}

// ── Bottle card ───────────────────────────────────────────────────────────────

type ProcKey = 'lightMicroscopy' | 'immunofluorescence' | 'electronMicroscopy';

interface BottleProc {
  key: ProcKey;
  abbr: DeptAbbr;
  name: string;
  subtitle: string;
  unit: string;
}

const PROC_DEFS: Record<DeptAbbr, BottleProc> = {
  LM: {
    key: 'lightMicroscopy',
    abbr: 'LM',
    name: 'Kidney Biopsy, Level IV',
    subtitle: 'H&E×2, PAS×2, Silver, SMMT, Trichrome',
    unit: 'pcs',
  },
  IF: {
    key: 'immunofluorescence',
    abbr: 'IF',
    name: 'Immunofluorescence Profile ×9',
    subtitle: 'IgA, IgG, IgM, C3, C1Q, Albumin, Fibrinogen, Kappa, Lambda',
    unit: 'pcs',
  },
  EM: {
    key: 'electronMicroscopy',
    abbr: 'EM',
    name: 'Electron Microscopy',
    subtitle: 'Complete / Reduced',
    unit: 'ends',
  },
};

const PRESERVATIVE_LABEL: Record<Preservative, string> = {
  formalin:      'Formalin',
  michels:       "Michel's",
  glutaraldehyde:'Glutaraldehyde',
};

function BottleCard({ bottle, index, depts, renalIdf }: {
  bottle: Material;
  index: number;
  depts: DeptAbbr[];
  renalIdf: RenalIdfState | null;
}) {
  return (
    <div className="rounded-[8px] border border-arkana-gray-200 overflow-hidden">
      {/* Header strip — neutral, no preservative color coding */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-arkana-gray-50">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold bg-arkana-black text-white">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-arkana-black">
            Bottle {index + 1} — {PRESERVATIVE_LABEL[bottle.preservative]}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {depts.map(d => <DeptBadge key={d} dept={d} />)}
          </div>
        </div>
        {!bottle.isLabeled && (
          <span className="text-[10px] font-bold text-white bg-arkana-red px-2 py-0.5 rounded shrink-0">
            ⚠ Unlabeled
          </span>
        )}
      </div>

      {/* Procedure sections */}
      <div className="px-4 pb-4 bg-white divide-y divide-arkana-gray-50">
        {depts.map(d => {
          const pd = PROC_DEFS[d];
          const proc = renalIdf?.procedures[pd.key] ?? null;
          const ms = parse(proc?.size ?? '');
          return (
            <ProcedureSection
              key={d}
              abbr={d}
              name={pd.name}
              subtitle={pd.subtitle}
              pieces={proc?.pieces ?? null}
              unit={pd.unit}
              measurements={ms}
              noEmReason={d === 'EM' ? (renalIdf?.noEmReason ?? null) : null}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Routing timeline ──────────────────────────────────────────────────────────

type RouteStatus = 'done' | 'active' | 'hold' | 'pending' | 'skipped';

function RouteStep({ label, note, status, isLast }: {
  label: string; note?: string; status: RouteStatus; isLast?: boolean;
}) {
  const dot: Record<RouteStatus, string> = {
    done:    'bg-arkana-green border-arkana-green',
    active:  'bg-arkana-blue border-arkana-blue',
    hold:    'bg-amber-500 border-amber-500',
    pending: 'bg-white border-arkana-gray-200',
    skipped: 'bg-arkana-gray-100 border-arkana-gray-200',
  };
  const conn: Record<RouteStatus, string> = {
    done:    'bg-arkana-green',
    active:  'bg-arkana-blue-light',
    hold:    'bg-amber-200',
    pending: 'bg-arkana-gray-200',
    skipped: 'bg-arkana-gray-100',
  };
  const badge: Record<RouteStatus, { label: string; cls: string }> = {
    done:    { label: 'Done',    cls: 'bg-arkana-green-light text-arkana-green' },
    active:  { label: 'Active',  cls: 'bg-arkana-blue-light text-arkana-blue' },
    hold:    { label: 'Hold',    cls: 'bg-amber-50 text-amber-700' },
    pending: { label: 'Pending', cls: 'bg-arkana-gray-50 text-arkana-gray-500' },
    skipped: { label: 'Skipped', cls: 'bg-arkana-gray-50 text-arkana-gray-400' },
  };
  return (
    <div className="flex items-stretch gap-3 py-[10px] border-b border-arkana-gray-50 last:border-0">
      <div className="flex flex-col items-center w-5 shrink-0 pt-[3px]">
        <div className={`w-[10px] h-[10px] rounded-full border-2 shrink-0 ${dot[status]}`} />
        {!isLast && <div className={`w-0.5 flex-1 mt-[2px] min-h-[20px] ${conn[status]}`} />}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-[12px] font-bold text-arkana-black">{label}</div>
        {note && <div className="text-[10px] text-arkana-gray-500 mt-[2px]">{note}</div>}
      </div>
      <span className={`self-start text-[10px] font-bold px-[8px] py-[2px] rounded-[10px] shrink-0 ${badge[status].cls}`}>
        {badge[status].label}
      </span>
    </div>
  );
}

// ── Dept summary stat box ─────────────────────────────────────────────────────

function DeptStat({ label, value, color, dark }: {
  label: string; value: number | null; color?: 'green' | 'blue' | 'purple'; dark?: boolean;
}) {
  const numCls = dark ? 'text-white'
    : color === 'green'  ? 'text-arkana-green'
    : color === 'blue'   ? 'text-arkana-blue'
    : color === 'purple' ? 'text-purple-700'
    : 'text-arkana-black';
  return (
    <div className={`rounded-[6px] p-[10px] text-center ${dark ? 'bg-arkana-black' : 'bg-arkana-gray-50'}`}>
      <div className={`text-[20px] font-bold leading-none ${numCls}`}>
        {value !== null ? value : '—'}
      </div>
      <div className={`text-[9px] font-bold uppercase tracking-[0.07em] mt-[3px] ${dark ? 'text-white/50' : 'text-arkana-gray-500'}`}>
        {label}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CaseDetail() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [scanOpen, setScanOpen] = useState(false);
  const [_activity, _setActivity] = useState<string[]>([]);

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-arkana-black mb-2">Case not found</h2>
        <p className="text-arkana-gray-500 mb-6">We couldn't find case {accessionNumber}.</p>
        <Link to="/search"><Button variant="primary">Back to search</Button></Link>
      </div>
    );
  }

  const { getSubmittedIdf } = useCaseSession();
  const submittedEntry = getSubmittedIdf(caseData.accessionNumber);
  const renalIdf = submittedEntry?.panelType === 'renal' ? submittedEntry.idf : null;

  const { flags, status, materials, panels } = caseData;
  const hasFlags    = flags.length > 0;
  const unlabeled   = materials.filter(m => !m.isLabeled);
  const hasFormalin = materials.some(m => m.preservative === 'formalin');
  const hasMichels  = materials.some(m => m.preservative === 'michels');
  const hasGlute    = materials.some(m => m.preservative === 'glutaraldehyde');
  const { label: statusLabel, cls: statusCls } = statusConfig[status];

  const lmPieces = renalIdf?.procedures.lightMicroscopy.pieces    ?? null;
  const ifPieces = renalIdf?.procedures.immunofluorescence.pieces ?? null;
  const emEnds   = renalIdf?.procedures.electronMicroscopy.pieces ?? null;
  const total    = renalIdf ? (lmPieces ?? 0) + (ifPieces ?? 0) + (emEnds ?? 0) : null;

  function addMins(iso: string, mins: number) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + mins);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  interface AuditEntry { time: string; who: string; what: string }
  const auditTrail: AuditEntry[] = [];
  auditTrail.push({ time: addMins(caseData.receivedAt, 0), who: 'J. Martinez', what: 'Case created · QR scanned' });
  if (flags.includes('bottle_leaked'))         auditTrail.push({ time: addMins(caseData.receivedAt, 4),  who: 'J. Martinez', what: 'QA flag: formalin bottle leaked' });
  if (flags.includes('materials_not_labeled')) auditTrail.push({ time: addMins(caseData.receivedAt, 5),  who: 'J. Martinez', what: 'QA flag: materials not labeled' });
  if (flags.includes('damaged_items'))         auditTrail.push({ time: addMins(caseData.receivedAt, 6),  who: 'J. Martinez', what: 'QA flag: damaged items' });
  auditTrail.push({ time: addMins(caseData.receivedAt, 8), who: 'D. Johnson', what: 'Transcription accessioner assigned' });
  if (submittedEntry) {
    const grossedTime = new Date(submittedEntry.submittedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    auditTrail.push({ time: grossedTime, who: 'J. Doe', what: 'IDF submitted — grossing complete' });
  }
  auditTrail.reverse();

  function handleScanComplete() {
    navigate(`/case/${caseData!.accessionNumber}/verify`);
  }

  function handleReprint() {
    toast({ message: 'Sent labels to printer (Bench 3)', variant: 'info' });
  }

  function routeStep(step: 'access' | 'gross' | 'lm' | 'if' | 'em' | 'path'): RouteStatus {
    const grossed = !!renalIdf;
    if (step === 'access') return 'done';
    if (step === 'gross') {
      if (grossed) return 'done';
      if (status === 'in_grossing') return 'active';
      return 'pending';
    }
    if (step === 'path') return status === 'finalized' ? 'done' : 'pending';
    if (!grossed) return 'pending';
    if (status === 'finalized') return 'done';
    if (step === 'em') {
      if (renalIdf?.noEmReason) return 'skipped';
      return emEnds !== null && emEnds > 0 ? 'active' : 'pending';
    }
    if (step === 'if') {
      return (ifPieces !== null && ifPieces > 0) || renalIdf?.paraffinIfEnabled ? 'active' : 'pending';
    }
    if (step === 'lm') return lmPieces !== null && lmPieces > 0 ? 'active' : 'pending';
    return 'pending';
  }

  // Map each bottle to which department procedures it routes to
  function getBottleDepts(m: Material): DeptAbbr[] {
    if (m.preservative === 'formalin')      return hasGlute ? ['LM'] : ['LM', 'EM'];
    if (m.preservative === 'michels')       return ['IF'];
    if (m.preservative === 'glutaraldehyde') return ['EM'];
    return [];
  }

  return (
    <div className="space-y-3">
      {/* Prior case strip */}
      {caseData.priorCaseAccession && (
        <div className="bg-amber-50 border border-amber-200 rounded-[8px] px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[12px] text-amber-800">
            <span className="font-semibold">Prior case:</span>{' '}
            <Link to={`/case/${caseData.priorCaseAccession}`} className="underline hover:text-amber-900">
              {caseData.priorCaseAccession}
            </Link>
            {' '}— age change, CR needed
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full shrink-0">
            Review
          </span>
        </div>
      )}

      {/* ── Case banner ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-arkana-gray-200 rounded-[8px] shadow-sm px-5 sm:px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-[6px]">
            {/* QA flag chip — only shown when flags exist */}
            {hasFlags && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] px-[10px] py-[3px] rounded-[20px] bg-arkana-red-light text-arkana-red border border-arkana-red/30">
                  <WarnSvg red /> {flags.length} QA Flag{flags.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {/* Accession + case type */}
            <div className="flex items-center gap-2.5">
              <h1 className="text-[26px] font-bold tracking-[-0.01em] text-arkana-black leading-none">
                {caseData.accessionNumber}
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-full bg-arkana-blue-light text-arkana-blue border border-blue-200 self-center">
                {caseData.caseType}
              </span>
            </div>
            {/* Patient */}
            <p className="text-[15px] font-semibold text-arkana-black">
              {caseData.patient.lastName}, {caseData.patient.firstName}
            </p>
            {/* Sub-info */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-arkana-gray-500">
              <span>DOB: {formatDob(caseData.patient.dateOfBirth)} ({calculateAge(caseData.patient.dateOfBirth)} y)</span>
              {caseData.submittingState && <span>State: {caseData.submittingState}</span>}
              <span>Received: {formatReceivedAt(caseData.receivedAt)}</span>
            </div>
            {caseData.physician && (
              <div className="text-[12px] text-arkana-gray-500 mt-0.5">
                <span className="font-semibold uppercase tracking-[0.06em] text-[10px] text-arkana-gray-400 mr-1.5">Assigned Pathologist:</span>
                {caseData.physician}
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-start">
            <Button variant="secondary" onClick={() => navigate(`/case/${caseData.accessionNumber}/gross`)}>
              Edit Grossing
            </Button>
          </div>
        </div>
      </div>

      {/* ── QA alert (only if flags exist) ────────────────────────────────── */}
      {hasFlags && (
        <div className="bg-arkana-red-light border border-arkana-red/40 rounded-[8px] px-4 py-3 flex items-start gap-3">
          <div className="shrink-0 mt-0.5 text-arkana-red"><WarnSvg red /></div>
          <div>
            <div className="text-[12px] font-bold text-arkana-red mb-1.5">
              Pre-Analytical QA Issues — Logged at Intake · Visible to All Departments
            </div>
            <div className="flex flex-wrap gap-1.5">
              {flags.map(f => (
                <span
                  key={f}
                  className={`text-[11px] font-semibold px-[10px] py-[2px] rounded-[12px] border ${
                    flagConfig[f].severity === 'danger'
                      ? 'bg-white border-arkana-red/40 text-arkana-red'
                      : 'bg-amber-50 border-amber-300 text-amber-700'
                  }`}
                >
                  {flagConfig[f].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column body ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">

        {/* ─── Main column ────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Specimens Received (bottle-centric) */}
          <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
            <CardHeader
              color="red" title="Specimens Received" icon={<FlaskSvg />}
              right={
                <span className="text-[10px] font-semibold text-arkana-gray-500">
                  {materials.length} container{materials.length !== 1 ? 's' : ''}
                  {unlabeled.length > 0 && (
                    <span className="ml-2 text-arkana-red font-bold">· {unlabeled.length} unlabeled</span>
                  )}
                </span>
              }
            />
            {renalIdf ? (
              <BottleReadonlyList idf={renalIdf} />
            ) : (
              <div className="p-[18px] space-y-2">
                {materials.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-arkana-gray-500">{i + 1}.</span>
                    <span className="font-medium text-arkana-black">{PRESERVATIVE_LABEL[m.preservative]}</span>
                    <span className="text-arkana-gray-400 italic">— awaiting grossing</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Special orders (conditional) */}
          {caseData.specialOrders.length > 0 && (
            <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
              <CardHeader color="amber" title="Special Orders" icon={<ShieldSvg />} />
              <div className="p-[18px] space-y-2">
                {caseData.specialOrders.map(o => (
                  <div key={o} className="text-[12px] text-amber-800 bg-amber-50 rounded-[6px] px-3 py-2 border border-amber-200 font-medium capitalize">
                    {o.replace(/_/g, ' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QA Findings — only if flags; only flagged items, no green clears */}
          {hasFlags && (
            <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
              <CardHeader
                color="amber" title="Pre-Analytical QA" icon={<ShieldSvg />}
                right={
                  <span className="text-[10px] font-bold bg-arkana-red-light text-arkana-red px-2 py-0.5 rounded-[10px]">
                    {flags.length} Flag{flags.length !== 1 ? 's' : ''}
                  </span>
                }
              />
              <div className="p-[18px] grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                {flags.map(f => (
                  <div
                    key={f}
                    className={`flex items-start gap-[10px] p-[10px] rounded-[6px] border ${
                      flagConfig[f].severity === 'danger'
                        ? 'bg-arkana-red-light border-arkana-red/30'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="shrink-0 mt-[1px]">
                      <WarnSvg red={flagConfig[f].severity === 'danger'} />
                    </div>
                    <div>
                      <div className={`text-[11px] font-bold ${
                        flagConfig[f].severity === 'danger' ? 'text-arkana-red' : 'text-amber-700'
                      }`}>
                        {flagConfig[f].label}
                      </div>
                      <div className="text-[10px] text-arkana-gray-500 mt-[2px]">Reported at intake</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ─── Sidebar ────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Department Summary */}
          <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
            <CardHeader color="red" title="Dept Summary" icon={<TableSvg />} />
            <div className="p-[14px] grid grid-cols-2 gap-2">
              <DeptStat label="LM Pieces" value={hasFormalin ? lmPieces : null} color="green" />
              <DeptStat label="IF Pieces" value={hasMichels  ? ifPieces : null} color="purple" />
              <DeptStat label="EM Ends"   value={(hasGlute || hasFormalin) ? emEnds : null} color="blue" />
              <DeptStat label="Total" value={total} dark />
            </div>
          </div>

          {/* Department Routing */}
          <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
            <CardHeader color="blue" title="Department Routing" icon={<RouteSvg />} />
            <div className="px-[18px] py-2">
              <RouteStep
                label="Accessioning"
                note={formatReceivedAt(caseData.receivedAt)}
                status={routeStep('access')}
              />
              <RouteStep
                label="Grossing"
                note={
                  renalIdf ? `J. Doe · ${new Date(submittedEntry!.submittedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                  : status === 'in_grossing' ? 'In progress'
                  : 'Awaiting'
                }
                status={routeStep('gross')}
              />
              {(hasFormalin || !!renalIdf) && (
                <RouteStep
                  label="Light Microscopy"
                  note={
                    lmPieces !== null && lmPieces > 0 ? `${lmPieces} piece${lmPieces !== 1 ? 's' : ''} · awaiting prep`
                    : panels.numberOfCores > 0 ? `${panels.numberOfCores} core${panels.numberOfCores !== 1 ? 's' : ''}`
                    : 'Awaiting tissue'
                  }
                  status={routeStep('lm')}
                />
              )}
              {(hasMichels || renalIdf?.paraffinIfEnabled) && (
                <RouteStep
                  label="Immunofluorescence"
                  note={
                    renalIdf?.paraffinIfEnabled ? 'Paraffin IF · from formalin core'
                    : ifPieces !== null && ifPieces > 0 ? `${ifPieces} piece${ifPieces !== 1 ? 's' : ''} · awaiting prep`
                    : 'Awaiting tissue'
                  }
                  status={routeStep('if')}
                />
              )}
              {(hasGlute || hasFormalin || !!renalIdf) && (
                <RouteStep
                  label="Electron Microscopy"
                  note={
                    renalIdf?.noEmReason ? `No ends — ${renalIdf.noEmReason}`
                    : emEnds !== null && emEnds > 0 ? `${emEnds} end${emEnds !== 1 ? 's' : ''} · awaiting prep`
                    : 'Awaiting tissue'
                  }
                  status={routeStep('em')}
                />
              )}
              <RouteStep label="Pathologist Review" note="Awaiting processing" status={routeStep('path')} isLast />
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-[8px] border border-arkana-gray-200 shadow-sm overflow-hidden">
            <CardHeader color="gray" title="Audit Trail" icon={<AuditSvg />} />
            <div className="px-[18px] py-2">
              {auditTrail.map((entry, i) => (
                <div key={i} className="flex gap-[10px] py-2 border-b border-arkana-gray-50 last:border-0 text-[11px]">
                  <span className="text-arkana-gray-500 whitespace-nowrap shrink-0 min-w-[64px]">{entry.time}</span>
                  <div>
                    <span className="font-semibold text-arkana-black mr-1.5">{entry.who}</span>
                    <span className="text-arkana-gray-500">{entry.what}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {scanOpen && (
        <ScanMaterialsDialog
          caseData={caseData}
          onClose={() => setScanOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
}
