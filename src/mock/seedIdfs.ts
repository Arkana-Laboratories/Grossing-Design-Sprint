import type { SubmittedIdf } from '../state/CaseSessionContext';

function emQa() {
  return {
    damagedItems: [] as string[], materialsNotLabeled: [] as string[], materialsNotLabeledOther: '',
    foreignBottle: [] as string[], foreignBottleOther: '', noPaperworkReceived: false,
    specimensInOnePackage: false, specimensCount: '', specimensFrom: '',
    noTissueInBottle: [] as string[], bottleLeaked: [] as string[], bottleLeakedOther: '',
    other: '', bottleComments: { formalin: '', michels: '', glutaraldehyde: '' },
  };
}

function proc(pieces: number, size = '', notes = '') {
  return { pieces, size, descriptors: [] as string[], notes, isPif: false, pifReason: null };
}

// S26-12476 — Robert Singh, Surgical Transplant, finalized
// formalin only → LM + EM; no michels → Paraffin IF; bloody+fatty bottles flagged
const S26_12476: SubmittedIdf = {
  accessionNumber: 'S26-12476',
  panelType: 'renal',
  submittedAt: '2026-04-28T15:30:00.000Z',
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 0, glutaraldehyde: 0 },
    procedures: {
      lightMicroscopy:    proc(4, '1@0.5×0.1×0.1[tan],1@0.9×0.1×0.1[bloody,tan],2@0.6×0.1×0.1[tan]'),
      immunofluorescence: proc(0),
      electronMicroscopy: proc(2),
      paraffinIf:         proc(0),
    },
    noEmReason: null, noEmReasonOther: '',
    paraffinIfEnabled: true,
    preAnalyticalQa: { ...emQa(), bottleLeaked: ['formalin_bottle'] },
    comments: '',
  },
};

// S26-12512 — Marcus Webb, Surgical, submitted
// 3-bottle: formalin + michels + glute; clean QA; EM from glute
const S26_12512: SubmittedIdf = {
  accessionNumber: 'S26-12512',
  panelType: 'renal',
  submittedAt: '2026-04-29T09:45:00.000Z',
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 1, glutaraldehyde: 1 },
    procedures: {
      lightMicroscopy:    proc(7, '3@0.5×0.1×0.1[tan],2@0.8×0.1×0.1[tan],2@1.1×0.1×0.1[fatty,tan]'),
      immunofluorescence: proc(3, '3@0.4×0.1×0.1[tan]'),
      electronMicroscopy: proc(2),
      paraffinIf:         proc(0),
    },
    noEmReason: null, noEmReasonOther: '',
    paraffinIfEnabled: false,
    preAnalyticalQa: emQa(),
    comments: '',
  },
};

// S26-12489 — Carmen Reyes, Surgical Transplant, finalized
// formalin + michels; no tissue in michels bottle; EM insufficient tissue
const S26_12489: SubmittedIdf = {
  accessionNumber: 'S26-12489',
  panelType: 'renal',
  submittedAt: '2026-04-28T15:10:00.000Z',
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 1, glutaraldehyde: 0 },
    procedures: {
      lightMicroscopy:    proc(5, '2@0.6×0.1×0.1[tan],3@0.8×0.1×0.1[tan,thin]'),
      immunofluorescence: proc(0),
      electronMicroscopy: proc(0),
      paraffinIf:         proc(0),
    },
    noEmReason: 'Insufficient tissue', noEmReasonOther: '',
    paraffinIfEnabled: false,
    preAnalyticalQa: { ...emQa(), noTissueInBottle: ['michels_bottle'] },
    comments: 'Michel\'s bottle received with no visible tissue.',
  },
};

// S26-12465 — Nadia Petrov, Surgical, finalized
// 3-bottle; glute not labeled; full LM+IF+EM
const S26_12465: SubmittedIdf = {
  accessionNumber: 'S26-12465',
  panelType: 'renal',
  submittedAt: '2026-04-27T11:00:00.000Z',
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 1, glutaraldehyde: 1 },
    procedures: {
      lightMicroscopy:    proc(8, '4@0.6×0.1×0.1[tan],2@0.9×0.1×0.1[tan],2@1.1×0.1×0.1[tan,thin]'),
      immunofluorescence: proc(3, '3@0.5×0.1×0.1[tan]'),
      electronMicroscopy: proc(3),
      paraffinIf:         proc(0),
    },
    noEmReason: null, noEmReasonOther: '',
    paraffinIfEnabled: false,
    preAnalyticalQa: { ...emQa(), materialsNotLabeled: ['glutaraldehyde_bottle'] },
    comments: '',
  },
};

// S26-10234 — Brian Smith, native demo
// formalin + michels; standard full submission
const S26_10234: SubmittedIdf = {
  accessionNumber: 'S26-10234',
  panelType: 'renal',
  submittedAt: new Date().toISOString(),
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 1, glutaraldehyde: 0 },
    procedures: {
      lightMicroscopy:    proc(7, '6@0.1-1.7×0.1×0.1[tan,bisected]'),
      immunofluorescence: proc(3, '1@0.3×0.1×0.1[tan],1@0.7×0.1×0.1[bloody],1@1.2×0.1×0.1[fatty,translucent]'),
      electronMicroscopy: proc(2),
      paraffinIf:         proc(0),
    },
    noEmReason: null, noEmReasonOther: '',
    paraffinIfEnabled: false,
    preAnalyticalQa: emQa(),
    comments: '',
  },
};

// S26-12345 — Lacy White, special demo; formalin only + paraffin IF; EM no ends
const S26_12345: SubmittedIdf = {
  accessionNumber: 'S26-12345',
  panelType: 'renal',
  submittedAt: new Date().toISOString(),
  idf: {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 0, glutaraldehyde: 0 },
    procedures: {
      lightMicroscopy:    proc(3, '1@0.4×0.1×0.1[tan,thin],1@0.9×0.1×0.1[tan,thin],1@1.2×0.1×0.1[tan,thin]'),
      immunofluorescence: proc(0),
      electronMicroscopy: proc(0),
      paraffinIf:         proc(0),
    },
    noEmReason: 'Insufficient tissue', noEmReasonOther: '',
    paraffinIfEnabled: true,
    preAnalyticalQa: emQa(),
    comments: '',
  },
};

export const SEED_IDFS: Record<string, SubmittedIdf> = {
  'S26-12476': S26_12476,
  'S26-12512': S26_12512,
  'S26-12489': S26_12489,
  'S26-12465': S26_12465,
  'S26-10234': S26_10234,
  'S26-12345': S26_12345,
};
