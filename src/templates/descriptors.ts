export const TISSUE_DESCRIPTORS = [
  { value: 'tan',        label: 'Tan',        group: 'appearance' },
  { value: 'fatty',      label: 'Fatty',      group: 'appearance' },
  { value: 'fatty_end',  label: 'Fatty end',  group: 'appearance' },
  { value: 'bloody_end', label: 'Bloody end', group: 'appearance' },
  { value: 'translucent',label: 'Translucent',group: 'appearance' },
  { value: 'thin',       label: 'Thin',       group: 'appearance' },
  { value: 'bisected',   label: 'Bisected',   group: 'section' },
  { value: 'dissected',  label: 'Dissected',  group: 'section' },
] as const;

export type TissueDescriptor = typeof TISSUE_DESCRIPTORS[number]['value'];

export function getDescriptorLabel(value: TissueDescriptor): string {
  return TISSUE_DESCRIPTORS.find((d) => d.value === value)?.label ?? value;
}
