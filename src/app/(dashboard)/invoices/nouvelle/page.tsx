'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Plus, Trash2 } from 'lucide-react';
import FactureService from '@/app/services/FactureService';
import ConsultationService from '@/app/services/ConsultationService';
import type { LigneFacture } from '@/types/facture.types';
import type { Acte } from '@/types/consultation.types';

interface PatientOption {
  id: string;
  nom: string;
  prenom: string;
  numero_dossier: string;
}

const emptyLigne = (): LigneFacture => ({
  code: '',
  libelle: '',
  quantite: 1,
  prix_unitaire: 0,
  montant_ht: 0,
});

export default function NouvelleFacturePage() {
  const router = useRouter();

  // Patient
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Actes catalog
  const [actes, setActes] = useState<Acte[]>([]);

  // Lignes
  const [lignes, setLignes] = useState<LigneFacture[]>([emptyLigne()]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ConsultationService.getActes().then(setActes);
  }, []);

  // Patient search
  useEffect(() => {
    if (patientQuery.length < 2 || selectedPatient) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      const r = await FactureService.searchPatients(patientQuery);
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

  // Ligne management
  const updateLigne = (idx: number, field: keyof LigneFacture, value: string | number) => {
    setLignes((prev) => {
      const next = [...prev];
      const l = { ...next[idx], [field]: value };
      l.montant_ht = l.quantite * l.prix_unitaire;
      next[idx] = l;
      return next;
    });
  };

  const addLigne = () => setLignes((prev) => [...prev, emptyLigne()]);
  const removeLigne = (idx: number) => setLignes((prev) => prev.filter((_, i) => i !== idx));

  const applyActe = (idx: number, acte: Acte) => {
    setLignes((prev) => {
      const next = [...prev];
      next[idx] = { code: acte.code, libelle: acte.libelle, quantite: 1, prix_unitaire: acte.prix_unitaire, montant_ht: acte.prix_unitaire };
      return next;
    });
  };

  const totalHt = lignes.reduce((s, l) => s + l.montant_ht, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPatient) { setError('Veuillez sélectionner un patient.'); return; }
    if (lignes.length === 0 || lignes.every((l) => l.montant_ht === 0)) { setError('Ajoutez au moins un acte.'); return; }

    setLoading(true);
    try {
      const validLignes = lignes.filter((l) => l.montant_ht > 0);
      const ht = validLignes.reduce((s, l) => s + l.montant_ht, 0);
      const facture = await FactureService.create({
        id_patient: selectedPatient.id,
        lignes: validLignes,
        total_ht: ht,
        montant_tva: 0, // auto-calculated by service
        total_ttc: 0,   // auto-calculated by service
        notes: notes || null,
      });
      router.push(`/invoices/${facture.id}`);
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
        <button onClick={() => router.push('/invoices')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle facture</h1>
          <p className="text-sm text-gray-500 mt-1">Saisir les actes réalisés</p>
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

        {/* Lignes facture */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Lignes de facturation</h2>
          <div className="space-y-3">
            {lignes.map((l, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Libellé</label>}
                  <div className="relative">
                    <input
                      type="text"
                      value={l.libelle}
                      onChange={(e) => updateLigne(idx, 'libelle', e.target.value)}
                      placeholder="Acte ou prestation..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Qté</label>}
                  <input type="number" min="1" value={l.quantite} onChange={(e) => updateLigne(idx, 'quantite', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Prix unit.</label>}
                  <input type="number" min="0" value={l.prix_unitaire} onChange={(e) => updateLigne(idx, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-right" />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs text-gray-500 mb-1">Montant</label>}
                  <div className="px-3 py-2 text-sm text-gray-800 font-medium text-right bg-gray-50 rounded-lg border border-gray-100">
                    {new Intl.NumberFormat('fr-FR').format(l.montant_ht)}
                  </div>
                </div>
                <div className="col-span-1 flex justify-center">
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => removeLigne(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addLigne} className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> Ajouter une ligne
          </button>

          {/* Quick add from actes catalog */}
          {actes.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Ajout rapide depuis le catalogue :</p>
              <div className="flex flex-wrap gap-2">
                {actes.slice(0, 12).map((acte) => (
                  <button
                    key={acte.id}
                    type="button"
                    onClick={() => { addLigne(); applyActe(lignes.length, acte); }}
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    {acte.libelle} — {new Intl.NumberFormat('fr-FR').format(acte.prix_unitaire)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-end gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400">Total HT</p>
              <p className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(totalHt)} FCFA</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Notes internes ou conditions de paiement..." />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push('/invoices')} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </form>
    </div>
  );
}
