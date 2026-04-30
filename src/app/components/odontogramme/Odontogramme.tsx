'use client';

import { useState, useCallback } from 'react';
import { RotateCcw, Save, StickyNote } from 'lucide-react';
import ToothSVG from './ToothSVG';
import type {
  ToothSurface,
  ToothCondition,
  OdontogrammeData,
  ToothState,
} from '@/types/odontogramme.types';
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
  CONDITION_LABELS,
  CONDITION_COLORS,
  SURFACE_LABELS,
  SURFACE_CONDITIONS,
  WHOLE_TOOTH_CONDITIONS,
} from '@/types/odontogramme.types';

interface OdontogrammeProps {
  initialData: OdontogrammeData;
  notes: string;
  onSave: (data: OdontogrammeData, notes: string) => Promise<void>;
  saving?: boolean;
  readOnly?: boolean;
}

const EMPTY_TOOTH: ToothState = { surfaces: {} };

function getToothState(data: OdontogrammeData, num: string): ToothState {
  return data[num] || EMPTY_TOOTH;
}

export default function Odontogramme({
  initialData,
  notes: initialNotes,
  onSave,
  saving = false,
  readOnly = false,
}: OdontogrammeProps) {
  const [data, setData] = useState<OdontogrammeData>(initialData);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const isDirty =
    JSON.stringify(data) !== JSON.stringify(initialData) || notes !== initialNotes;

  // ─── Handlers ───

  const handleSurfaceClick = useCallback(
    (toothNumber: string, surface: ToothSurface) => {
      if (readOnly) return;
      setSelectedTooth(toothNumber);
      setSelectedSurface(surface);
    },
    [readOnly]
  );

  const handleToothClick = useCallback(
    (toothNumber: string) => {
      if (readOnly) return;
      setSelectedTooth(toothNumber);
      setSelectedSurface(null);
    },
    [readOnly]
  );

  const applyCondition = useCallback(
    (condition: ToothCondition) => {
      if (!selectedTooth) return;

      setData((prev) => {
        const next = { ...prev };
        const tooth: ToothState = { ...(next[selectedTooth] || EMPTY_TOOTH), surfaces: { ...(next[selectedTooth]?.surfaces || {}) } };

        if (WHOLE_TOOTH_CONDITIONS.includes(condition)) {
          // Whole-tooth condition
          if (tooth.status === condition) {
            // Toggle off
            delete tooth.status;
          } else {
            tooth.status = condition;
            // Clear surfaces for whole-tooth conditions
            tooth.surfaces = {};
          }
        } else if (selectedSurface) {
          // Surface condition
          if (tooth.surfaces[selectedSurface] === condition) {
            delete tooth.surfaces[selectedSurface];
          } else {
            tooth.surfaces[selectedSurface] = condition;
          }
          // Clear whole-tooth status when editing surfaces
          delete tooth.status;
        }

        // Clean up empty states
        if (!tooth.status && Object.keys(tooth.surfaces).length === 0 && !tooth.note) {
          delete next[selectedTooth];
        } else {
          next[selectedTooth] = tooth;
        }

        return next;
      });
    },
    [selectedTooth, selectedSurface]
  );

  const handleReset = useCallback(() => {
    setData(initialData);
    setNotes(initialNotes);
    setSelectedTooth(null);
    setSelectedSurface(null);
  }, [initialData, initialNotes]);

  const handleSave = useCallback(() => {
    onSave(data, notes);
  }, [data, notes, onSave]);

  // ─── Determine which conditions to show in the palette ───

  const isWholeToothMode = selectedTooth && !selectedSurface;
  const conditions = isWholeToothMode ? WHOLE_TOOTH_CONDITIONS : SURFACE_CONDITIONS;

  const currentCondition = selectedTooth
    ? isWholeToothMode
      ? getToothState(data, selectedTooth).status
      : selectedSurface
      ? getToothState(data, selectedTooth).surfaces[selectedSurface]
      : undefined
    : undefined;

  // ─── Row renderer ───

  const renderRow = (teeth: string[]) => (
    <div className="flex gap-1">
      {teeth.map((num) => (
        <svg key={num} width="50" height="62" viewBox="0 0 50 62">
          <ToothSVG
            toothNumber={num}
            state={getToothState(data, num)}
            onSurfaceClick={handleSurfaceClick}
            onToothClick={handleToothClick}
            isSelected={selectedTooth === num}
          />
        </svg>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showNotes
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              Notes
            </button>
            <button
              onClick={handleReset}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}

      {/* Notes */}
      {showNotes && !readOnly && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          placeholder="Notes générales sur l'odontogramme..."
        />
      )}

      {/* Dental Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 overflow-x-auto">
        {/* Upper jaw */}
        <div className="flex justify-center gap-6 mb-1">
          {renderRow(UPPER_RIGHT)}
          <div className="w-px bg-gray-300 self-stretch" />
          {renderRow(UPPER_LEFT)}
        </div>

        {/* Midline */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            Droite — Gauche
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Lower jaw */}
        <div className="flex justify-center gap-6">
          {renderRow(LOWER_RIGHT)}
          <div className="w-px bg-gray-300 self-stretch" />
          {renderRow(LOWER_LEFT)}
        </div>
      </div>

      {/* Selection panel + condition palette */}
      {selectedTooth && !readOnly && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-gray-800">
              Dent {selectedTooth}
            </span>
            {selectedSurface && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {SURFACE_LABELS[selectedSurface]}
              </span>
            )}
            {!selectedSurface && (
              <span className="text-xs text-gray-400">
                Cliquez une surface ou choisissez une condition globale
              </span>
            )}
            <button
              onClick={() => { setSelectedTooth(null); setSelectedSurface(null); }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600"
            >
              Fermer
            </button>
          </div>

          {/* Condition buttons */}
          <div className="flex flex-wrap gap-2">
            {conditions.map((condition) => {
              const isActive = currentCondition === condition;
              return (
                <button
                  key={condition}
                  onClick={() => applyCondition(condition)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    isActive
                      ? 'ring-2 ring-offset-1 ring-blue-400 border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CONDITION_COLORS[condition] }}
                  />
                  {CONDITION_LABELS[condition]}
                </button>
              );
            })}
          </div>

          {/* Quick switch: surface ↔ whole tooth */}
          {selectedSurface && (
            <button
              onClick={() => setSelectedSurface(null)}
              className="mt-3 text-xs text-blue-600 hover:underline"
            >
              Passer en mode dent entière
            </button>
          )}
          {!selectedSurface && (
            <p className="mt-3 text-xs text-gray-400">
              Cliquez sur une surface de la dent ci-dessus pour appliquer une condition par surface
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(CONDITION_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CONDITION_COLORS[key as ToothCondition] }}
            />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
