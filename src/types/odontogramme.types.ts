// ─── Types Odontogramme (notation FDI) ───

// Surfaces d'une dent
export type ToothSurface = 'O' | 'M' | 'D' | 'V' | 'L';

// Conditions possibles par surface ou par dent entière
export type ToothCondition =
  | 'sain'
  | 'carie'
  | 'obturation'
  | 'couronne'
  | 'bridge'
  | 'implant'
  | 'extraction'
  | 'absent'
  | 'fracture'
  | 'traitement_canal'
  | 'prothese_amovible'
  | 'scellement';

// État d'une dent individuelle
export interface ToothState {
  // Condition globale (absent, implant, couronne couvrent toute la dent)
  status?: ToothCondition;
  // Conditions par surface
  surfaces: Partial<Record<ToothSurface, ToothCondition>>;
  // Note libre sur la dent
  note?: string;
}

// Données complètes de l'odontogramme (clé = numéro FDI)
export type OdontogrammeData = Record<string, ToothState>;

// Enregistrement Supabase
export interface Odontogramme {
  id: string;
  id_patient: string;
  id_etablissement: string;
  id_praticien: string;
  data: OdontogrammeData;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OdontogrammeUpsert {
  id_patient: string;
  data: OdontogrammeData;
  notes?: string | null;
}

// ─── Constantes ───

export const SURFACE_LABELS: Record<ToothSurface, string> = {
  O: 'Occlusale',
  M: 'Mésiale',
  D: 'Distale',
  V: 'Vestibulaire',
  L: 'Linguale',
};

export const CONDITION_LABELS: Record<ToothCondition, string> = {
  sain: 'Sain',
  carie: 'Carie',
  obturation: 'Obturation',
  couronne: 'Couronne',
  bridge: 'Bridge',
  implant: 'Implant',
  extraction: 'À extraire',
  absent: 'Absent',
  fracture: 'Fracture',
  traitement_canal: 'Traitement canal',
  prothese_amovible: 'Prothèse amovible',
  scellement: 'Scellement',
};

export const CONDITION_COLORS: Record<ToothCondition, string> = {
  sain: '#e5e7eb',          // gray-200
  carie: '#ef4444',          // red-500
  obturation: '#3b82f6',     // blue-500
  couronne: '#f59e0b',       // amber-500
  bridge: '#f97316',         // orange-500
  implant: '#8b5cf6',        // violet-500
  extraction: '#dc2626',     // red-600
  absent: '#d1d5db',         // gray-300
  fracture: '#ec4899',       // pink-500
  traitement_canal: '#6366f1', // indigo-500
  prothese_amovible: '#14b8a6', // teal-500
  scellement: '#06b6d4',     // cyan-500
};

// Dents adultes — notation FDI
// Quadrant 1 (sup droit): 18→11, Quadrant 2 (sup gauche): 21→28
// Quadrant 4 (inf droit): 48→41, Quadrant 3 (inf gauche): 31→38
export const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
export const UPPER_LEFT  = ['21', '22', '23', '24', '25', '26', '27', '28'];
export const LOWER_RIGHT = ['48', '47', '46', '45', '44', '43', '42', '41'];
export const LOWER_LEFT  = ['31', '32', '33', '34', '35', '36', '37', '38'];

export const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_LEFT, ...LOWER_RIGHT];

// Conditions qui s'appliquent à la dent entière (pas par surface)
export const WHOLE_TOOTH_CONDITIONS: ToothCondition[] = [
  'absent', 'extraction', 'implant', 'couronne', 'bridge', 'prothese_amovible',
];

// Conditions qui s'appliquent par surface
export const SURFACE_CONDITIONS: ToothCondition[] = [
  'sain', 'carie', 'obturation', 'fracture', 'traitement_canal', 'scellement',
];
