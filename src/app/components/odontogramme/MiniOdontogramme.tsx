'use client';

import { useCallback } from 'react';
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
} from '@/types/odontogramme.types';

interface MiniOdontogrammeProps {
  selectedTeeth: string[];
  onChange: (teeth: string[]) => void;
  readOnly?: boolean;
}

export default function MiniOdontogramme({
  selectedTeeth,
  onChange,
  readOnly = false,
}: MiniOdontogrammeProps) {
  const toggle = useCallback(
    (num: string) => {
      if (readOnly) return;
      onChange(
        selectedTeeth.includes(num)
          ? selectedTeeth.filter((t) => t !== num)
          : [...selectedTeeth, num]
      );
    },
    [selectedTeeth, onChange, readOnly]
  );

  const renderRow = (teeth: string[]) => (
    <div className="flex gap-0.5">
      {teeth.map((num) => {
        const isSelected = selectedTeeth.includes(num);
        return (
          <button
            key={num}
            type="button"
            onClick={() => toggle(num)}
            title={`Dent ${num}`}
            className={`w-7 h-7 text-[10px] font-mono rounded transition-all leading-none flex items-center justify-center ${
              readOnly ? 'cursor-default' : 'cursor-pointer'
            } ${
              isSelected
                ? 'bg-blue-500 text-white font-bold shadow-sm'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {num}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-1">
      {/* Upper jaw */}
      <div className="flex justify-center gap-2">
        {renderRow(UPPER_RIGHT)}
        <div className="w-px bg-gray-300 self-stretch" />
        {renderRow(UPPER_LEFT)}
      </div>

      {/* Midline */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[9px] text-gray-300 uppercase tracking-widest">D — G</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Lower jaw */}
      <div className="flex justify-center gap-2">
        {renderRow(LOWER_RIGHT)}
        <div className="w-px bg-gray-300 self-stretch" />
        {renderRow(LOWER_LEFT)}
      </div>

      {/* Selected summary */}
      {selectedTeeth.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          <span className="font-medium text-gray-700">{selectedTeeth.length}</span> dent{selectedTeeth.length > 1 ? 's' : ''} sélectionnée{selectedTeeth.length > 1 ? 's' : ''} :{' '}
          <span className="font-mono">{selectedTeeth.sort().join(', ')}</span>
        </p>
      )}
    </div>
  );
}
