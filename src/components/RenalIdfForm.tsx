import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Tag } from './ui/Tag';
import { DictationMic } from './DictationMic';
import { useCaseSession } from '../state/CaseSessionContext';
import { useRegisterDemoPresets } from '../state/DemoPresetContext';
import { useToast } from './ToastHost';
import {
  RENAL_IDF_TEMPLATE,
  type RenalIdfState,
  type RenalProcedureKey,
  type BottleCounts,
  type RenalPreAnalyticalQa,
  getRenalSpecimenCategoryLabel,
} from '../templates/renalIdf';
import type { Case, Preservative } from '../mock/types';
import {
  detectThinFromSize,
  totalPiecesFromMeasurements,
} from '../lib/parseDictation';
import { parse } from '../lib/measurements';
import { MeasurementList } from './MeasurementList';
import {
  routeRenalDictation,
  applyToRenal,
} from '../lib/routeDictation';
import { DescriptorChips } from './DescriptorChips';
import { PifChip } from './PifChip';
import type { TissueDescriptor } from '../templates/descriptors';

interface Props {
  caseData: Case;
  idf: RenalIdfState;
}

interface RenalPreset {
  id: string;
  label: string;
  transcript: string;
  displayTranscript?: string;
  bottles: Preservative[];
  procedurePatch?: Partial<Record<RenalProcedureKey, { descriptors?: TissueDescriptor[] }>>;
}

const RENAL_PRESETS: RenalPreset[] = [
  {
    id: 'normal-case',
    label: 'Normal case',
    bottles: ['formalin', 'michels', 'glutaraldehyde'],
    displayTranscript:
      "Received in Michel's are 2 pieces of tissue, measuring 0.8 and 0.9 cm. The tissue appearance is tan.\n" +
      "Received in Formalin are 3 pieces of tissue, measuring 0.5, 0.7, and 1.0 cm. The tissue appearance is tan.\n" +
      "2 ends are submitted for EM processing.",
    transcript:
      "michel's one at zero point eight by zero point one by zero point one comma one at zero point nine by zero point one by zero point one " +
      "formalin one at zero point five by zero point one by zero point one comma one at zero point seven by zero point one by zero point one comma one at one point zero by zero point one by zero point one " +
      "glute",
    procedurePatch: {
      lightMicroscopy: { descriptors: ['tan'] },
      immunofluorescence: { descriptors: ['tan'] },
    },
  },
  {
    id: 'special-case',
    label: 'Special case',
    bottles: ['formalin'],
    transcript:
      'formalin three at one point two by zero point one by zero point one comma two at zero point eight by zero point one by zero point one',
  },
];

export function RenalIdfForm({ caseData, idf }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateRenal, resetIdf } = useCaseSession();

  const presets = useMemo(() => RENAL_PRESETS, []);
  const activePreset = useRegisterDemoPresets(presets) ?? RENAL_PRESETS[0]!;
  const [pulsedKeys, setPulsedKeys] = useState<RenalProcedureKey[]>([]);
  const [lastSource, setLastSource] = useState<Partial<Record<RenalProcedureKey, string>>>({});

  useEffect(() => {
    if (pulsedKeys.length === 0) return;
    const t = window.setTimeout(() => setPulsedKeys([]), 1400);
    return () => window.clearTimeout(t);
  }, [pulsedKeys]);

  function patchProcedure(
    key: RenalProcedureKey,
    patch: Partial<RenalIdfState['procedures'][RenalProcedureKey]>,
  ) {
    updateRenal((current) => {
      const next = { ...current.procedures[key], ...patch };
      if (patch.size !== undefined) {
        const all = next.size.split(',').map((s) => s.trim()).filter(Boolean);
        next.pieces = totalPiecesFromMeasurements(all);
        if (
          detectThinFromSize(next.size) &&
          !next.descriptors.includes('thin')
        ) {
          next.descriptors = [...next.descriptors, 'thin'];
        }
      }
      return {
        ...current,
        procedures: { ...current.procedures, [key]: next },
      };
    });
  }

  function toggleDescriptor(key: RenalProcedureKey, value: TissueDescriptor) {
    const current = idf.procedures[key].descriptors;
    patchProcedure(key, {
      descriptors: current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    });
  }

  function handleTranscriptComplete(transcript: string) {
    const { routed } = routeRenalDictation(transcript);

    updateRenal((current) => {
      let next = applyToRenal(current, routed);

      next = {
        ...next,
        bottleCounts: {
          formalin: activePreset.bottles.includes('formalin') ? 1 : next.bottleCounts.formalin,
          michels: activePreset.bottles.includes('michels') ? 1 : next.bottleCounts.michels,
          glutaraldehyde: activePreset.bottles.includes('glutaraldehyde') ? 1 : next.bottleCounts.glutaraldehyde,
        },
      };

      // Apply any per-procedure patches (e.g. descriptors) defined in the preset
      if (activePreset.procedurePatch) {
        const procedures = { ...next.procedures };
        for (const [key, patch] of Object.entries(activePreset.procedurePatch) as [RenalProcedureKey, { descriptors?: TissueDescriptor[] }][]) {
          procedures[key] = { ...procedures[key], ...patch };
        }
        next = { ...next, procedures };
      }

      return next;
    });

    const touchedKeys = new Set<RenalProcedureKey>();
    const newSource: Partial<Record<RenalProcedureKey, string>> = {};
    for (const r of routed) {
      if (r.measurements.length === 0) continue;
      for (const t of r.targets) {
        const key = t as RenalProcedureKey;
        touchedKeys.add(key);
        newSource[key] = `via ${r.sourceKeyword ?? 'default'}${
          r.targets.length > 1 ? ' (fanned out)' : ''
        }`;
      }
    }

    setPulsedKeys(Array.from(touchedKeys));
    setLastSource((prev) => ({ ...prev, ...newSource }));
    if (touchedKeys.size === 0) {
      toast({
        message: "Couldn't route any measurements — please add manually.",
        variant: 'warning',
      });
    } else {
      toast({
        message: `Dictation routed to ${touchedKeys.size} section${
          touchedKeys.size === 1 ? '' : 's'
        }`,
        variant: 'success',
      });
    }
  }

  function handleReset() {
    if (window.confirm('Reset all fields on this form? This cannot be undone.')) {
      resetIdf();
      setPulsedKeys([]);
      setLastSource({});
      setRoutingLog([]);
      toast({ message: 'Form reset', variant: 'info' });
    }
  }

  const validationErrors = collectRenalValidationErrors(
    idf,
    caseData,
    activePreset.bottles,
  );

  function handleSubmit() {
    if (validationErrors.length > 0) {
      toast({ message: validationErrors[0]!, variant: 'warning' });
      return;
    }
    toast({ message: 'IDF submitted to TX queue', variant: 'success' });
    navigate(`/case/${caseData.accessionNumber}/summary`);
  }

  return (
    <div className="space-y-5">
      <FormHeader
        caseData={caseData}
        onReset={handleReset}
      />

      <Card title="Dictation">
        <DictationMic
          onTranscriptComplete={handleTranscriptComplete}
          presetTranscript={activePreset.displayTranscript ?? activePreset.transcript}
          routingTranscript={activePreset.displayTranscript ? activePreset.transcript : undefined}
          hint="Tap mic to dictate. Say bottle keywords (formalin, michel's, glute) to auto-route to LM / IF / EM."
        />

      </Card>

      <Card title="Procedures">
        <div className="space-y-3">
          {RENAL_IDF_TEMPLATE.procedureRows.map((row) => {
            const state = idf.procedures[row.key];
            const isPulsed = pulsedKeys.includes(row.key);
            const sourceLabel = lastSource[row.key];
            return (
              <div
                key={row.key}
                className={`border rounded-xl p-4 transition-colors duration-700 ${
                  isPulsed
                    ? 'bg-arkana-red-light/40 border-arkana-red'
                    : 'bg-white border-arkana-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <div className="text-base font-semibold text-arkana-black">
                      {row.label}
                    </div>
                    <div className="text-xs text-arkana-gray-500 mt-0.5">{row.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sourceLabel && (
                      <span className="text-[11px] uppercase tracking-wide text-arkana-red font-medium">
                        {sourceLabel}
                      </span>
                    )}
                    <PifChip
                      isPif={state.isPif}
                      reason={state.pifReason}
                      onSet={(reason) =>
                        patchProcedure(row.key, { isPif: true, pifReason: reason })
                      }
                      onClear={() =>
                        patchProcedure(row.key, { isPif: false, pifReason: null })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <MeasurementList
                    value={state.size}
                    onChange={(next) => patchProcedure(row.key, { size: next })}
                    fragmentNoun="piece"
                  />
                  <DescriptorChips
                    selected={state.descriptors}
                    onToggle={(v) => toggleDescriptor(row.key, v)}
                  />
                  <div>
                    <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
                      Notes (other)
                    </label>
                    <input
                      type="text"
                      value={state.notes}
                      placeholder="e.g. other colors different from tan"
                      onChange={(e) => patchProcedure(row.key, { notes: e.target.value })}
                      className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <BottlesAndQaCard
        counts={idf.bottleCounts}
        qa={idf.preAnalyticalQa}
        onCountsChange={(counts) =>
          updateRenal((current) => ({ ...current, bottleCounts: counts }))
        }
        onQaChange={(qa) =>
          updateRenal((current) => ({ ...current, preAnalyticalQa: qa }))
        }
      />

      <Card title="Comments">
        <textarea
          value={idf.comments}
          onChange={(e) => updateRenal((current) => ({ ...current, comments: e.target.value }))}
          rows={4}
          placeholder="Free-text notes..."
          className="w-full rounded-xl border border-arkana-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
        />
      </Card>

      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-arkana-red bg-arkana-red-light/40 p-3">
          <div className="text-xs uppercase tracking-wide font-bold text-arkana-red-dark mb-1">
            Cannot submit yet
          </div>
          <ul className="text-sm text-arkana-red-dark space-y-0.5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>· {err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-3 flex-wrap">
        <Button variant="ghost" onClick={handleReset}>
          Reset form
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={validationErrors.length > 0}
        >
          Submit IDF
        </Button>
      </div>
    </div>
  );
}

function collectRenalValidationErrors(
  idf: RenalIdfState,
  caseData: Case,
  expectedBottles?: Preservative[],
): string[] {
  const errors: string[] = [];

  // Source of truth for which bottles are "in play":
  //   1. The active demo preset (e.g. selecting "1-bottle: formalin only"
  //      narrows expected bottles to ['formalin'])
  //   2. Fallback to the case's actual received materials (production path)
  const preservatives = new Set<Preservative>(
    expectedBottles && expectedBottles.length > 0
      ? expectedBottles
      : caseData.materials.map((m) => m.preservative),
  );

  const lmHas = parse(idf.procedures.lightMicroscopy.size).length > 0;
  const ifHas = parse(idf.procedures.immunofluorescence.size).length > 0;
  const emHas = parse(idf.procedures.electronMicroscopy.size).length > 0;

  const lmPif = idf.procedures.lightMicroscopy.isPif;
  const ifPif = idf.procedures.immunofluorescence.isPif;
  const emPif = idf.procedures.electronMicroscopy.isPif;

  // Bottle-keyed required sections — each bottle implies a target procedure
  // that must carry at least one measurement, OR be explicitly marked PIF
  // (no tissue available, with a reason).
  if (preservatives.has('formalin') && !lmHas && !lmPif) {
    errors.push(
      'Formalin bottle received — Light Microscopy needs at least one measurement (or mark as PIF).',
    );
  }
  if (preservatives.has('michels') && !ifHas && !ifPif) {
    errors.push(
      "Michel's bottle received — Immunofluorescence needs at least one measurement (or mark as PIF).",
    );
  }
  // Fallback when no bottle rules apply (no preset selected and no materials).
  if (errors.length === 0 && preservatives.size === 0 && !lmHas && !ifHas && !emHas) {
    errors.push(
      'At least one procedure (Light Microscopy, Immunofluorescence, or Electron Microscopy) needs a measurement.',
    );
  }

  return errors;
}

// ─── Bottles Received & Pre-Analytical QA ────────────────────────────────────

type BottleQaField = keyof Pick<
  RenalPreAnalyticalQa,
  'damagedItems' | 'materialsNotLabeled' | 'foreignBottle' | 'noTissueInBottle' | 'bottleLeaked'
>;

const PER_BOTTLE_QA: { label: string; field: BottleQaField }[] = [
  { label: 'Damaged', field: 'damagedItems' },
  { label: 'Not Labeled', field: 'materialsNotLabeled' },
  { label: 'Foreign Bottle', field: 'foreignBottle' },
  { label: 'No Tissue', field: 'noTissueInBottle' },
  { label: 'Leaked', field: 'bottleLeaked' },
];

const BOTTLE_QA_ROWS: {
  countKey: keyof BottleCounts;
  itemKey: string;
  label: string;
}[] = [
  { countKey: 'formalin', itemKey: 'formalin_bottle', label: 'Formalin' },
  { countKey: 'michels', itemKey: 'michels_bottle', label: "Michel's" },
  { countKey: 'glutaraldehyde', itemKey: 'glutaraldehyde_bottle', label: 'Glutaraldehyde' },
];

function QaChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 h-7 rounded-full border text-xs font-medium transition ${
        selected
          ? 'border-arkana-red bg-arkana-red-light text-arkana-red-dark'
          : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-400'
      }`}
    >
      {selected ? '✓ ' : ''}{label}
    </button>
  );
}

function BottlesAndQaCard({
  counts,
  qa,
  onCountsChange,
  onQaChange,
}: {
  counts: BottleCounts;
  qa: RenalPreAnalyticalQa;
  onCountsChange: (next: BottleCounts) => void;
  onQaChange: (next: RenalPreAnalyticalQa) => void;
}) {
  const [openComments, setOpenComments] = useState<Set<keyof BottleCounts>>(new Set());

  function adjustCount(key: keyof BottleCounts, delta: number) {
    onCountsChange({ ...counts, [key]: Math.max(0, counts[key] + delta) });
  }

  function toggleBottleQa(field: BottleQaField, itemKey: string) {
    const arr = qa[field] as string[];
    onQaChange({
      ...qa,
      [field]: arr.includes(itemKey) ? arr.filter((v) => v !== itemKey) : [...arr, itemKey],
    });
  }

  function toggleComment(key: keyof BottleCounts) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setBottleComment(key: keyof BottleCounts, value: string) {
    onQaChange({
      ...qa,
      bottleComments: { ...qa.bottleComments, [key]: value },
    });
  }

  return (
    <Card title="Received & Pre-Analytical QA">
      <div className="space-y-2">
        {BOTTLE_QA_ROWS.map(({ countKey, itemKey, label }) => {
          const commentOpen = openComments.has(countKey) || !!qa.bottleComments[countKey];
          return (
            <div key={countKey}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-arkana-gray-500 w-28 shrink-0">{label}</span>

                {/* compact stepper: count + stacked ▲/▼ */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-5 text-center text-sm font-semibold tabular-nums text-arkana-black">
                    {counts[countKey]}
                  </span>
                  <div className="flex flex-col gap-px">
                    <button
                      type="button"
                      onClick={() => adjustCount(countKey, 1)}
                      className="w-5 h-3.5 rounded border border-arkana-gray-200 text-arkana-gray-400 hover:border-arkana-gray-400 flex items-center justify-center text-[9px] leading-none transition"
                      aria-label={`Increase ${label}`}
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => adjustCount(countKey, -1)}
                      disabled={counts[countKey] === 0}
                      className="w-5 h-3.5 rounded border border-arkana-gray-200 text-arkana-gray-400 hover:border-arkana-gray-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[9px] leading-none transition"
                      aria-label={`Decrease ${label}`}
                    >▼</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 ml-3">
                  {PER_BOTTLE_QA.map(({ label: chipLabel, field }) => (
                    <QaChip
                      key={field}
                      label={chipLabel}
                      selected={(qa[field] as string[]).includes(itemKey)}
                      onClick={() => toggleBottleQa(field, itemKey)}
                    />
                  ))}
                  <QaChip
                    label="Other"
                    selected={commentOpen}
                    onClick={() => toggleComment(countKey)}
                  />
                </div>
              </div>

              {commentOpen && (
                <input
                  type="text"
                  value={qa.bottleComments[countKey]}
                  onChange={(e) => setBottleComment(countKey, e.target.value)}
                  placeholder={`${label} note...`}
                  autoFocus
                  className="mt-1.5 ml-[8.5rem] w-[calc(100%-8.5rem)] h-7 rounded-lg border border-arkana-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-arkana-red"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-arkana-gray-100">
        <div className="text-[10px] uppercase tracking-wide font-bold text-arkana-gray-400 mb-2">
          Other QA Flags
        </div>
        <div className="flex flex-wrap gap-1.5">
          <QaChip
            label="FedEx Package Damaged"
            selected={qa.damagedItems.includes('fedex_package')}
            onClick={() => {
              const arr = qa.damagedItems;
              onQaChange({
                ...qa,
                damagedItems: arr.includes('fedex_package')
                  ? arr.filter((v) => v !== 'fedex_package')
                  : [...arr, 'fedex_package'],
              });
            }}
          />
          <QaChip
            label="No Paperwork"
            selected={qa.noPaperworkReceived}
            onClick={() => onQaChange({ ...qa, noPaperworkReceived: !qa.noPaperworkReceived })}
          />
          <QaChip
            label="Specimens In One Package"
            selected={qa.specimensInOnePackage}
            onClick={() => onQaChange({ ...qa, specimensInOnePackage: !qa.specimensInOnePackage })}
          />
        </div>
        {qa.specimensInOnePackage && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={qa.specimensCount}
              onChange={(e) => onQaChange({ ...qa, specimensCount: e.target.value })}
              placeholder="Count"
              className="w-14 h-7 rounded-lg border border-arkana-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-arkana-red"
            />
            <input
              type="text"
              value={qa.specimensFrom}
              onChange={(e) => onQaChange({ ...qa, specimensFrom: e.target.value })}
              placeholder="From..."
              className="flex-1 h-7 rounded-lg border border-arkana-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-arkana-red"
            />
          </div>
        )}
        <input
          type="text"
          value={qa.other}
          onChange={(e) => onQaChange({ ...qa, other: e.target.value })}
          placeholder="Other findings..."
          className="mt-2 w-full h-7 rounded-lg border border-arkana-gray-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-arkana-red"
        />
      </div>
    </Card>
  );
}



function formatDob(dob: string): string {
  const [year, month, day] = dob.split('-');
  return `${month}/${day}/${year}`;
}

function formatReceivedDate(iso: string | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

interface HeaderProps {
  caseData: Case;
  onReset: () => void;
}

function FormHeader({ caseData, onReset }: HeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between px-6 py-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl font-bold text-arkana-black tracking-arkana-tight">
              {caseData.accessionNumber}
            </h1>
            <Tag variant="info">{caseData.caseType}</Tag>
            {caseData.submittingState && (
              <Tag variant="neutral">{caseData.submittingState}</Tag>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="text-sm font-medium text-arkana-ink">
              {caseData.patient.firstName} {caseData.patient.lastName}
            </span>
            <span className="text-arkana-gray-200 select-none">·</span>
            <span className="text-sm text-arkana-gray-500">
              DOB {formatDob(caseData.patient.dateOfBirth)}
            </span>
            <span className="text-arkana-gray-200 select-none">·</span>
            <span className="text-sm text-arkana-gray-500">
              Received {formatReceivedDate(caseData.receivedAt)}
            </span>
          </div>
        </div>
        <Button variant="secondary" onClick={onReset}>
          ↻ Reset
        </Button>
      </div>
    </div>
  );
}
