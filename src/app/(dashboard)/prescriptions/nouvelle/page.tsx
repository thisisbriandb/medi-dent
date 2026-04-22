'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Plus, Trash2 } from 'lucide-react';
import OrdonnanceService from '@/app/services/OrdonnanceService';
import { useAuth } from '@/contexts/AuthContext';
import type { LigneOrdonnance } from '@/types/ordonnance.types';

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  numero_dossier: string;
}

const emptyLigne = (): LigneOrdonnance => ({
  medicament: '',
  posologie: '',
  duree: '',
  remarques: '',
});

export default function NouvelleOrdonnancePage() {
  const router = useRouter();
  const { profil } = useAuth();

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form
  const [lignes, setLignes] = useState<LigneOrdonnance[]>([emptyLigne()]);
  const [notesPatient, setNotesPatient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient search
  useEffect(() => {
    if (patientQuery.length < 2 || selectedPatient) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      const r = await OrdonnanceService.searchPatients(patientQuery);
      setPatientResults(r);
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery, selectedPatient]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectPatient = (p: PatientOption) => { setSelectedPatient(p); setPatientQuery(`${p.prenom} ${p.nom}`); setShowDropdown(false); };
  const clearPatient = () => { setSelectedPatient(null); setPatientQuery(''); };

  // Lignes
  const updateLigne = (idx: number, field: keyof LigneOrdonnance, value: string) => {
    setLignes((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addLigne = () => setLignes((prev) => [...prev, emptyLigne()]);
  const removeLigne = (idx: number) => setLignes((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPatient) { setError('Veuillez sélectionner un patient.'); return; }
    const validLignes = lignes.filter((l) => l.medicament.trim().length > 0);
    if (validLignes.length === 0) { setError('Ajoutez au moins un médicament.'); return; }

    setLoading(true);
    try {
      const ordonnance = await OrdonnanceService.create({
        id_patient: selectedPatient.id,
        id_praticien: profil?.id || '',
        lignes: validLignes,
        notes_patient: notesPatient || null,
      });
      router.push(`/prescriptions/${ordonnance.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/prescriptions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle ordonnance</h1>
          <p className="text-sm text-gray-500 mt-1">Prescrire des médicaments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

        {/* Patient */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Patient</h2>
          <div ref={dropdownRef}>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">{selectedPatient.prenom[0]}{selectedPatient.nom[0]}</span>
                  </div>
                  <span className="text-sm text-gray-900">{selectedPatient.prenom} {selectedPatient.nom}</span>
                  <span className="text-xs text-gray-400 font-mono">{selectedPatient.numero_dossier}</span>
                </div>
                <button type="button" onClick={clearPatient} className="p-1 hover:bg-gray-200 rounded"><X className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Rechercher un patient..." value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                {showDropdown && patientResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => selectPatient(p)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors">
                        <span className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.numero_dossier}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Médicaments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Prescription</h2>
          <div className="space-y-4">
            {lignes.map((l, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Médicament {idx + 1}</span>
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => removeLigne(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={l.medicament}
                  onChange={(e) => updateLigne(idx, 'medicament', e.target.value)}
                  placeholder="Nom du médicament"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={l.posologie}
                    onChange={(e) => updateLigne(idx, 'posologie', e.target.value)}
                    placeholder="Posologie (ex: 1 cp x 3/j)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <input
                    type="text"
                    value={l.duree}
                    onChange={(e) => updateLigne(idx, 'duree', e.target.value)}
                    placeholder="Durée (ex: 7 jours)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <input
                  type="text"
                  value={l.remarques || ''}
                  onChange={(e) => updateLigne(idx, 'remarques', e.target.value)}
                  placeholder="Remarques (optionnel)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={addLigne} className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Ajouter un médicament
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes pour le patient</label>
          <textarea value={notesPatient} onChange={(e) => setNotesPatient(e.target.value)} rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Conseils, précautions, régime alimentaire..." />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push('/prescriptions')} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Création...' : 'Créer l\'ordonnance'}
          </button>
        </div>
      </form>
    </div>
  );
}
