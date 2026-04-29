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
  NEURO_IDF_TEMPLATE,
  type NeuroIdfState,
  type NeuroSpecimenState,
  getNeuroTissueCategoryLabel,
} from '../templates/neuroIdf';
import type { Case } from '../mock/types';
import { detectThinFromSize } from '../lib/parseDictation';
import {
  routeNeuroDictation,
  applyToNeuro,
  type RoutedClause,
} from '../lib/routeDictation';
import {
  type NeuroSpecimenKey,
  humanLabelForNeuroTarget,
} from '../templates/neuroIdfRouting';
import { DescriptorChips } from './DescriptorChips';
import type { TissueDescriptor } from '../templates/descriptors';

interface Props {
  caseData: Case;
  idf: NeuroIdfState;
}

type ActiveSpecimen = 'A' | 'B';

const NEURO_PRESETS = [
  {
    id: 'neuro-specimen-a-only',
    label: 'Neuro · Specimen A only — single biopsy',
    transcript:
      'specimen a three at one point one by zero point one by zero point one comma two at zero point nine by zero point one by zero point one',
  },
  {
    id: 'neuro-two-specimens',
    label: 'Neuro · Specimen A + B — multi-site',
    transcript:
      'specimen a three at one point two by zero point one by zero point one specimen b two at zero point eight by zero point one by zero point one',
  },
  {
    id: 'neuro-no-keyword',
    label: 'Neuro · No keyword — defaults to Specimen A',
    transcript:
      'two at one point five by zero point one by zero point one comma three at one point three by zero point one by zero point one',
  },
];

export function NeuroIdfForm({ caseData, idf }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const { updateNeuro, resetIdf } = useCaseSession();

  const presets = useMemo(() => NEURO_PRESETS, []);
  const activePreset = useRegisterDemoPresets(presets) ?? NEURO_PRESETS[0]!;
  const [pulsedKeys, setPulsedKeys] = useState<NeuroSpecimenKey[]>([]);
  const [lastSource, setLastSource] = useState<Partial<Record<NeuroSpecimenKey, string>>>({});
  const [routingLog, setRoutingLog] = useState<RoutedClause[]>([]);
  const [logOpen, setLogOpen] = useState(true);

  useEffect(() => {
    if (pulsedKeys.length === 0) return;
    const t = window.setTimeout(() => setPulsedKeys([]), 1400);
    return () => window.clearTimeout(t);
  }, [pulsedKeys]);

  function patchSpecimen(target: ActiveSpecimen, patch: Partial<NeuroSpecimenState>) {
    const key = target === 'A' ? 'specimenA' : 'specimenB';
    updateNeuro((current) => {
      const next: NeuroSpecimenState = { ...current[key], ...patch };
      if (patch.sizeCm !== undefined && detectThinFromSize(next.sizeCm)) {
        if (!next.descriptors.includes('thin')) {
          next.descriptors = [...next.descriptors, 'thin'];
        }
      }
      return { ...current, [key]: next };
    });
  }

  function toggleDescriptor(target: ActiveSpecimen, value: TissueDescriptor) {
    const key = target === 'A' ? 'specimenA' : 'specimenB';
    const current = idf[key].descriptors;
    patchSpecimen(target, {
      descriptors: current.includes(value)
        ? current.filter((d) => d !== value)
        : [...current, value],
    });
  }

  function handleTranscriptComplete(transcript: string) {
    const { routed } = routeNeuroDictation(transcript);

    updateNeuro((current) => applyToNeuro(current, routed));

    const touchedKeys = new Set<NeuroSpecimenKey>();
    const newSource: Partial<Record<NeuroSpecimenKey, string>> = {};
    for (const r of routed) {
      if (r.measurements.length === 0) continue;
      for (const t of r.targets) {
        if (t !== 'specimenA' && t !== 'specimenB') continue;
        const key = t as NeuroSpecimenKey;
        touchedKeys.add(key);
        newSource[key] = `via ${r.sourceKeyword ?? 'default'}`;
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
        message: `Dictation routed to ${touchedKeys.size} specimen${
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

  function toggleTriage(value: typeof idf.triageFlags[number]) {
    updateNeuro((current) => ({
      ...current,
      triageFlags: current.triageFlags.includes(value)
        ? current.triageFlags.filter((v) => v !== value)
        : [...current.triageFlags, value],
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Tag variant="info">{NEURO_IDF_TEMPLATE.name}</Tag>
            <Tag variant="neutral">
              {getNeuroTissueCategoryLabel(caseData.tissueCategory)}
            </Tag>
            <span className="text-xs text-arkana-gray-500">{NEURO_IDF_TEMPLATE.source}</span>
          </div>
          <h1 className="text-2xl font-semibold text-arkana-black">
            {caseData.accessionNumber}
          </h1>
          <p className="text-arkana-gray-500 text-sm mt-0.5">
            {caseData.patient.firstName} {caseData.patient.lastName} · MRN{' '}
            {caseData.patient.medicalRecordNumber}
          </p>
        </div>
        <Button variant="secondary" onClick={handleReset}>
          ↻ Reset
        </Button>
      </div>

      <Card title="Intake">
        <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
          Paperwork matches specimen bottles?
        </label>
        <div className="flex gap-2">
          {(['yes', 'no'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => updateNeuro((c) => ({ ...c, paperworkMatchesBottles: v }))}
              className={`px-4 h-10 rounded-xl border text-sm transition ${
                idf.paperworkMatchesBottles === v
                  ? 'border-sky-500 bg-sky-50 text-sky-800 font-medium'
                  : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-500'
              }`}
            >
              {v === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Dictation">
        <DictationMic
          onTranscriptComplete={handleTranscriptComplete}
          presetTranscript={activePreset.transcript}
          hint='Tap mic to dictate. Say "specimen a" or "specimen b" to route. No keyword → defaults to Specimen A.'
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
                      → {r.targets.map(humanTargetLabel).join(', ') || '(no measurements)'}{' '}
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

      <Card title="Specimens">
        <SpecimenBlock
          label="Specimen A"
          specimen={idf.specimenA}
          isPulsed={pulsedKeys.includes('specimenA')}
          sourceLabel={lastSource.specimenA}
          onChange={(patch) => patchSpecimen('A', patch)}
          onToggleDescriptor={(v) => toggleDescriptor('A', v)}
        />

        <div className="my-4 flex items-center justify-between border-t border-arkana-gray-200 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={idf.specimenBEnabled}
              onChange={(e) =>
                updateNeuro((c) => ({ ...c, specimenBEnabled: e.target.checked }))
              }
              className="h-4 w-4"
            />
            <span className="text-sm text-arkana-black">Add Specimen B</span>
          </label>
        </div>

        {idf.specimenBEnabled && (
          <SpecimenBlock
            label="Specimen B"
            specimen={idf.specimenB}
            isPulsed={pulsedKeys.includes('specimenB')}
            sourceLabel={lastSource.specimenB}
            onChange={(patch) => patchSpecimen('B', patch)}
            onToggleDescriptor={(v) => toggleDescriptor('B', v)}
          />
        )}
      </Card>

      <Card title="Triage">
        <div className="flex flex-wrap gap-2 mb-4">
          {NEURO_IDF_TEMPLATE.triageOptions.map((opt) => {
            const checked = idf.triageFlags.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTriage(opt.value)}
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
        <div>
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
            Tissue Quality
          </label>
          <div className="flex flex-wrap gap-2">
            {NEURO_IDF_TEMPLATE.tissueQualityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  updateNeuro((c) => ({
                    ...c,
                    tissueQuality: c.tissueQuality === opt.value ? null : opt.value,
                  }))
                }
                className={`px-3 h-9 rounded-xl border text-xs font-medium transition ${
                  idf.tissueQuality === opt.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Comments">
        <textarea
          value={idf.comments}
          onChange={(e) => updateNeuro((c) => ({ ...c, comments: e.target.value }))}
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

function humanTargetLabel(target: string): string {
  if (target === 'specimenA' || target === 'specimenB') {
    return humanLabelForNeuroTarget(target);
  }
  return target;
}

interface SpecimenBlockProps {
  label: string;
  specimen: NeuroSpecimenState;
  isPulsed: boolean;
  sourceLabel: string | undefined;
  onChange: (patch: Partial<NeuroSpecimenState>) => void;
  onToggleDescriptor: (value: TissueDescriptor) => void;
}

function SpecimenBlock({
  label,
  specimen,
  isPulsed,
  sourceLabel,
  onChange,
  onToggleDescriptor,
}: SpecimenBlockProps) {
  return (
    <div
      className={`border rounded-xl p-4 transition-colors duration-700 ${
        isPulsed
          ? 'bg-arkana-red-light/40 border-arkana-red'
          : 'bg-white border-arkana-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-base font-semibold text-arkana-black">{label}</span>
        {sourceLabel && (
          <span className="text-[11px] uppercase tracking-wide text-arkana-red font-medium">
            {sourceLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Side
          </label>
          <div className="flex gap-1">
            {NEURO_IDF_TEMPLATE.sideOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({ side: specimen.side === opt.value ? null : opt.value })
                }
                className={`flex-1 h-10 rounded-lg border text-sm font-medium transition ${
                  specimen.side === opt.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-arkana-gray-200 bg-white text-arkana-black'
                }`}
              >
                {opt.value}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Biopsy Site
          </label>
          <input
            type="text"
            value={specimen.biopsySite}
            placeholder="e.g. left vastus lateralis"
            onChange={(e) => onChange({ biopsySite: e.target.value })}
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            # Frags
          </label>
          <input
            type="number"
            min={0}
            value={specimen.fragmentCount}
            onChange={(e) =>
              onChange({ fragmentCount: Number(e.target.value) || 0 })
            }
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Size (cm)
          </label>
          <input
            type="text"
            value={specimen.sizeCm}
            placeholder="e.g. 3@1.1×0.1×0.1"
            onChange={(e) => onChange({ sizeCm: e.target.value })}
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>

        <div className="md:col-span-6">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Color
          </label>
          <div className="flex flex-wrap gap-1">
            {NEURO_IDF_TEMPLATE.colorOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({ color: specimen.color === opt.value ? null : opt.value })
                }
                className={`px-3 h-9 rounded-lg border text-xs font-medium transition ${
                  specimen.color === opt.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-arkana-gray-200 bg-white text-arkana-black'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-6">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Received In
          </label>
          <div className="flex flex-wrap gap-1">
            {NEURO_IDF_TEMPLATE.receivedOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({ received: specimen.received === opt.value ? null : opt.value })
                }
                className={`px-3 h-9 rounded-lg border text-xs font-medium transition ${
                  specimen.received === opt.value
                    ? 'border-sky-500 bg-sky-50 text-sky-800'
                    : 'border-arkana-gray-200 bg-white text-arkana-black'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-12">
          <DescriptorChips
            selected={specimen.descriptors}
            onToggle={onToggleDescriptor}
            autoThin={detectThinFromSize(specimen.sizeCm)}
          />
        </div>

        <div className="md:col-span-12">
          <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-1">
            Comments (other)
          </label>
          <input
            type="text"
            value={specimen.comments}
            placeholder="e.g. other colors different from tan"
            onChange={(e) => onChange({ comments: e.target.value })}
            className="w-full h-10 rounded-lg border border-arkana-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
          />
        </div>
      </div>
    </div>
  );
}
