import { Link, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { useCaseSession } from '../state/CaseSessionContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import {
  RENAL_IDF_TEMPLATE,
  type RenalIdfState,
  getRenalSpecimenCategoryLabel,
} from '../templates/renalIdf';
import {
  NEURO_IDF_TEMPLATE,
  type NeuroIdfState,
  getNeuroTissueCategoryLabel,
} from '../templates/neuroIdf';
import type { Case } from '../mock/types';
import { getDescriptorLabel } from '../templates/descriptors';

export function CaseSummary() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { session } = useCaseSession();
  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-arkana-gray-500 mb-4">Case not found.</p>
        <Link to="/">
          <Button>Back to landing</Button>
        </Link>
      </div>
    );
  }

  const sessionMatchesCase =
    session &&
    session.accessionNumber === caseData.accessionNumber &&
    session.panelType === caseData.panelType;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-semibold text-arkana-black">
          Case {caseData.accessionNumber} submitted
        </h1>
        <p className="text-arkana-gray-500 mt-1">
          {caseData.panelType === 'renal'
            ? RENAL_IDF_TEMPLATE.name
            : NEURO_IDF_TEMPLATE.name}{' '}
          · sent to TX queue
        </p>
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <SummaryRow label="Patient">
            {caseData.patient.firstName} {caseData.patient.lastName}
          </SummaryRow>
          <SummaryRow label="MRN">{caseData.patient.medicalRecordNumber}</SummaryRow>
          <SummaryRow label="Panel">
            <Tag variant="info">{caseData.panelType.toUpperCase()}</Tag>
          </SummaryRow>
          <SummaryRow label="Status">{caseData.status}</SummaryRow>
        </div>
      </Card>

      {!sessionMatchesCase && (
        <Card className="mb-5">
          <p className="text-sm text-arkana-gray-500">
            No live IDF session for this case. (Submit the IDF first to see fields here.)
          </p>
        </Card>
      )}

      {sessionMatchesCase && session.panelType === 'renal' && (
        <RenalSummary idf={session.idf} caseData={caseData} />
      )}
      {sessionMatchesCase && session.panelType === 'neuro' && (
        <NeuroSummary idf={session.idf} caseData={caseData} />
      )}

      <div className="flex gap-3 justify-center mt-5">
        <Link to="/">
          <Button variant="primary">Back to landing</Button>
        </Link>
        <Link to={`/case/${caseData.accessionNumber}`}>
          <Button variant="secondary">View case</Button>
        </Link>
      </div>
    </div>
  );
}

function RenalSummary({ idf, caseData }: { idf: RenalIdfState; caseData: Case }) {
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
              <div key={row.key} className="border-t border-arkana-gray-200 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-arkana-black font-medium">{row.label}</div>
                  <div className="text-xs text-arkana-gray-500">
                    {s.pieces ? `${s.pieces} pcs` : '—'}
                  </div>
                </div>
                <div className="text-sm text-arkana-black mt-0.5">{s.size || '—'}</div>
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
        {idf.preAnalyticalQa.length === 0 ? (
          <p className="text-sm text-arkana-gray-500">No QA flags raised.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {idf.preAnalyticalQa.map((v) => (
              <Tag key={v} variant="warning">
                {RENAL_IDF_TEMPLATE.preAnalyticalQaOptions.find((o) => o.value === v)?.label}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      {idf.comments && (
        <Card title="Comments" className="mb-5">
          <p className="text-sm text-arkana-black whitespace-pre-wrap">{idf.comments}</p>
        </Card>
      )}
    </>
  );
}

function NeuroSummary({ idf, caseData }: { idf: NeuroIdfState; caseData: Case }) {
  const tissueQualityLabel =
    NEURO_IDF_TEMPLATE.tissueQualityOptions.find((o) => o.value === idf.tissueQuality)
      ?.label ?? '—';

  return (
    <>
      <Card title="Tissue Category" className="mb-5">
        <p className="text-sm text-arkana-black">
          {getNeuroTissueCategoryLabel(caseData.tissueCategory)}
        </p>
      </Card>

      <SpecimenSummary label="Specimen A" specimen={idf.specimenA} />
      {idf.specimenBEnabled && (
        <SpecimenSummary label="Specimen B" specimen={idf.specimenB} />
      )}

      <Card title="Triage" className="mb-5">
        {idf.triageFlags.length === 0 ? (
          <p className="text-sm text-arkana-gray-500">No triage flags.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {idf.triageFlags.map((v) => (
              <Tag key={v} variant="warning">
                {NEURO_IDF_TEMPLATE.triageOptions.find((o) => o.value === v)?.label}
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
          <p className="text-sm text-arkana-black whitespace-pre-wrap">{idf.comments}</p>
        </Card>
      )}
    </>
  );
}

function SpecimenSummary({
  label,
  specimen,
}: {
  label: string;
  specimen: NeuroIdfState['specimenA'];
}) {
  const colorLabel =
    NEURO_IDF_TEMPLATE.colorOptions.find((o) => o.value === specimen.color)?.label ?? '—';
  const receivedLabel =
    NEURO_IDF_TEMPLATE.receivedOptions.find((o) => o.value === specimen.received)?.label ??
    '—';
  return (
    <Card title={label} className="mb-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <SummaryRow label="Side">{specimen.side ?? '—'}</SummaryRow>
        <SummaryRow label="Biopsy Site">{specimen.biopsySite || '—'}</SummaryRow>
        <SummaryRow label="# Frags">{specimen.fragmentCount || '—'}</SummaryRow>
        <SummaryRow label="Size (cm)">{specimen.sizeCm || '—'}</SummaryRow>
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

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500">{label}</dt>
      <dd className="text-arkana-black font-medium mt-0.5">{children}</dd>
    </div>
  );
}
