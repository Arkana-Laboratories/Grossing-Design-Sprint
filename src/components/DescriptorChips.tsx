import {
  TISSUE_DESCRIPTORS,
  type TissueDescriptor,
} from '../templates/descriptors';

interface Props {
  selected: TissueDescriptor[];
  onToggle: (value: TissueDescriptor) => void;
  hideLabel?: boolean;
}

const appearanceDescriptors = TISSUE_DESCRIPTORS.filter((d) => d.group === 'appearance');
const sectionDescriptors = TISSUE_DESCRIPTORS.filter((d) => d.group === 'section');

function Chip({
  descriptor,
  selected,
  onToggle,
}: {
  descriptor: (typeof TISSUE_DESCRIPTORS)[number];
  selected: boolean;
  onToggle: (v: TissueDescriptor) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(descriptor.value)}
      className={`inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium transition ${
        selected
          ? 'border-sky-500 bg-sky-50 text-sky-800'
          : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-500'
      }`}
    >
      {selected && <span aria-hidden>✓</span>}
      <span>{descriptor.label}</span>
    </button>
  );
}

export function DescriptorChips({ selected, onToggle, hideLabel = false }: Props) {
  return (
    <div>
      {!hideLabel && (
        <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
          Descriptors
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 items-center">
        {appearanceDescriptors.map((d) => (
          <Chip key={d.value} descriptor={d} selected={selected.includes(d.value)} onToggle={onToggle} />
        ))}
        <span className="h-5 w-px bg-arkana-gray-200 mx-0.5 shrink-0" aria-hidden />
        {sectionDescriptors.map((d) => (
          <Chip key={d.value} descriptor={d} selected={selected.includes(d.value)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
