// Master enum of case_type values from the upstream LIS.
// Order preserved as provided. xxx-prefixed entries are inactive in the source system.
//
// "Surgical" (the bare label, not in the upstream list) is added below as the
// demo's implicit default for a native non-transplant surgical biopsy. Confirm
// with upstream before relying on it in production.
export const CASE_TYPES = [
  'Surgical Pancreas Transplant',
  'xxxSurgical India',
  'Conjunctiva',
  'Imported History',
  'xxxxPLA2R',
  'Surgical Lung',
  'Technical EM',
  'NPHP1 FISH',
  'Vertex',
  'Consult Nerve',
  'Tech-Only Nerve',
  'Consult Second Opinion',
  'Covid Testing',
  'Mass Spectrometry',
  'NonDiagnostic',
  'Consult Muscle',
  'Surgical Heart',
  'ENFD',
  'Surgical Transplant',
  'Implantation',
  'Surgical Mucosa',
  'Surgical Skin/Mucosa',
  'Sequencing',
  'Consult Brain',
  'Surgical Nerve',
  'xxxAPOL1',
  'Brain Autopsy',
  'Tech-Only Muscle',
  'Preimplantation Kidney Biopsy',
  'Surgical',
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

export function isActiveCaseType(t: CaseType): boolean {
  return !t.startsWith('xxx');
}

export const ACTIVE_CASE_TYPES: readonly CaseType[] = CASE_TYPES.filter(isActiveCaseType);

export const DEMO_CASE_TYPES = ['Surgical', 'Surgical Transplant'] as const satisfies readonly CaseType[];
