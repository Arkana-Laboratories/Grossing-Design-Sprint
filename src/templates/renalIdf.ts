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

export const RENAL_PRE_ANALYTICAL_QA_OPTIONS = [
  { value: 'damaged_items', label: 'Damaged Items' },
  { value: 'materials_not_labeled', label: 'Materials Not Labeled' },
  { value: 'foreign_bottle', label: 'Foreign Bottle' },
  { value: 'no_tissue_in_bottle', label: 'No Tissue In Bottle' },
  { value: 'no_paperwork_received', label: 'No Paperwork Received' },
  { value: 'bottle_leaked', label: 'Bottle Leaked / Spilled' },
] as const;

export type RenalQaFlag = typeof RENAL_PRE_ANALYTICAL_QA_OPTIONS[number]['value'];

import type { TissueDescriptor } from './descriptors';

export interface RenalProcedureRowState {
  pieces: number;
  size: string;
  descriptors: TissueDescriptor[];
  notes: string;
}

export interface RenalIdfState {
  panelType: 'renal';
  procedures: Record<RenalProcedureKey, RenalProcedureRowState>;
  preAnalyticalQa: RenalQaFlag[];
  comments: string;
}

export function createEmptyRenalIdf(): RenalIdfState {
  const procedures = {} as Record<RenalProcedureKey, RenalProcedureRowState>;
  for (const row of RENAL_PROCEDURE_ROWS) {
    procedures[row.key] = { pieces: 0, size: '', descriptors: [], notes: '' };
  }
  return {
    panelType: 'renal',
    procedures,
    preAnalyticalQa: [],
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
  preAnalyticalQaOptions: RENAL_PRE_ANALYTICAL_QA_OPTIONS,
  createEmpty: createEmptyRenalIdf,
};
