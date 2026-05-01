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

export type RenalProcedureKey = typeof RENAL_PROCEDURE_ROWS[number]['key'] | 'paraffinIf';

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

export const NO_EM_REASONS = [
  'Insufficient tissue',
  'No visible GLOMs',
  'Other',
] as const;

export type NoEmReason = (typeof NO_EM_REASONS)[number];

export interface BottleCounts {
  formalin: number;
  michels: number;
  glutaraldehyde: number;
}

export type RenalBottleQaField =
  | 'damagedItems'
  | 'materialsNotLabeled'
  | 'foreignBottle'
  | 'noTissueInBottle'
  | 'bottleLeaked';

export interface RenalBottleQaFinding {
  label: string;
  field: RenalBottleQaField;
}

export const RENAL_BOTTLE_QA_FINDINGS: RenalBottleQaFinding[] = [
  { label: 'Damaged', field: 'damagedItems' },
  { label: 'Not Labeled', field: 'materialsNotLabeled' },
  { label: 'Foreign Bottle', field: 'foreignBottle' },
  { label: 'No Tissue', field: 'noTissueInBottle' },
  { label: 'Leaked', field: 'bottleLeaked' },
];

export interface RenalRoutedTile {
  procedureKey: RenalProcedureKey;
  title: string;
  subtitle: string;
  // 'pieces' renders a number input bound to procedure.pieces with a unit caption.
  // 'none' renders the title + subtitle only (panel summary).
  inputKind: 'none' | 'pieces';
  unitSingular?: string;
  unitPlural?: string;
}

export interface RenalBottleDefinition {
  key: keyof BottleCounts;
  label: string;
  fragmentSingular: string;
  fragmentPlural: string;
  itemKey: string;
  primaryProcedureKey: RenalProcedureKey;
  routedTiles: RenalRoutedTile[];
  isDefault: boolean;
  isRenameable: boolean;
}

export const RENAL_BOTTLE_DEFINITIONS: RenalBottleDefinition[] = [
  {
    key: 'formalin',
    label: 'Formalin',
    fragmentSingular: 'piece',
    fragmentPlural: 'pieces',
    itemKey: 'formalin_bottle',
    primaryProcedureKey: 'lightMicroscopy',
    routedTiles: [
      {
        procedureKey: 'lightMicroscopy',
        title: 'Light Microscopy',
        subtitle: 'Kidney Biopsy, Level IV — H&E×2, PAS×2, Silver, SMMT, Trichrome',
        inputKind: 'pieces',
        unitSingular: 'piece',
        unitPlural: 'pieces',
      },
      {
        procedureKey: 'electronMicroscopy',
        title: 'Electron Microscopy',
        subtitle: 'Ends submitted from formalin core',
        inputKind: 'pieces',
        unitSingular: 'end',
        unitPlural: 'ends',
      },
    ],
    isDefault: true,
    isRenameable: false,
  },
  {
    key: 'michels',
    label: "Michel's",
    fragmentSingular: 'piece',
    fragmentPlural: 'pieces',
    itemKey: 'michels_bottle',
    primaryProcedureKey: 'immunofluorescence',
    routedTiles: [
      {
        procedureKey: 'immunofluorescence',
        title: 'Immunofluorescence Profile',
        subtitle: '×9 — IgA, IgG, IgM, C3, C1Q, Albumin, Fibrinogen, Kappa, Lambda',
        inputKind: 'pieces',
        unitSingular: 'piece',
        unitPlural: 'pieces',
      },
    ],
    isDefault: true,
    isRenameable: false,
  },
  {
    key: 'glutaraldehyde',
    label: 'Glutaraldehyde',
    fragmentSingular: 'end',
    fragmentPlural: 'ends',
    itemKey: 'glutaraldehyde_bottle',
    primaryProcedureKey: 'electronMicroscopy',
    routedTiles: [],
    isDefault: false,
    isRenameable: true,
  },
];

export function getRenalBottleDefinition(key: keyof BottleCounts): RenalBottleDefinition {
  const def = RENAL_BOTTLE_DEFINITIONS.find((b) => b.key === key);
  if (!def) throw new Error(`Unknown bottle key: ${key}`);
  return def;
}

export interface RenalIdfState {
  panelType: 'renal';
  bottleCounts: BottleCounts;
  procedures: Record<RenalProcedureKey, RenalProcedureRowState>;
  preAnalyticalQa: RenalPreAnalyticalQa;
  comments: string;
  noEmReason: NoEmReason | null;
  noEmReasonOther: string;
  paraffinIfEnabled: boolean;
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
  procedures['paraffinIf'] = {
    pieces: 0,
    size: '',
    descriptors: [],
    notes: '',
    isPif: false,
    pifReason: null,
  };
  return {
    panelType: 'renal',
    bottleCounts: { formalin: 0, michels: 0, glutaraldehyde: 0 },
    procedures,
    noEmReason: null,
    noEmReasonOther: '',
    paraffinIfEnabled: false,
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
