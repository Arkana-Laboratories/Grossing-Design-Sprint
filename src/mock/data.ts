import type { Case, Material } from './types';

// Helper builders to keep the seed file readable.

function formalin(id: string, isLabeled = true): Material {
  return { id, type: 'bottle', preservative: 'formalin', label: 'Bottle — Formalin', isLabeled };
}
function michels(id: string, isLabeled = true): Material {
  return { id, type: 'bottle', preservative: 'michels', label: "Bottle — Michel's", isLabeled };
}
function glute(id: string, isLabeled = true): Material {
  return { id, type: 'bottle', preservative: 'glutaraldehyde', label: 'Bottle — Glutaraldehyde', isLabeled };
}

export const mockCases: Case[] = [
  // ─── Renal: Surgical (native kidney) ──────────────────────────────────────────
  // Scenario: 2-bottle case (no glute) — formalin should fan out to LM + EM via routing.
  {
    id: 'case-1',
    accessionNumber: 'S26-12500',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-1', medicalRecordNumber: 'MRN-4421', firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1978-05-12' },
    receivedAt: '2026-04-29T10:15:00',
    submittingState: 'TX',
    materials: [formalin('mat-1-a'), michels('mat-1-b')],
    panels: { numberOfCores: 4, lymphNodeCount: 3, immunofluorescenceCount: 1 },
    flags: [],
    status: 'intake',
    specialOrders: [],
    priorCaseAccession: 'S26-12476',
  },
  // Scenario: 3-bottle case (clean three-way split) — formalin → LM, michel → IF, glute → EM.
  {
    id: 'case-6',
    accessionNumber: 'S26-12601',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-6', medicalRecordNumber: 'MRN-9912', firstName: 'David', lastName: 'Kim', dateOfBirth: '1985-08-14' },
    receivedAt: '2026-04-29T11:50:00',
    materials: [formalin('mat-6-a'), michels('mat-6-b'), glute('mat-6-c')],
    panels: { numberOfCores: 5, lymphNodeCount: 4, immunofluorescenceCount: 1 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },
  // Scenario: native kidney intake with QA flags + unlabeled bottle (drives Pre-Analytical QA chips).
  {
    id: 'case-4',
    accessionNumber: 'S26-12555',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-4', medicalRecordNumber: 'MRN-7711', firstName: 'Priya', lastName: 'Shah', dateOfBirth: '1971-11-04' },
    receivedAt: '2026-04-29T11:20:00',
    materials: [formalin('mat-4-a', false)],
    panels: { numberOfCores: 2, lymphNodeCount: 1, immunofluorescenceCount: 1 },
    flags: ['bottle_leaked', 'materials_not_labeled'],
    status: 'intake',
    specialOrders: [],
  },
  // Scenario: 2-bottle, in-grossing — exercises mid-workflow demos.
  {
    id: 'case-7',
    accessionNumber: 'S26-12602',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-7', medicalRecordNumber: 'MRN-1100', firstName: 'Alice', lastName: 'Reed', dateOfBirth: '1990-02-09' },
    receivedAt: '2026-04-29T08:55:00',
    materials: [formalin('mat-7-a'), michels('mat-7-b')],
    panels: { numberOfCores: 3, lymphNodeCount: 2, immunofluorescenceCount: 1 },
    flags: ['fatty'],
    status: 'in_grossing',
    specialOrders: [],
  },

  // ─── Renal: Surgical Transplant ───────────────────────────────────────────────
  // Prior case for S26-12500 — used in the priorCaseAccession strip on its detail.
  {
    id: 'case-2',
    accessionNumber: 'S26-12476',
    caseType: 'Surgical Transplant',
    panelType: 'renal',
    specimenCategory: 'kidney_transplant',
    patient: { id: 'pat-2', medicalRecordNumber: 'MRN-3318', firstName: 'Robert', lastName: 'Singh', dateOfBirth: '1965-09-22' },
    receivedAt: '2026-04-28T14:02:00',
    materials: [formalin('mat-2-a')],
    panels: { numberOfCores: 2, lymphNodeCount: 1, immunofluorescenceCount: 0 },
    flags: ['bloody', 'fatty'],
    status: 'finalized',
    specialOrders: ['age_change_cr_needed'],
  },
  // Scenario: 3-bottle transplant — clean three-way split + active grossing state.
  {
    id: 'case-8',
    accessionNumber: 'S26-12603',
    caseType: 'Surgical Transplant',
    panelType: 'renal',
    specimenCategory: 'kidney_transplant',
    patient: { id: 'pat-8', medicalRecordNumber: 'MRN-3344', firstName: 'Wei', lastName: 'Chen', dateOfBirth: '1958-12-19' },
    receivedAt: '2026-04-29T07:40:00',
    materials: [formalin('mat-8-a'), michels('mat-8-b'), glute('mat-8-c')],
    panels: { numberOfCores: 4, lymphNodeCount: 3, immunofluorescenceCount: 2 },
    flags: [],
    status: 'in_grossing',
    specialOrders: ['second_opinion_requested'],
  },

  // ─── Renal: Implantation / pre-implantation ───────────────────────────────────
  // Scenario: tx_implantation with 2 bottles, intake.
  {
    id: 'case-9',
    accessionNumber: 'S26-12604',
    caseType: 'Implantation',
    panelType: 'renal',
    specimenCategory: 'tx_implantation',
    patient: { id: 'pat-9', medicalRecordNumber: 'MRN-5566', firstName: 'Michael', lastName: 'Brown', dateOfBirth: '1972-03-27' },
    receivedAt: '2026-04-29T12:10:00',
    materials: [formalin('mat-9-a'), michels('mat-9-b')],
    panels: { numberOfCores: 3, lymphNodeCount: 2, immunofluorescenceCount: 1 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },
  // Scenario: pre-implantation biopsy — single formalin bottle (LM only).
  {
    id: 'case-10',
    accessionNumber: 'S26-12605',
    caseType: 'Preimplantation Kidney Biopsy',
    panelType: 'renal',
    specimenCategory: 'pre_implantation',
    patient: { id: 'pat-10', medicalRecordNumber: 'MRN-8800', firstName: 'Julia', lastName: 'Romano', dateOfBirth: '1988-06-30' },
    receivedAt: '2026-04-29T06:15:00',
    materials: [formalin('mat-10-a')],
    panels: { numberOfCores: 1, lymphNodeCount: 0, immunofluorescenceCount: 0 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },

  // ─── Renal: Other surgical organ types (use renal IDF as the procedure form) ──
  // Scenario: surgical heart — formalin only, submitted state.
  {
    id: 'case-11',
    accessionNumber: 'S26-12606',
    caseType: 'Surgical Heart',
    panelType: 'renal',
    specimenCategory: 'consult',
    patient: { id: 'pat-11', medicalRecordNumber: 'MRN-7733', firstName: 'James', lastName: 'Patel', dateOfBirth: '1960-10-02' },
    receivedAt: '2026-04-28T17:30:00',
    materials: [formalin('mat-11-a')],
    panels: { numberOfCores: 2, lymphNodeCount: 0, immunofluorescenceCount: 0 },
    flags: [],
    status: 'submitted',
    specialOrders: [],
  },
  // Scenario: surgical lung — finalized (used in /reports list).
  {
    id: 'case-12',
    accessionNumber: 'S26-12607',
    caseType: 'Surgical Lung',
    panelType: 'renal',
    specimenCategory: 'consult',
    patient: { id: 'pat-12', medicalRecordNumber: 'MRN-2299', firstName: 'Emma', lastName: 'Wilson', dateOfBirth: '1955-04-18' },
    receivedAt: '2026-04-27T13:00:00',
    materials: [formalin('mat-12-a')],
    panels: { numberOfCores: 3, lymphNodeCount: 2, immunofluorescenceCount: 0 },
    flags: ['fatty'],
    status: 'finalized',
    specialOrders: [],
  },
  // Scenario: conjunctiva — single small specimen.
  {
    id: 'case-13',
    accessionNumber: 'S26-12608',
    caseType: 'Conjunctiva',
    panelType: 'renal',
    specimenCategory: 'consult',
    patient: { id: 'pat-13', medicalRecordNumber: 'MRN-4488', firstName: 'Sofia', lastName: 'Reyes', dateOfBirth: '1995-09-11' },
    receivedAt: '2026-04-29T13:45:00',
    materials: [formalin('mat-13-a')],
    panels: { numberOfCores: 1, lymphNodeCount: 0, immunofluorescenceCount: 0 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },

  // ─── Neuro: Surgical Nerve ────────────────────────────────────────────────────
  // Scenario: neuro Specimen A only — submitted.
  {
    id: 'case-5',
    accessionNumber: 'S26-12431',
    caseType: 'Surgical Nerve',
    panelType: 'neuro',
    tissueCategory: 'surgical_nerve',
    patient: { id: 'pat-5', medicalRecordNumber: 'MRN-2204', firstName: 'Daniel', lastName: 'Cho', dateOfBirth: '1990-07-18' },
    receivedAt: '2026-04-27T08:30:00',
    materials: [formalin('mat-5-a')],
    panels: { numberOfCores: 5, lymphNodeCount: 4, immunofluorescenceCount: 1 },
    flags: [],
    status: 'submitted',
    specialOrders: [],
  },
  // Scenario: neuro nerve in intake with multiple flags (drives QA + triage demo).
  {
    id: 'case-14',
    accessionNumber: 'S26-12609',
    caseType: 'Surgical Nerve',
    panelType: 'neuro',
    tissueCategory: 'surgical_nerve',
    patient: { id: 'pat-14', medicalRecordNumber: 'MRN-1199', firstName: 'Ahmed', lastName: 'Hassan', dateOfBirth: '1968-01-25' },
    receivedAt: '2026-04-29T09:05:00',
    materials: [formalin('mat-14-a', false), glute('mat-14-b')],
    panels: { numberOfCores: 2, lymphNodeCount: 1, immunofluorescenceCount: 0 },
    flags: ['materials_not_labeled', 'damaged_items'],
    status: 'intake',
    specialOrders: [],
  },

  // ─── Neuro: Consult Muscle / Tech-Only ────────────────────────────────────────
  // Scenario: muscle in_grossing — Specimen A + B both apply (toggle in IDF).
  {
    id: 'case-3',
    accessionNumber: 'S26-12533',
    caseType: 'Consult Muscle',
    panelType: 'neuro',
    tissueCategory: 'surgical_muscle',
    patient: { id: 'pat-3', medicalRecordNumber: 'MRN-5502', firstName: 'Maria', lastName: 'Lopez', dateOfBirth: '1982-01-30' },
    receivedAt: '2026-04-29T09:48:00',
    materials: [formalin('mat-3-a'), glute('mat-3-b')],
    panels: { numberOfCores: 3, lymphNodeCount: 2, immunofluorescenceCount: 2 },
    flags: [],
    status: 'in_grossing',
    specialOrders: [],
  },
  // Scenario: tech-only nerve — submitted (used to demo read-only EM final flow).
  {
    id: 'case-15',
    accessionNumber: 'S26-12610',
    caseType: 'Tech-Only Nerve',
    panelType: 'neuro',
    tissueCategory: 'surgical_nerve',
    patient: { id: 'pat-15', medicalRecordNumber: 'MRN-6677', firstName: 'Olivia', lastName: 'Garcia', dateOfBirth: '1979-11-08' },
    receivedAt: '2026-04-26T15:20:00',
    materials: [formalin('mat-15-a'), glute('mat-15-b')],
    panels: { numberOfCores: 4, lymphNodeCount: 3, immunofluorescenceCount: 0 },
    flags: [],
    status: 'submitted',
    specialOrders: [],
  },

  // ─── Special demo case ────────────────────────────────────────────────────
  {
    id: 'case-special-demo',
    accessionNumber: 'S26-12345',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-sd', medicalRecordNumber: 'MRN-12345', firstName: 'Lacy', lastName: 'White', dateOfBirth: '1942-07-16' },
    receivedAt: '2026-04-30T09:00:00',
    materials: [formalin('mat-sd-a'), michels('mat-sd-b')],
    panels: { numberOfCores: 3, lymphNodeCount: 0, immunofluorescenceCount: 0 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },

  // ─── Native demo case ─────────────────────────────────────────────────────
  {
    id: 'case-native-demo',
    accessionNumber: 'S26-10234',
    caseType: 'Surgical',
    panelType: 'renal',
    specimenCategory: 'native_kidney',
    patient: { id: 'pat-nd', medicalRecordNumber: 'MRN-10234', firstName: 'Brian', lastName: 'Smith', dateOfBirth: '1984-02-02' },
    receivedAt: '2026-04-30T09:00:00',
    submittingState: 'AR',
    materials: [formalin('mat-nd-a'), michels('mat-nd-b')],
    panels: { numberOfCores: 3, lymphNodeCount: 0, immunofluorescenceCount: 1 },
    flags: [],
    status: 'intake',
    specialOrders: [],
  },

  // ─── Neuro: Brain Autopsy ─────────────────────────────────────────────────────
  // Scenario: brain autopsy in_grossing — multi-specimen scenario.
  {
    id: 'case-16',
    accessionNumber: 'S26-12611',
    caseType: 'Brain Autopsy',
    panelType: 'neuro',
    tissueCategory: 'surgical_nerve',
    patient: { id: 'pat-16', medicalRecordNumber: 'MRN-9080', firstName: 'Kenji', lastName: 'Tanaka', dateOfBirth: '1942-07-04' },
    receivedAt: '2026-04-25T11:00:00',
    materials: [formalin('mat-16-a'), formalin('mat-16-b'), glute('mat-16-c')],
    panels: { numberOfCores: 6, lymphNodeCount: 0, immunofluorescenceCount: 0 },
    flags: [],
    status: 'in_grossing',
    specialOrders: [],
  },
];

export function getCaseByAccession(accessionNumber: string): Case | undefined {
  return mockCases.find((c) => c.accessionNumber === accessionNumber);
}
