import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Tag } from './ui/Tag';
import { DictationMic } from './DictationMic';
import { useCaseSession } from '../state/CaseSessionContext';
import { useToast } from './ToastHost';
import {
  RENAL_IDF_TEMPLATE,
  type RenalIdfState,
  type RenalProcedureKey,
  getRenalSpecimenCategoryLabel,
} from '../templates/renalIdf';
import type { Case } from '../mock/types';
import { detectThinFromSize } from '../lib/parseDictation';
import {
  routeRenalDictation,
  applyToRenal,
  type RoutedClause,
} from '../lib/routeDictation';
import { DescriptorChips } from './DescriptorChips';
import type { TissueDescriptor } from '../templates/descriptors';

interface Props {
  caseData: Case;
  idf: RenalIdfState;
}

const PRESET_TRANSCRIPTS: { id: string; label: string; transcript: string }[] = [
  {
    id: 'three-bottle',
    label: '3-bottle: formalin + michel + glute',
    transcript:
      "formalin two at one point one by zero point one by zero point one comma three at zero point nine by zero point one by zero point one michel's two at one point five by zero point one by zero point one glute one at zero point five by zero point one by zero point one",
  },
  {
    id: 'two-bottle',
    label: '2-bottle: formalin + michel (no glute → fan-out)',
    transcript:
      "formalin three at one point two by zero point one by zero point one comma two at zero point eight by zero point one by zero point one michel's two at one point four by zero point one by zero point one",
  },
  {
    id: 'one-bottle',
    label: '1-bottle: formalin only (fans to LM + EM)',
    transcript:
      'formalin three at one point two by zero point one by zero point one comma two at zero point eight by zero point one by zero point one',
  },
];

export function RenalIdfForm({ caseData, idf }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateRenal, resetIdf } = useCaseSession();

  const [presetId, setPresetId] = useState(PRESET_TRANSCRIPTS[0]!.id);
  const [pulsedKeys, setPulsedKeys] = useState<RenalProcedureKey[]>([]);
  const [lastSource, setLastSource] = useState<Partial<Record<RenalProcedureKey, string>>>({});
  const [routingLog, setRoutingLog] = useState<RoutedClause[]>([]);
  const [logOpen, setLogOpen] = useState(true);

  useEffect(() => {
    if (pulsedKeys.length === 0) return;
    const t = window.setTimeout(() => setPulsedKeys([]), 1400);
    return () => window.clearTimeout(t);
  }, [pulsedKeys]);

  const activePreset =
    PRESET_TRANSCRIPTS.find((p) => p.id === presetId) ?? PRESET_TRANSCRIPTS[0]!;

  function patchProcedure(
    key: RenalProcedureKey,
    patch: Partial<RenalIdfState['procedures'][RenalProcedureKey]>,
  ) {
    updateRenal((current) => {
      const next = { ...current.procedures[key], ...patch };
      if (patch.size !== undefined && detectThinFromSize(next.size)) {
        if (!next.descriptors.includes('thin')) {
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

    updateRenal((current) => applyToRenal(current, routed));

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
    setRoutingLog(routed);

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

  function handleSubmit() {
    toast({ message: 'IDF submitted to TX queue', variant: 'success' });
    navigate(`/case/${caseData.accessionNumber}/summary`);
  }

  function toggleQa(value: typeof idf.preAnalyticalQa[number]) {
    updateRenal((current) => ({
      ...current,
      preAnalyticalQa: current.preAnalyticalQa.includes(value)
        ? current.preAnalyticalQa.filter((v) => v !== value)
        : [...current.preAnalyticalQa, value],
    }));
  }

  return (
    <div className="space-y-5">
      <FormHeader
        templateName={RENAL_IDF_TEMPLATE.name}
        templateSource={RENAL_IDF_TEMPLATE.source}
        categoryLabel={getRenalSpecimenCategoryLabel(caseData.specimenCategory)}
        caseData={caseData}
        onReset={handleReset}
      />

      <Card title="Dictation">
        <div className="mb-3">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
            Demo preset
          </label>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red bg-white"
          >
            {PRESET_TRANSCRIPTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <DictationMic
          onTranscriptComplete={handleTranscriptComplete}
          presetTranscript={activePreset.transcript}
          hint="Tap mic to dictate. Say bottle keywords (formalin, michel's, glute) to auto-route to LM / IF / EM."
        />

        {routingLog.length > 0 && (
          <div className="mt-3 border border-arkana-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 h-10 text-xs uppercase tracking-wide font-bold text-arkana-gray-500 hover:bg-arkana-gray-50 transition"
            >
              <span>Routing log ({routingLog.length} clause{routingLog.length === 1 ? '' : 's'})</span>
              <span aria-hidden>{logOpen ? '▾' : '▸'}</span>
            </button>
            {logOpen && (
              <div className="border-t border-arkana-gray-200 divide-y divide-arkana-gray-200">
                {routingLog.map((r, idx) => (
                  <div key={idx} className="px-4 py-2 text-xs">
                    <div className="text-arkana-black font-mono break-words">
                      {r.sourceText}
                    </div>
                    <div className="text-arkana-gray-500 mt-0.5">
                      → {r.targets.map(humanLabel).join(', ') || '(no measurements)'}{' '}
                      <span className="text-arkana-gray-500">·</span>{' '}
                      <span className="italic">{r.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
                  {sourceLabel && (
                    <span className="text-[11px] uppercase tracking-wide text-arkana-red font-medium">
                      {sourceLabel}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
                        Pieces
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={state.pieces}
                        onChange={(e) =>
                          patchProcedure(row.key, { pieces: Number(e.target.value) || 0 })
                        }
                        className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
                      />
                    </div>
                    <div className="md:col-span-10">
                      <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={state.size}
                        placeholder="e.g. 1@1.1×0.1×0.1"
                        onChange={(e) => patchProcedure(row.key, { size: e.target.value })}
                        className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
                      />
                    </div>
                  </div>
                  <DescriptorChips
                    selected={state.descriptors}
                    onToggle={(v) => toggleDescriptor(row.key, v)}
                    autoThin={detectThinFromSize(state.size)}
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

      <Card title="Pre-Analytical QA">
        <div className="flex flex-wrap gap-2">
          {RENAL_IDF_TEMPLATE.preAnalyticalQaOptions.map((opt) => {
            const checked = idf.preAnalyticalQa.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleQa(opt.value)}
                className={`px-3 h-9 rounded-full border text-xs font-medium transition ${
                  checked
                    ? 'border-arkana-red bg-arkana-red-light text-arkana-red-dark'
                    : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-500'
                }`}
              >
                {checked && '✓ '}
                {opt.label}
              </button>
            );
          })}
        </div>
        {idf.preAnalyticalQa.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {idf.preAnalyticalQa.map((v) => (
              <Tag key={v} variant="warning">
                {RENAL_IDF_TEMPLATE.preAnalyticalQaOptions.find((o) => o.value === v)?.label}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      <Card title="Comments">
        <textarea
          value={idf.comments}
          onChange={(e) => updateRenal((current) => ({ ...current, comments: e.target.value }))}
          rows={4}
          placeholder="Free-text notes..."
          className="w-full rounded-xl border border-arkana-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
        />
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={handleReset}>
          Reset form
        </Button>
        <Button variant="primary" size="lg" onClick={handleSubmit}>
          Submit IDF
        </Button>
      </div>
    </div>
  );
}

function humanLabel(target: string): string {
  const row = RENAL_IDF_TEMPLATE.procedureRows.find((r) => r.key === target);
  return row?.label ?? target;
}

interface HeaderProps {
  templateName: string;
  templateSource: string;
  categoryLabel: string;
  caseData: Case;
  onReset: () => void;
}

function FormHeader({
  templateName,
  templateSource,
  categoryLabel,
  caseData,
  onReset,
}: HeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Tag variant="info">{templateName}</Tag>
          <Tag variant="neutral">{categoryLabel}</Tag>
          <span className="text-xs text-arkana-gray-500">{templateSource}</span>
        </div>
        <h1 className="text-2xl font-semibold text-arkana-black">
          {caseData.accessionNumber}
        </h1>
        <p className="text-arkana-gray-500 text-sm mt-0.5">
          {caseData.patient.firstName} {caseData.patient.lastName} · MRN{' '}
          {caseData.patient.medicalRecordNumber}
        </p>
      </div>
      <Button variant="secondary" onClick={onReset}>
        ↻ Reset
      </Button>
    </div>
  );
}
