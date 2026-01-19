import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  value: { from?: Date; to?: Date };
  onChange: (value: { from?: Date; to?: Date }) => void;
}

const presets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 }
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = subDays(to, days - 1);
    onChange({
      from: startOfDay(from),
      to: endOfDay(to)
    });
    setIsOpen(false);
  };

  const handleCustomRange = (from: string, to: string) => {
    onChange({
      from: from ? startOfDay(new Date(from)) : undefined,
      to: to ? endOfDay(new Date(to)) : undefined
    });
    setIsOpen(false);
  };

  const formattedRange = value.from && value.to
    ? `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
    : value.from
    ? `${format(value.from, 'MMM d, yyyy')} - ...`
    : 'Select date range';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-300" />
        <span>{formattedRange}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-72">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Presets</p>
            <div className="flex flex-col gap-1">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.days)}
                  className="text-sm text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Range</p>
            <div className="flex flex-col gap-2">
              <div>
                <label htmlFor="date-from" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                <input
                  id="date-from"
                  type="date"
                  value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const to = value.to ? format(value.to, 'yyyy-MM-dd') : '';
                    handleCustomRange(e.target.value, to);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor="date-to" className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                <input
                  id="date-to"
                  type="date"
                  value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const from = value.from ? format(value.from, 'yyyy-MM-dd') : '';
                    handleCustomRange(from, e.target.value);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
