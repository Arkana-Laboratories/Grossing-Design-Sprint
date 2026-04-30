import type { ReactNode } from 'react';
import { Card } from './ui/Card';
import { Tag } from './ui/Tag';
import {
  RENAL_IDF_TEMPLATE,
  type RenalIdfState,
  type RenalPreAnalyticalQa,
  getRenalSpecimenCategoryLabel,
} from '../templates/renalIdf';
import {
  NEURO_IDF_TEMPLATE,
  type NeuroIdfState,
  type NeuroSpecimenState,
  getNeuroTissueCategoryLabel,
} from '../templates/neuroIdf';
import type { Case } from '../mock/types';
import { getDescriptorLabel, type TissueDescriptor } from '../templates/descriptors';
import { parse, formatMeasurement } from '../lib/measurements';

function pluralizeUnit(n: number, singular: string): string {
  return n === 1 ? singular : `${singular}s`;
}

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

function QaReadonlySummary({ qa }: { qa: RenalPreAnalyticalQa }) {
  const tags: string[] = [];
  if (qa.damagedItems.length > 0) tags.push(`Damaged Items`);
  if (qa.materialsNotLabeled.length > 0) tags.push('Materials Not Labeled');
  if (qa.foreignBottle.length > 0) tags.push('Foreign Bottle');
  if (qa.noTissueInBottle.length > 0) tags.push('No Tissue In Bottle');
  if (qa.bottleLeaked.length > 0) tags.push('Bottle Leaked/Spilled');
  if (qa.noPaperworkReceived) tags.push('No Paperwork Received');
  if (qa.specimensInOnePackage)
    tags.push(
      `Specimens In One Package${qa.specimensCount ? ` (${qa.specimensCount})` : ''}${qa.specimensFrom ? ` from ${qa.specimensFrom}` : ''}`,
    );
  if (qa.other) tags.push(`Other: ${qa.other}`);

  if (tags.length === 0) return <p className="text-sm text-arkana-gray-500">No QA flags raised.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Tag key={t} variant="warning">{t}</Tag>
      ))}
    </div>
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
      <Card title="Specimen Category" className="mb-5">
        <p className="text-sm text-arkana-black">
          {getRenalSpecimenCategoryLabel(caseData.specimenCategory)}
        </p>
      </Card>

      <Card title="Procedures" className="mb-5">
        <div className="space-y-3">
          {RENAL_IDF_TEMPLATE.procedureRows.map((row) => {
            const s = idf.procedures[row.key];
            return (
              <div
                key={row.key}
                className="border-t border-arkana-gray-200 pt-3 first:border-0 first:pt-0"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-arkana-black font-medium">{row.label}</span>
                    <span className="text-xs text-arkana-gray-500">
                      {s.pieces
                        ? `· ${s.pieces} ${pluralizeUnit(s.pieces, row.key === 'electronMicroscopy' ? 'end' : 'piece')}`
                        : '· —'}
                    </span>
                  </div>
                  {s.isPif && (
                    <Tag variant="danger">
                      PIF{s.pifReason ? ` · ${s.pifReason}` : ''}
                    </Tag>
                  )}
                </div>
                {(() => {
                  const ms = parse(s.size);
                  if (ms.length === 0) return <p className="text-sm text-arkana-gray-500 mt-0.5">—</p>;
                  return (
                    <div className="space-y-1.5 mt-1.5">
                      {ms.map((m, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-[minmax(0,220px)_1fr] gap-2 md:gap-3 items-start"
                        >
                          <span className="text-sm text-arkana-black font-mono tabular-nums">
                            {formatMeasurement(m)}
                          </span>
                          {m.descriptors.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {m.descriptors.map((d) => (
                                <Tag key={d} variant="info">
                                  {getDescriptorLabel(d as TissueDescriptor)}
                                </Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {s.descriptors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.descriptors.map((d) => (
                      <Tag key={d} variant="info">
                        {getDescriptorLabel(d)}
                      </Tag>
                    ))}
                  </div>
                )}
                {s.notes && (
                  <p className="text-xs text-arkana-gray-500 mt-1">{s.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Pre-Analytical QA" className="mb-5">
        <QaReadonlySummary qa={idf.preAnalyticalQa} />
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
