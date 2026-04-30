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
  type RenalIdfState,
  type RenalProcedureKey,
  type BottleCounts,
  type RenalPreAnalyticalQa,
  type RenalBottleDefinition,
  type RenalBottleQaField,
  RENAL_BOTTLE_DEFINITIONS,
  RENAL_BOTTLE_QA_FINDINGS,
} from '../templates/renalIdf';
import type { Case, Preservative } from '../mock/types';
import { totalPiecesFromMeasurements } from '../lib/parseDictation';
import { parse, serialize } from '../lib/measurements';
import { MeasurementList } from './MeasurementList';
import {
  routeRenalDictation,
  applyToRenal,
} from '../lib/routeDictation';
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
  const { updateRenal, resetIdf, submitIdf } = useCaseSession();

  const presets = useMemo(() => RENAL_PRESETS, []);
  const activePreset = useRegisterDemoPresets(presets) ?? RENAL_PRESETS[0]!;
  const [pulsedKeys, setPulsedKeys] = useState<RenalProcedureKey[]>([]);
  const [extraBottleName, setExtraBottleName] = useState<string>('Glutaraldehyde');

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
      }
      return {
        ...current,
        procedures: { ...current.procedures, [key]: next },
      };
    });
  }

  function adjustBottleCount(key: keyof BottleCounts, delta: number) {
    updateRenal((current) => ({
      ...current,
      bottleCounts: {
        ...current.bottleCounts,
        [key]: Math.max(0, current.bottleCounts[key] + delta),
      },
    }));
  }

  function addExtraBottle() {
    const firstExtra = RENAL_BOTTLE_DEFINITIONS.find((d) => !d.isDefault);
    if (!firstExtra) return;
    updateRenal((current) => ({
      ...current,
      bottleCounts: {
        ...current.bottleCounts,
        [firstExtra.key]: Math.max(1, current.bottleCounts[firstExtra.key]),
      },
    }));
  }

  function removeBottle(key: keyof BottleCounts) {
    const def = RENAL_BOTTLE_DEFINITIONS.find((d) => d.key === key);
    if (!def) return;
    updateRenal((current) => ({
      ...current,
      bottleCounts: { ...current.bottleCounts, [key]: 0 },
      procedures: {
        ...current.procedures,
        [def.primaryProcedureKey]: {
          ...current.procedures[def.primaryProcedureKey],
          size: '',
          pieces: 0,
          descriptors: [],
          notes: '',
        },
      },
    }));
  }

  function toggleBottleQa(field: RenalBottleQaField, itemKey: string) {
    updateRenal((current) => {
      const arr = current.preAnalyticalQa[field] as string[];
      return {
        ...current,
        preAnalyticalQa: {
          ...current.preAnalyticalQa,
          [field]: arr.includes(itemKey)
            ? arr.filter((v) => v !== itemKey)
            : [...arr, itemKey],
        },
      };
    });
  }

  function setBottleComment(key: keyof BottleCounts, value: string) {
    updateRenal((current) => ({
      ...current,
      preAnalyticalQa: {
        ...current.preAnalyticalQa,
        bottleComments: { ...current.preAnalyticalQa.bottleComments, [key]: value },
      },
    }));
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

      if (activePreset.procedurePatch) {
        const procedures = { ...next.procedures };
        for (const [key, patch] of Object.entries(activePreset.procedurePatch) as [RenalProcedureKey, { descriptors?: TissueDescriptor[] }][]) {
          procedures[key] = { ...procedures[key], ...patch };
        }
        next = { ...next, procedures };
      }

      // Distribute any procedure-level descriptors (from dictation thin-detect
      // or preset patches) onto each per-piece measurement, then clear the
      // bottle-level field so it doesn't double up in the UI.
      const distributedProcedures = { ...next.procedures };
      for (const [key, proc] of Object.entries(distributedProcedures) as [RenalProcedureKey, RenalIdfState['procedures'][RenalProcedureKey]][]) {
        if (proc.descriptors.length === 0) continue;
        const ms = parse(proc.size);
        if (ms.length === 0) continue;
        const merged = ms.map((m) => ({
          ...m,
          descriptors: Array.from(new Set([...m.descriptors, ...proc.descriptors])),
        }));
        distributedProcedures[key] = {
          ...proc,
          size: serialize(merged),
          descriptors: [],
        };
      }
      next = { ...next, procedures: distributedProcedures };

      return next;
    });

    const touchedKeys = new Set<RenalProcedureKey>();
    for (const r of routed) {
      if (r.measurements.length === 0) continue;
      for (const t of r.targets) {
        touchedKeys.add(t as RenalProcedureKey);
      }
    }

    setPulsedKeys(Array.from(touchedKeys));
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
    submitIdf();
    toast({ message: 'IDF submitted to TX queue', variant: 'success' });
    navigate(`/case/${caseData.accessionNumber}/summary`);
  }

  const hasAnyExtraBottle = RENAL_BOTTLE_DEFINITIONS.some(
    (d) => !d.isDefault && idf.bottleCounts[d.key] > 0,
  );

  return (
    <div className="space-y-5">
      <FormHeader caseData={caseData} onReset={handleReset} />

      <Card title="Dictation">
        <DictationMic
          onTranscriptComplete={handleTranscriptComplete}
          presetTranscript={activePreset.displayTranscript ?? activePreset.transcript}
          routingTranscript={activePreset.displayTranscript ? activePreset.transcript : undefined}
          hint="Tap mic to dictate. Say bottle keywords (formalin, michel's, glute) to route measurements to the matching bottle card."
        />
      </Card>

      {RENAL_BOTTLE_DEFINITIONS.filter(
        (def) => def.isDefault || idf.bottleCounts[def.key] > 0,
      ).map((def) => {
        const procedure = idf.procedures[def.primaryProcedureKey];
        const titleNode = def.isRenameable ? (
          <input
            type="text"
            value={extraBottleName}
            onChange={(e) => setExtraBottleName(e.target.value)}
            className="bg-transparent border-b border-dashed border-arkana-gray-200 focus:border-arkana-red focus:outline-none text-base font-semibold text-arkana-black w-48"
            aria-label="Bottle name"
          />
        ) : (
          def.label
        );
        return (
          <BottleCard
            key={def.key}
            definition={def}
            title={titleNode}
            count={idf.bottleCounts[def.key]}
            onCountAdjust={(d) => adjustBottleCount(def.key, d)}
            procedure={procedure}
            qa={idf.preAnalyticalQa}
            onPatchProcedure={(patch) => patchProcedure(def.primaryProcedureKey, patch)}
            onToggleQa={toggleBottleQa}
            onCommentChange={(v) => setBottleComment(def.key, v)}
            comment={idf.preAnalyticalQa.bottleComments[def.key]}
            pulsed={pulsedKeys.includes(def.primaryProcedureKey)}
            onRemove={!def.isDefault ? () => removeBottle(def.key) : undefined}
          >
            {def.routedTiles.length > 0 && (
              <RoutedPanels>
                {def.routedTiles.map((tile) => (
                  <PanelTile
                    key={tile.procedureKey}
                    title={tile.title}
                    subtitle={tile.subtitle}
                  >
                    {tile.inputKind === 'pieces' && (
                      <PiecesInput
                        value={idf.procedures[tile.procedureKey].pieces}
                        onChange={(v) => patchProcedure(tile.procedureKey, { pieces: Math.max(0, v) })}
                        unitSingular={tile.unitSingular ?? 'piece'}
                        unitPlural={tile.unitPlural ?? 'pieces'}
                      />
                    )}
                  </PanelTile>
                ))}
              </RoutedPanels>
            )}
          </BottleCard>
        );
      })}

      {!hasAnyExtraBottle && (
        <button
          type="button"
          onClick={addExtraBottle}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-arkana-gray-200 text-arkana-gray-500 hover:border-arkana-red hover:text-arkana-red transition text-sm font-medium"
        >
          + Add bottle
        </button>
      )}

      <GlobalQaCard
        qa={idf.preAnalyticalQa}
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

// ─── Validation ─────────────────────────────────────────────────────────────

function collectRenalValidationErrors(
  idf: RenalIdfState,
  caseData: Case,
  expectedBottles?: Preservative[],
): string[] {
  const errors: string[] = [];

  const preservatives = new Set<Preservative>(
    expectedBottles && expectedBottles.length > 0
      ? expectedBottles
      : caseData.materials.map((m) => m.preservative),
  );

  const lmHas = parse(idf.procedures.lightMicroscopy.size).length > 0;
  const ifHas = parse(idf.procedures.immunofluorescence.size).length > 0;
  const emHas = parse(idf.procedures.electronMicroscopy.size).length > 0;

  if (preservatives.has('formalin') && !lmHas) {
    errors.push(
      'Formalin bottle received — formalin card needs at least one measurement.',
    );
  }
  if (preservatives.has('michels') && !ifHas) {
    errors.push(
      "Michel's bottle received — Michel's card needs at least one measurement.",
    );
  }
  if (errors.length === 0 && preservatives.size === 0 && !lmHas && !ifHas && !emHas) {
    errors.push('At least one bottle card needs a measurement.');
  }

  return errors;
}

// ─── Bottle Card ────────────────────────────────────────────────────────────

interface BottleCardProps {
  definition: RenalBottleDefinition;
  title: React.ReactNode;
  count: number;
  onCountAdjust: (delta: number) => void;
  procedure: RenalIdfState['procedures'][RenalProcedureKey];
  qa: RenalPreAnalyticalQa;
  onPatchProcedure: (patch: Partial<RenalIdfState['procedures'][RenalProcedureKey]>) => void;
  onToggleQa: (field: RenalBottleQaField, itemKey: string) => void;
  onCommentChange: (value: string) => void;
  comment: string;
  pulsed: boolean;
  onRemove?: () => void;
  children?: React.ReactNode;
}

function BottleCard({
  definition,
  title,
  count,
  onCountAdjust,
  procedure,
  qa,
  onPatchProcedure,
  onToggleQa,
  onCommentChange,
  comment,
  pulsed,
  onRemove,
  children,
}: BottleCardProps) {
  const itemKey = definition.itemKey;
  const [commentOpen, setCommentOpen] = useState<boolean>(!!comment);
  const noTissue = qa.noTissueInBottle.includes(itemKey);

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-colors duration-700 ${
        pulsed ? 'border-arkana-red bg-arkana-red-light/30' : 'border-arkana-gray-200'
      }`}
    >
      <div className="px-5 py-4 border-b border-arkana-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="text-base font-semibold text-arkana-black">{title}</div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-arkana-gray-500 hover:text-arkana-red"
            >
              Remove
            </button>
          )}
        </div>

        <div className="flex items-start gap-x-6 gap-y-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500">
              # Bottles
            </span>
            <BottleStepper count={count} onAdjust={onCountAdjust} />
          </div>

          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mt-1.5">
              Received:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RENAL_BOTTLE_QA_FINDINGS.map(({ label, field }) => (
                <QaChip
                  key={field}
                  label={label}
                  selected={(qa[field] as string[]).includes(itemKey)}
                  onClick={() => onToggleQa(field, itemKey)}
                />
              ))}
              <QaChip
                label="Other"
                selected={commentOpen || !!comment}
                onClick={() => setCommentOpen((v) => !v)}
              />
            </div>
          </div>
        </div>
      </div>

      {(commentOpen || !!comment) && (
        <div className="px-5 pt-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Other finding…"
            className="w-full h-9 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>
      )}

      <div className="px-5 py-4 space-y-4">
        {!noTissue && (
          <MeasurementList
            value={procedure.size}
            onChange={(next) => onPatchProcedure({ size: next })}
            fragmentNoun={definition.fragmentSingular}
          />
        )}

        {noTissue && (
          <p className="text-sm text-arkana-gray-500 italic">
            No tissue received — measurements and descriptors hidden.
          </p>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Notes
          </label>
          <input
            type="text"
            value={procedure.notes}
            placeholder="e.g. other colors different from tan"
            onChange={(e) => onPatchProcedure({ notes: e.target.value })}
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>
      </div>

      {!noTissue && children && (
        <div className="px-5 pb-5 pt-4 border-t border-arkana-gray-100 bg-arkana-gray-50/60 rounded-b-2xl">
          <div className="text-[10px] uppercase tracking-wide font-bold text-arkana-gray-400 mb-2">
            Routes to
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function PiecesInput({
  value,
  onChange,
  unitSingular,
  unitPlural,
}: {
  value: number;
  onChange: (next: number) => void;
  unitSingular: string;
  unitPlural: string;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
        placeholder="0"
        aria-label={`Number of ${unitPlural}`}
        className="w-20 h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
      />
      <span className="text-xs text-arkana-gray-500">
        {value === 1 ? unitSingular : unitPlural}
      </span>
    </div>
  );
}

function BottleStepper({ count, onAdjust }: { count: number; onAdjust: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-arkana-gray-500">#</span>
      <span className="w-5 text-center text-sm font-semibold tabular-nums text-arkana-black">
        {count}
      </span>
      <div className="flex flex-col gap-px">
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="w-5 h-3.5 rounded border border-arkana-gray-200 text-arkana-gray-400 hover:border-arkana-gray-400 flex items-center justify-center text-[9px] leading-none transition"
          aria-label="Increase bottle count"
        >▲</button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          disabled={count === 0}
          className="w-5 h-3.5 rounded border border-arkana-gray-200 text-arkana-gray-400 hover:border-arkana-gray-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-[9px] leading-none transition"
          aria-label="Decrease bottle count"
        >▼</button>
      </div>
    </div>
  );
}

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

function RoutedPanels({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  );
}

function PanelTile({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-arkana-gray-200 bg-white px-4 py-3">
      <div className="text-sm font-semibold text-arkana-black">{title}</div>
      {subtitle && (
        <div className="text-xs text-arkana-gray-500 mt-0.5">{subtitle}</div>
      )}
      {children}
    </div>
  );
}

// ─── Global Pre-Analytical QA (non-bottle flags) ────────────────────────────

function GlobalQaCard({
  qa,
  onQaChange,
}: {
  qa: RenalPreAnalyticalQa;
  onQaChange: (next: RenalPreAnalyticalQa) => void;
}) {
  return (
    <Card title="Pre-Analytical QA">
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
    </Card>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

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
