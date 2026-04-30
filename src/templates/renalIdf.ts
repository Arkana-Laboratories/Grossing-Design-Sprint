export const RENAL_SPECIMEN_CATEGORIES = [
  { value: 'native_kidney', label: 'Native Kidney' },
  { value: 'kidney_transplant', label: 'Kidney Transplant' },
  { value: 'tx_implantation', label: 'TX Implantation' },
  { value: 'consult', label: 'Consult' },
  { value: 'tem', label: 'TEM' },
  { value: 'pre_implantation', label: 'Pre-Implantation' },
] as const;

export type RenalSpecimenCategory = typeof RENAL_SPECIMEN_CATEGORIES[number]['value'];

export const RENAL_PROCEDURE_ROWS = [
  {
    key: 'lightMicroscopy',
    label: 'Light Microscopy',
    subtitle: 'Kidney Biopsy, Level IV — H&E×2, PAS×2, Silver, SMMT, Trichrome',
  },
  {
    key: 'immunofluorescence',
    label: 'Immunofluorescence Profile',
    subtitle: '×9 — IgA, IgG, IgM, C3, C1Q, Albumin, Fibrinogen, Kappa, Lambda',
  },
  {
    key: 'electronMicroscopy',
    label: 'Electron Microscopy',
    subtitle: 'Complete / Reduced',
  },
] as const;

export type RenalProcedureKey = typeof RENAL_PROCEDURE_ROWS[number]['key'];

export interface RenalPreAnalyticalQa {
  damagedItems: string[];
  materialsNotLabeled: string[];
  materialsNotLabeledOther: string;
  foreignBottle: string[];
  foreignBottleOther: string;
  noPaperworkReceived: boolean;
  specimensInOnePackage: boolean;
  specimensCount: string;
  specimensFrom: string;
  noTissueInBottle: string[];
  bottleLeaked: string[];
  bottleLeakedOther: string;
  other: string;
  bottleComments: { formalin: string; michels: string; glutaraldehyde: string };
}

import type { TissueDescriptor } from './descriptors';

export interface RenalProcedureRowState {
  pieces: number;
  size: string;
  descriptors: TissueDescriptor[];
  notes: string;
  isPif: boolean;
  pifReason: string | null;
}

export const PIF_REASONS = [
  'Minimal tissue',
  'No tissue identified',
  'Tissue lost in processing',
  'Other',
] as const;

export type PifReason = (typeof PIF_REASONS)[number];

export interface BottleCounts {
  formalin: number;
  michels: number;
  glutaraldehyde: number;
}

export interface RenalIdfState {
  panelType: 'renal';
  bottleCounts: BottleCounts;
  procedures: Record<RenalProcedureKey, RenalProcedureRowState>;
  preAnalyticalQa: RenalPreAnalyticalQa;
  comments: string;
}

export function createEmptyRenalIdf(): RenalIdfState {
  const procedures = {} as Record<RenalProcedureKey, RenalProcedureRowState>;
  for (const row of RENAL_PROCEDURE_ROWS) {
    procedures[row.key] = {
      pieces: 0,
      size: '',
      descriptors: [],
      notes: '',
      isPif: false,
      pifReason: null,
    };
  }
  return {
    panelType: 'renal',
    bottleCounts: { formalin: 1, michels: 1, glutaraldehyde: 0 },
    procedures,
    preAnalyticalQa: {
      damagedItems: [],
      materialsNotLabeled: [],
      materialsNotLabeledOther: '',
      foreignBottle: [],
      foreignBottleOther: '',
      noPaperworkReceived: false,
      specimensInOnePackage: false,
      specimensCount: '',
      specimensFrom: '',
      noTissueInBottle: [],
      bottleLeaked: [],
      bottleLeakedOther: '',
      other: '',
      bottleComments: { formalin: '', michels: '', glutaraldehyde: '' },
    },
    comments: '',
  };
}

export function getRenalSpecimenCategoryLabel(value: RenalSpecimenCategory | undefined): string {
  if (!value) return '—';
  return RENAL_SPECIMEN_CATEGORIES.find((c) => c.value === value)?.label ?? '—';
}

export const RENAL_IDF_TEMPLATE = {
  id: 'renal' as const,
  name: 'Renal Internal Data Form',
  source: 'IDF-RENAL-v4.0-2026-01-21',
  specimenCategories: RENAL_SPECIMEN_CATEGORIES,
  procedureRows: RENAL_PROCEDURE_ROWS,
  createEmpty: createEmptyRenalIdf,
};
