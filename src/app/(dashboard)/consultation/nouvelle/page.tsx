'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import ConsultationService from '@/app/services/ConsultationService';
import { useAuth } from '@/contexts/AuthContext';
import MiniOdontogramme from '@/app/components/odontogramme/MiniOdontogramme';
import type { Acte } from '@/types/consultation.types';

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  numero_dossier: string;
}

const INPUT_CLS =
  'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

const CATEGORIE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  soin: 'Soins',
  chirurgie: 'Chirurgie',
  prothese: 'Prothèse',
  orthodontie: 'Orthodontie',
  radiologie: 'Radiologie',
  autre: 'Autre',
};

export default function NouvelleConsultationPage() {
  const router = useRouter();
  const { profil } = useAuth();

  // Patient search
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Actes
  const [actes, setActes] = useState<Acte[]>([]);
  const [selectedActes, setSelectedActes] = useState<string[]>([]);
  const [actesOpen, setActesOpen] = useState(true);

  // Dents
  const [dentsConcernees, setDentsConcernees] = useState<string[]>([]);
  const [dentsOpen, setDentsOpen] = useState(true);

  // Form
  const [motif, setMotif] = useState('');
  const [notesCliniques, setNotesCliniques] = useState('');
  const [compteRendu, setCompteRendu] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load actes on mount
  useEffect(() => {
    ConsultationService.getActes().then(setActes);
  }, []);

  // Patient search debounce
  useEffect(() => {
    if (patientQuery.length < 2) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await ConsultationService.searchPatients(patientQuery);
      setPatientResults(results);
      setShowDropdown(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientQuery]);

  // Close dropdown on click outside
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

  const toggleActe = (acteId: string) => {
    setSelectedActes((prev) =>
      prev.includes(acteId) ? prev.filter((id) => id !== acteId) : [...prev, acteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient.');
      return;
    }

    setLoading(true);
    try {
      const actesText = selectedActes
        .map((id) => {
          const a = actes.find((act) => act.id === id);
          return a ? `${a.code} - ${a.libelle}` : '';
        })
        .filter(Boolean)
        .join('\n');

      const consultation = await ConsultationService.create({
        id_patient: selectedPatient.id,
        id_praticien: profil?.id || '',
        motif: motif || null,
        actes_realises: actesText || null,
        dents_concernees: dentsConcernees.length > 0 ? dentsConcernees : null,
        notes_cliniques: notesCliniques || null,
        compte_rendu: compteRendu || null,
      });

      router.push(`/consultation/${consultation.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Group actes by categorie
  const actesByCategorie = actes.reduce<Record<string, Acte[]>>((acc, acte) => {
    const cat = acte.categorie || 'autre';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(acte);
    return acc;
  }, {});

  const actesTotal = selectedActes.reduce((sum, id) => {
    const a = actes.find((act) => act.id === id);
    return sum + (a?.prix_unitaire ?? 0);
  }, 0);

  // ─── Stepper indicators ───
  const steps = [
    { label: 'Patient', done: !!selectedPatient },
    { label: 'Clinique', done: !!motif || !!notesCliniques },
    { label: 'Actes', done: selectedActes.length > 0 },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/consultation')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle consultation</h1>
          {/* Progress dots */}
          <div className="flex items-center gap-3 mt-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step.done ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
                <span className={`text-xs ${step.done ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ──── Section 1 : Patient ──── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            1 · Patient
          </h2>
          <div className="relative" ref={dropdownRef}>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-4 py-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{selectedPatient.numero_dossier}</p>
                  </div>
                </div>
                <button type="button" onClick={handleClearPatient} className="p-1.5 hover:bg-blue-100 rounded transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un patient par nom ou n° dossier..."
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {showDropdown && patientResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-gray-600">
                            {p.prenom[0]}{p.nom[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-gray-400 font-mono">{p.numero_dossier}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ──── Section 2 : Clinique ──── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            2 · Examen clinique
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif de consultation</label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={INPUT_CLS}
              placeholder="Ex: Douleur molaire, Contrôle annuel, Détartrage..."
            />
          </div>

          {/* Dents concernées (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setDentsOpen(!dentsOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                Dents concernées
                {dentsConcernees.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600 font-normal">
                    ({dentsConcernees.length} sélectionnée{dentsConcernees.length > 1 ? 's' : ''})
                  </span>
                )}
              </label>
              {dentsOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {dentsOpen && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <MiniOdontogramme
                  selectedTeeth={dentsConcernees}
                  onChange={setDentsConcernees}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes cliniques</label>
            <textarea
              value={notesCliniques}
              onChange={(e) => setNotesCliniques(e.target.value)}
              rows={4}
              className={`${INPUT_CLS} resize-none`}
              placeholder="Observations cliniques, examen, diagnostic..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Compte rendu</label>
            <textarea
              value={compteRendu}
              onChange={(e) => setCompteRendu(e.target.value)}
              rows={3}
              className={`${INPUT_CLS} resize-none`}
              placeholder="Résumé de la consultation, plan de traitement..."
            />
          </div>
        </div>

        {/* ──── Section 3 : Actes réalisés ──── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <button
            type="button"
            onClick={() => setActesOpen(!actesOpen)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              3 · Actes réalisés
              {selectedActes.length > 0 && (
                <span className="ml-2 text-blue-600 normal-case font-medium">
                  {selectedActes.length} sélectionné{selectedActes.length > 1 ? 's' : ''} — {new Intl.NumberFormat('fr-FR').format(actesTotal)} FCFA
                </span>
              )}
            </h2>
            {actesOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {actesOpen && (
            <div className="mt-4 space-y-5">
              {actes.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Aucun acte configuré. Ajoutez des actes dans les paramètres de l&apos;établissement.</p>
              ) : (
                <>
                  {Object.entries(actesByCategorie).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {CATEGORIE_LABELS[cat] || cat}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((acte) => {
                          const isSelected = selectedActes.includes(acte.id);
                          return (
                            <button
                              key={acte.id}
                              type="button"
                              onClick={() => toggleActe(acte.id)}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-left text-sm transition-all ${
                                isSelected
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs text-gray-400 flex-shrink-0">{acte.code}</span>
                                <span className="truncate">{acte.libelle}</span>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {new Intl.NumberFormat('fr-FR').format(acte.prix_unitaire)} FCFA
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedActes.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {selectedActes.length} acte{selectedActes.length > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        Total : {new Intl.NumberFormat('fr-FR').format(actesTotal)} FCFA
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ──── Actions ──── */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push('/consultation')}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || !selectedPatient}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la consultation'}
          </button>
        </div>
      </form>
    </div>
  );
}
