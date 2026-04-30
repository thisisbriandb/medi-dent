'use client';

import type { ToothSurface, ToothState, ToothCondition } from '@/types/odontogramme.types';
import { CONDITION_COLORS, WHOLE_TOOTH_CONDITIONS } from '@/types/odontogramme.types';

interface ToothSVGProps {
  toothNumber: string;
  state: ToothState;
  onSurfaceClick: (toothNumber: string, surface: ToothSurface) => void;
  onToothClick: (toothNumber: string) => void;
  isSelected: boolean;
}

const SURFACE_FILL_DEFAULT = '#f3f4f6'; // gray-100
const SURFACE_STROKE = '#9ca3af';       // gray-400

function getFill(condition: ToothCondition | undefined): string {
  if (!condition || condition === 'sain') return SURFACE_FILL_DEFAULT;
  return CONDITION_COLORS[condition] || SURFACE_FILL_DEFAULT;
}

export default function ToothSVG({
  toothNumber,
  state,
  onSurfaceClick,
  onToothClick,
  isSelected,
}: ToothSVGProps) {
  const isWholeTooth = state.status && WHOLE_TOOTH_CONDITIONS.includes(state.status);
  const wholeColor = isWholeTooth ? CONDITION_COLORS[state.status!] : undefined;

  // Absent teeth render as a faded X
  if (state.status === 'absent') {
    return (
      <g className="cursor-pointer" onClick={() => onToothClick(toothNumber)}>
        <rect x="2" y="2" width="46" height="46" rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
        <line x1="10" y1="10" x2="40" y2="40" stroke="#d1d5db" strokeWidth="2" />
        <line x1="40" y1="10" x2="10" y2="40" stroke="#d1d5db" strokeWidth="2" />
        <text x="25" y="48" textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="600">
          {toothNumber}
        </text>
      </g>
    );
  }

  return (
    <g className="cursor-pointer">
      {/* Outline highlight when selected */}
      {isSelected && (
        <rect
          x="0" y="0" width="50" height="50" rx="6"
          fill="none" stroke="#3b82f6" strokeWidth="2.5"
          className="animate-pulse"
        />
      )}

      {/* Whole-tooth overlay for conditions like couronne, implant, bridge */}
      {isWholeTooth ? (
        <rect
          x="4" y="4" width="42" height="42" rx="4"
          fill={wholeColor} fillOpacity="0.25"
          stroke={wholeColor} strokeWidth="2"
          onClick={() => onToothClick(toothNumber)}
        />
      ) : null}

      {/* 5 surfaces — arranged as a cross:
           V (top)
        M  O  D
           L (bottom)
      */}

      {/* V — Vestibulaire (top) */}
      <polygon
        points="10,4 40,4 34,16 16,16"
        fill={isWholeTooth ? wholeColor! : getFill(state.surfaces.V)}
        fillOpacity={isWholeTooth ? 0.4 : 1}
        stroke={SURFACE_STROKE} strokeWidth="0.8"
        onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNumber, 'V'); }}
        className="hover:brightness-90 transition-all"
      />

      {/* M — Mésiale (left) */}
      <polygon
        points="4,10 16,16 16,34 4,40"
        fill={isWholeTooth ? wholeColor! : getFill(state.surfaces.M)}
        fillOpacity={isWholeTooth ? 0.4 : 1}
        stroke={SURFACE_STROKE} strokeWidth="0.8"
        onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNumber, 'M'); }}
        className="hover:brightness-90 transition-all"
      />

      {/* D — Distale (right) */}
      <polygon
        points="46,10 46,40 34,34 34,16"
        fill={isWholeTooth ? wholeColor! : getFill(state.surfaces.D)}
        fillOpacity={isWholeTooth ? 0.4 : 1}
        stroke={SURFACE_STROKE} strokeWidth="0.8"
        onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNumber, 'D'); }}
        className="hover:brightness-90 transition-all"
      />

      {/* L — Linguale (bottom) */}
      <polygon
        points="16,34 34,34 40,46 10,46"
        fill={isWholeTooth ? wholeColor! : getFill(state.surfaces.L)}
        fillOpacity={isWholeTooth ? 0.4 : 1}
        stroke={SURFACE_STROKE} strokeWidth="0.8"
        onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNumber, 'L'); }}
        className="hover:brightness-90 transition-all"
      />

      {/* O — Occlusale (center) */}
      <rect
        x="16" y="16" width="18" height="18" rx="2"
        fill={isWholeTooth ? wholeColor! : getFill(state.surfaces.O)}
        fillOpacity={isWholeTooth ? 0.4 : 1}
        stroke={SURFACE_STROKE} strokeWidth="0.8"
        onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNumber, 'O'); }}
        className="hover:brightness-90 transition-all"
      />

      {/* Tooth number label */}
      <text
        x="25" y="58" textAnchor="middle" fontSize="8"
        fill={isSelected ? '#3b82f6' : '#6b7280'}
        fontWeight={isSelected ? '700' : '500'}
        fontFamily="ui-monospace, monospace"
      >
        {toothNumber}
      </text>
    </g>
  );
}
