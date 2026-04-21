'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import type { RendezVous, RdvInsert, StatutRdv } from '@/types/rdv.types';
import RdvService from '@/app/services/RdvService';

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  numero_dossier: string;
  telephone: string | null;
}

interface PraticienOption {
  id: string;
  nom: string;
  prenom: string;
}

interface RdvFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  rdv?: RendezVous | null;
  defaultDate?: string;
  defaultHeure?: string;
}

export default function RdvFormDialog({ open, onClose, onSaved, rdv, defaultDate, defaultHeure }: RdvFormDialogProps) {
  const isEdit = !!rdv;

  // Patient search
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Praticiens
  const [praticiens, setPraticiens] = useState<PraticienOption[]>([]);

  // Form fields
  const [idPraticien, setIdPraticien] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [duree, setDuree] = useState(30);
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [statut, setStatut] = useState<StatutRdv>('planifie');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load praticiens
  useEffect(() => {
    if (open) {
      RdvService.getPraticiens().then(setPraticiens);
    }
  }, [open]);

  // Init form
  useEffect(() => {
    if (!open) return;
    setError(null);

    if (rdv) {
      const dt = new Date(rdv.date_heure);
      setDate(dt.toISOString().slice(0, 10));
      setHeure(dt.toTimeString().slice(0, 5));
      setDuree(rdv.duree_minutes);
      setMotif(rdv.motif || '');
      setNotes(rdv.notes_internes || '');
      setStatut(rdv.statut);
      setIdPraticien(rdv.id_praticien);
      if (rdv.patient) {
        setSelectedPatient({
          id: rdv.patient.id,
          nom: rdv.patient.nom,
          prenom: rdv.patient.prenom,
          numero_dossier: rdv.patient.numero_dossier,
          telephone: rdv.patient.telephone ?? null,
        });
        setPatientQuery(`${rdv.patient.prenom} ${rdv.patient.nom}`);
      }
    } else {
      setDate(defaultDate || new Date().toISOString().slice(0, 10));
      setHeure(defaultHeure || '09:00');
      setDuree(30);
      setMotif('');
      setNotes('');
      setStatut('planifie');
      setIdPraticien('');
      setSelectedPatient(null);
      setPatientQuery('');
    }
  }, [open, rdv, defaultDate, defaultHeure]);

  // Patient search debounce
  useEffect(() => {
    if (patientQuery.length < 2 || selectedPatient) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await RdvService.searchPatients(patientQuery);
      setPatientResults(results);
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientQuery, selectedPatient]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setPatientQuery(`${p.prenom} ${p.nom}`);
    setShowDropdown(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient.');
      return;
    }
    if (!date || !heure) {
      setError('La date et l\'heure sont obligatoires.');
      return;
    }

    const dateHeure = `${date}T${heure}:00`;

    setLoading(true);
    try {
      if (isEdit && rdv) {
        await RdvService.update(rdv.id, {
          id_patient: selectedPatient.id,
          id_praticien: idPraticien || undefined,
          date_heure: dateHeure,
          duree_minutes: duree,
          motif: motif || null,
          notes_internes: notes || null,
          statut,
        });
      } else {
        await RdvService.create({
          id_patient: selectedPatient.id,
          id_praticien: idPraticien || undefined as any,
          date_heure: dateHeure,
          duree_minutes: duree,
          motif: motif || null,
          notes_internes: notes || null,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}

          {/* Patient */}
          <div ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Patient <span className="text-red-400">*</span>
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900">{selectedPatient.prenom} {selectedPatient.nom}</span>
                  <span className="text-xs text-gray-400 font-mono">{selectedPatient.numero_dossier}</span>
                </div>
                <button type="button" onClick={handleClearPatient} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {showDropdown && patientResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.numero_dossier}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date + Heure + Durée */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Heure <span className="text-red-400">*</span></label>
              <input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Durée (min)</label>
              <select
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1h</option>
                <option value={90}>1h30</option>
                <option value={120}>2h</option>
              </select>
            </div>
          </div>

          {/* Praticien */}
          {praticiens.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Praticien</label>
              <select
                value={idPraticien}
                onChange={(e) => setIdPraticien(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Moi-même</option>
                {praticiens.map((p) => (
                  <option key={p.id} value={p.id}>Dr. {p.prenom} {p.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif</label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ex: Détartrage, Contrôle, Extraction..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes internes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Notes visibles uniquement par l'équipe..."
            />
          </div>

          {/* Statut (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutRdv)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="planifie">Planifié</option>
                <option value="confirme">Confirmé</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le RDV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
