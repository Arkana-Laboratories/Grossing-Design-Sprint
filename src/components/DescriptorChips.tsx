import {
  TISSUE_DESCRIPTORS,
  type TissueDescriptor,
} from '../templates/descriptors';

interface Props {
  selected: TissueDescriptor[];
  onToggle: (value: TissueDescriptor) => void;
  autoThin?: boolean;
}

export function DescriptorChips({ selected, onToggle, autoThin }: Props) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
        Descriptors
      </label>
      <div className="flex flex-wrap gap-1.5">
        {TISSUE_DESCRIPTORS.map((d) => {
          const isSelected = selected.includes(d.value);
          const isAutoFromMeasurement =
            d.value === 'thin' && autoThin && isSelected;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onToggle(d.value)}
              className={`inline-flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-medium transition ${
                isSelected
                  ? 'border-sky-500 bg-sky-50 text-sky-800'
                  : 'border-arkana-gray-200 bg-white text-arkana-black hover:border-arkana-gray-500'
              }`}
            >
              {isSelected && <span aria-hidden>✓</span>}
              <span>{d.label}</span>
              {isAutoFromMeasurement && (
                <span className="text-[10px] uppercase tracking-wide text-sky-600 ml-0.5">
                  auto
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
