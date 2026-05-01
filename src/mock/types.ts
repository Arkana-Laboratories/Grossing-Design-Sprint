import type { RenalSpecimenCategory } from '../templates/renalIdf';
import type { NeuroTissueCategory } from '../templates/neuroIdf';
import type { CaseType } from '../templates/caseTypes';

export type PanelType = 'renal' | 'neuro';

export interface Patient {
  id: string;
  medicalRecordNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export type Preservative = 'formalin' | 'michels' | 'glutaraldehyde';

export interface Material {
  id: string;
  type: 'bottle';
  preservative: Preservative;
  label: string;
  isLabeled: boolean;
}

export interface PanelInfo {
  numberOfCores: number;
  lymphNodeCount: number;
  immunofluorescenceCount: number;
}

export type QualityFlag =
  | 'fatty'
  | 'bloody'
  | 'no_pw'
  | 'materials_not_labeled'
  | 'bottle_leaked'
  | 'damaged_items';

export type CaseStatus = 'intake' | 'in_grossing' | 'submitted' | 'finalized';

export interface Case {
  id: string;
  accessionNumber: string;
  caseType: CaseType;
  panelType: PanelType;
  specimenCategory?: RenalSpecimenCategory;
  tissueCategory?: NeuroTissueCategory;
  patient: Patient;
  receivedAt: string;
  submittingState?: string;
  materials: Material[];
  panels: PanelInfo;
  flags: QualityFlag[];
  status: CaseStatus;
  specialOrders: string[];
  priorCaseAccession?: string;
  physician?: string;
}
