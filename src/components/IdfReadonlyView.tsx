import { Fragment, type ReactNode } from 'react';
import { Card } from './ui/Card';
import { Tag } from './ui/Tag';
import {
  type RenalIdfState,
  type RenalPreAnalyticalQa,
} from '../templates/renalIdf';
import {
  NEURO_IDF_TEMPLATE,
  type NeuroIdfState,
  type NeuroSpecimenState,
  getNeuroTissueCategoryLabel,
} from '../templates/neuroIdf';
import type { Case } from '../mock/types';
import { getDescriptorLabel } from '../templates/descriptors';
import { parse, formatMeasurement } from '../lib/measurements';

export function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500">
        {label}
      </dt>
      <dd className="text-arkana-black font-medium mt-0.5">{children}</dd>
    </div>
  );
}

const PROC_TABLE_CONFIG = [
  {
    key: 'lightMicroscopy' as const,
    dept: 'Light Microscopy',
    name: 'Kidney Biopsy, Level IV',
    subtitle: 'H&E×2 · PAS×2 · Silver · SMMT · Trichrome',
    coreLabel: 'LM Cores',
    coreColorCls: 'text-arkana-green',
    deptBgCls: 'bg-emerald-50',
    deptTextCls: 'text-emerald-700',
    bottleKey: 'formalin' as const,
    bottleLabel: 'Formalin',
    bottleItemKey: 'formalin_bottle',
  },
  {
    key: 'immunofluorescence' as const,
    dept: 'Immunofluorescence',
    name: 'IF Profile ×9',
    subtitle: 'IgA, IgG, IgM, C3, C1Q, Albumin, Fibrinogen, Kappa, Lambda',
    coreLabel: 'IF Cores',
    coreColorCls: 'text-amber-500',
    deptBgCls: 'bg-purple-50',
    deptTextCls: 'text-purple-600',
    bottleKey: 'michels' as const,
    bottleLabel: "Michel's",
    bottleItemKey: 'michels_bottle',
  },
  {
    key: 'electronMicroscopy' as const,
    dept: 'Electron Microscopy',
    name: 'EM — Complete',
    subtitle: '',
    coreLabel: 'EM Ends',
    coreColorCls: 'text-arkana-blue',
    deptBgCls: 'bg-sky-50',
    deptTextCls: 'text-sky-700',
    bottleKey: 'formalin' as const,
    bottleLabel: 'Formalin',
    bottleItemKey: 'formalin_bottle',
  },
] as const;

export function BottleReadonlyList({ idf }: { idf: RenalIdfState }) {
  const combinedNotes = PROC_TABLE_CONFIG
    .map((c) => idf.procedures[c.key].notes)
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-arkana-gray-50 border-b border-arkana-gray-200">
              <th className="text-left px-4 py-2 text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500">
                Procedure
              </th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500 w-[110px]">
                Bottle
              </th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500 min-w-[150px]">
                Size
              </th>
              <th className="text-center px-3 py-2 text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500 w-[80px]">
                Cores
              </th>
            </tr>
          </thead>
          <tbody>
            {PROC_TABLE_CONFIG.map((cfg) => {
              const proc = idf.procedures[cfg.key];
              const ms = parse(proc.size);
              const isEm = cfg.key === 'electronMicroscopy';
              const isIf = cfg.key === 'immunofluorescence';

              // When Michel's wasn't submitted but Paraffin IF was added, show that instead
              const michelsUnavailable = isIf && idf.bottleCounts.michels === 0;
              const useParaffinIf = isIf && michelsUnavailable && (idf.paraffinIfEnabled ?? false);

              // EM may come from glutaraldehyde instead of formalin
              const useGlute = isEm && idf.bottleCounts.glutaraldehyde > 0;
              const bottleKey = useGlute ? 'glutaraldehyde' : cfg.bottleKey;
              const bottleLabel = useGlute ? 'Glutaraldehyde' : useParaffinIf ? 'Formalin' : cfg.bottleLabel;
              const bottleItemKey = useGlute ? 'glutaraldehyde_bottle' : cfg.bottleItemKey;
              const bottleCount = useParaffinIf ? idf.bottleCounts.formalin : idf.bottleCounts[bottleKey];

              const notSubmitted = !useParaffinIf && bottleCount === 0;
              const noTissue = idf.preAnalyticalQa.noTissueInBottle.includes(bottleItemKey);
              const noEm = isEm && proc.pieces === 0 && idf.noEmReason;

              // Paraffin IF display name override
              const displayName = useParaffinIf ? 'Paraffin IF' : cfg.name;
              const displaySubtitle = useParaffinIf ? 'Paraffin panel — from formalin core' : cfg.subtitle;

              return (
                <Fragment key={cfg.key}>
                  <tr>
                    <td
                      colSpan={4}
                      className={`px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.09em] border-b border-t border-arkana-gray-100 ${cfg.deptBgCls} ${cfg.deptTextCls}`}
                    >
                      {cfg.dept}
                    </td>
                  </tr>
                  <tr className="border-b border-arkana-gray-100 align-top">
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-bold text-arkana-black">{displayName}</div>
                      {displaySubtitle && (
                        <div className="text-[10px] text-arkana-gray-500 mt-0.5 leading-snug">{displaySubtitle}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {notSubmitted ? (
                        <span className="text-[11px] text-arkana-gray-400">—</span>
                      ) : (
                        <>
                          <div className="text-[11px] font-semibold text-arkana-black">{bottleLabel}</div>
                          <div className="text-[10px] text-arkana-gray-500">
                            {bottleCount} {bottleCount === 1 ? 'bottle' : 'bottles'}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {notSubmitted ? (
                        <span className="text-[11px] text-arkana-gray-400">Not submitted</span>
                      ) : noTissue ? (
                        <span className="text-[11px] text-amber-700">No tissue received</span>
                      ) : noEm ? (
                        <span className="text-[11px] text-amber-700">
                          No ends — {idf.noEmReason === 'Other' && idf.noEmReasonOther
                            ? idf.noEmReasonOther
                            : idf.noEmReason}
                        </span>
                      ) : ms.length === 0 ? (
                        <span className="text-[12px] text-arkana-gray-400">—</span>
                      ) : (
                        <div className="space-y-px">
                          {ms.map((m, i) => (
                            <div key={i} className="flex items-baseline gap-1.5 leading-snug">
                              <span className="text-arkana-gray-400 shrink-0 select-none">•</span>
                              <div>
                                <span className="font-mono text-[12px] font-semibold text-arkana-black">
                                  {formatMeasurement(m)}
                                </span>
                                {m.descriptors.length > 0 && (
                                  <span className="text-[10px] text-arkana-gray-500 ml-1">
                                    [{m.descriptors.map((d) => getDescriptorLabel(d)).join(', ')}]
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {!noEm && !notSubmitted && proc.pieces > 0 ? (
                        <>
                          <div className={`text-[20px] font-bold leading-none ${cfg.coreColorCls}`}>
                            {proc.pieces}
                          </div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.05em] text-arkana-gray-500 mt-0.5">
                            {cfg.coreLabel}
                          </div>
                        </>
                      ) : (
                        <span className="text-[13px] text-arkana-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {combinedNotes && (
        <div className="border-t border-arkana-gray-100 px-[18px] pt-3 pb-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.09em] text-arkana-gray-500 mb-2">
            Grossing Notes
          </div>
          <div className="bg-arkana-gray-50 rounded-[5px] px-3 py-2.5 text-[12px] text-arkana-black leading-relaxed">
            {combinedNotes}
          </div>
        </div>
      )}
    </>
  );
}

function QaReadonlySummaryCard({ qa }: { qa: RenalPreAnalyticalQa }) {
  const flags: string[] = [];
  if (qa.bottleLeaked.length > 0) flags.push('Bottle Leaked / Spilled');
  if (qa.damagedItems.length > 0) flags.push('Damaged Items');
  if (qa.materialsNotLabeled.length > 0) flags.push('Materials Not Labeled');
  if (qa.noTissueInBottle.length > 0) flags.push('No Tissue in Bottle');
  if (qa.foreignBottle.length > 0) flags.push('Foreign Bottle');
  if (qa.noPaperworkReceived) flags.push('No Paperwork Received');
  if (qa.other) flags.push(`Other: ${qa.other}`);

  if (flags.length === 0) return null;

  return (
    <Card title="Pre-Analytical QA" className="mb-5">
      <div className="flex flex-wrap gap-2">
        {flags.map((f) => (
          <Tag key={f} variant="warning">{f}</Tag>
        ))}
      </div>
    </Card>
  );
}

export function RenalReadonlyView({
  idf,
  caseData,
}: {
  idf: RenalIdfState;
  caseData: Case;
}) {
  return (
    <>
      <Card title="Procedure & Specimen" className="mb-5" noPad>
        <BottleReadonlyList idf={idf} />
      </Card>

      <QaReadonlySummaryCard qa={idf.preAnalyticalQa} />

      {idf.comments && (
        <Card title="Comments" className="mb-5">
          <p className="text-sm text-arkana-black whitespace-pre-wrap">
            {idf.comments}
          </p>
        </Card>
      )}
    </>
  );
}

export function NeuroReadonlyView({
  idf,
  caseData,
}: {
  idf: NeuroIdfState;
  caseData: Case;
}) {
  const tissueQualityLabel =
    NEURO_IDF_TEMPLATE.tissueQualityOptions.find(
      (o) => o.value === idf.tissueQuality,
    )?.label ?? '—';

  return (
    <>
      <Card title="Tissue Category" className="mb-5">
        <p className="text-sm text-arkana-black">
          {getNeuroTissueCategoryLabel(caseData.tissueCategory)}
        </p>
      </Card>

      <SpecimenReadonly label="Specimen A" specimen={idf.specimenA} />
      {idf.specimenBEnabled && (
        <SpecimenReadonly label="Specimen B" specimen={idf.specimenB} />
      )}

      <Card title="Triage" className="mb-5">
        {idf.triageFlags.length === 0 ? (
          <p className="text-sm text-arkana-gray-500">No triage flags.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {idf.triageFlags.map((v) => (
              <Tag key={v} variant="warning">
                {
                  NEURO_IDF_TEMPLATE.triageOptions.find((o) => o.value === v)
                    ?.label
                }
              </Tag>
            ))}
          </div>
        )}
        <div className="text-sm text-arkana-black">
          <span className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mr-2">
            Quality:
          </span>
          {tissueQualityLabel}
        </div>
      </Card>

      {idf.comments && (
        <Card title="Comments" className="mb-5">
          <p className="text-sm text-arkana-black whitespace-pre-wrap">
            {idf.comments}
          </p>
        </Card>
      )}
    </>
  );
}

function SpecimenReadonly({
  label,
  specimen,
}: {
  label: string;
  specimen: NeuroSpecimenState;
}) {
  const colorLabel =
    NEURO_IDF_TEMPLATE.colorOptions.find((o) => o.value === specimen.color)
      ?.label ?? '—';
  const receivedLabel =
    NEURO_IDF_TEMPLATE.receivedOptions.find((o) => o.value === specimen.received)
      ?.label ?? '—';
  return (
    <Card title={label} className="mb-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <SummaryRow label="Side">{specimen.side ?? '—'}</SummaryRow>
        <SummaryRow label="Biopsy Site">{specimen.biopsySite || '—'}</SummaryRow>
        <SummaryRow label="# Frags">{specimen.fragmentCount || '—'}</SummaryRow>
        <SummaryRow label="Size (cm)">
          <span className="font-mono tabular-nums">{specimen.sizeCm || '—'}</span>
        </SummaryRow>
        <SummaryRow label="Color">{colorLabel}</SummaryRow>
        <SummaryRow label="Received In">{receivedLabel}</SummaryRow>
      </div>
      {specimen.descriptors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {specimen.descriptors.map((d) => (
            <Tag key={d} variant="info">
              {getDescriptorLabel(d)}
            </Tag>
          ))}
        </div>
      )}
      {specimen.comments && (
        <p className="text-sm text-arkana-black mt-3">
          <span className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mr-2">
            Notes:
          </span>
          {specimen.comments}
        </p>
      )}
    </Card>
  );
}
