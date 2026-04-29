export const TISSUE_DESCRIPTORS = [
  { value: 'tan', label: 'Tan' },
  { value: 'fatty', label: 'Fatty' },
  { value: 'fatty_end', label: 'Fatty end' },
  { value: 'bloody', label: 'Bloody' },
  { value: 'bloody_end', label: 'Bloody end' },
  { value: 'translucent', label: 'Translucent' },
  { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' },
  { value: 'thin', label: 'Thin' },
] as const;

export type TissueDescriptor = typeof TISSUE_DESCRIPTORS[number]['value'];

export function getDescriptorLabel(value: TissueDescriptor): string {
  return TISSUE_DESCRIPTORS.find((d) => d.value === value)?.label ?? value;
}
