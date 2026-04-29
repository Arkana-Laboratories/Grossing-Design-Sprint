export const NEURO_TISSUE_CATEGORIES = [
  { value: 'surgical_muscle', label: 'Surgical Muscle' },
  { value: 'surgical_nerve', label: 'Surgical Nerve' },
  { value: 'consult', label: 'Consult' },
  { value: 'tem', label: 'TEM' },
  { value: 'tech_only', label: 'Tech Only' },
  { value: 'other', label: 'Other' },
] as const;

export type NeuroTissueCategory = typeof NEURO_TISSUE_CATEGORIES[number]['value'];

export const NEURO_SIDE_OPTIONS = [
  { value: 'R', label: 'Right' },
  { value: 'L', label: 'Left' },
] as const;

export type NeuroSide = typeof NEURO_SIDE_OPTIONS[number]['value'];

export const NEURO_COLOR_OPTIONS = [
  { value: 'beefy_red', label: 'Beefy Red' },
  { value: 'pink', label: 'Pink' },
  { value: 'white_tan', label: 'White / Tan' },
  { value: 'fatty', label: 'Fatty' },
] as const;

export type NeuroColor = typeof NEURO_COLOR_OPTIONS[number]['value'];

export const NEURO_RECEIVED_OPTIONS = [
  { value: 'wet_tofts', label: 'Wet Tofts' },
  { value: 'wet_gauze', label: 'Wet Gauze' },
  { value: 'loose_in_saline', label: 'Loose in Saline' },
] as const;

export type NeuroReceived = typeof NEURO_RECEIVED_OPTIONS[number]['value'];

export const NEURO_TISSUE_QUALITY_OPTIONS = [
  { value: 'floating_in_saline', label: 'Floating in Saline' },
  { value: 'dried_out', label: 'Dried Out' },
  { value: 'cauterized', label: 'Cauterized' },
  { value: 'no_fresh_tissue_received', label: 'No Fresh Tissue Received' },
] as const;

export type NeuroTissueQuality = typeof NEURO_TISSUE_QUALITY_OPTIONS[number]['value'];

export const NEURO_TRIAGE_OPTIONS = [
  { value: 'noTissueInBottle', label: 'No Tissue in Bottle' },
  { value: 'notLabeled', label: 'Specimen Bottle / Slides Not Labeled' },
  { value: 'insufficientForTeasedNerve', label: 'Insufficient Tissue for Teased Nerve' },
  { value: 'paperworkMissing', label: 'Paperwork Missing or Incomplete' },
  { value: 'fedExDamaged', label: 'FedEx Package / Bottle / Slides Damaged' },
] as const;

export type NeuroTriageFlag = typeof NEURO_TRIAGE_OPTIONS[number]['value'];

import type { TissueDescriptor } from './descriptors';

export interface NeuroSpecimenState {
  side: NeuroSide | null;
  biopsySite: string;
  fragmentCount: number;
  sizeCm: string;
  color: NeuroColor | null;
  received: NeuroReceived | null;
  descriptors: TissueDescriptor[];
  comments: string;
}

export interface NeuroIdfState {
  panelType: 'neuro';
  paperworkMatchesBottles: 'yes' | 'no' | null;
  specimenA: NeuroSpecimenState;
  specimenBEnabled: boolean;
  specimenB: NeuroSpecimenState;
  triageFlags: NeuroTriageFlag[];
  tissueQuality: NeuroTissueQuality | null;
  comments: string;
}

export function createEmptyNeuroSpecimen(): NeuroSpecimenState {
  return {
    side: null,
    biopsySite: '',
    fragmentCount: 0,
    sizeCm: '',
    color: null,
    received: null,
    descriptors: [],
    comments: '',
  };
}

export function createEmptyNeuroIdf(): NeuroIdfState {
  return {
    panelType: 'neuro',
    paperworkMatchesBottles: null,
    specimenA: createEmptyNeuroSpecimen(),
    specimenBEnabled: false,
    specimenB: createEmptyNeuroSpecimen(),
    triageFlags: [],
    tissueQuality: null,
    comments: '',
  };
}

export function getNeuroTissueCategoryLabel(value: NeuroTissueCategory | undefined): string {
  if (!value) return '—';
  return NEURO_TISSUE_CATEGORIES.find((c) => c.value === value)?.label ?? '—';
}

export const NEURO_IDF_TEMPLATE = {
  id: 'neuro' as const,
  name: 'Neuro Gross / IR Form',
  source: 'IDF-NEURO-Gross-IR-Form',
  sideOptions: NEURO_SIDE_OPTIONS,
  colorOptions: NEURO_COLOR_OPTIONS,
  receivedOptions: NEURO_RECEIVED_OPTIONS,
  tissueQualityOptions: NEURO_TISSUE_QUALITY_OPTIONS,
  triageOptions: NEURO_TRIAGE_OPTIONS,
  createEmpty: createEmptyNeuroIdf,
};
