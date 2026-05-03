'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CreditCard, XCircle } from 'lucide-react';
import FactureService from '@/app/services/FactureService';
import DocumentLayout from '@/app/components/documents/DocumentLayout';
import { useEtablissement } from '@/hooks/useEtablissement';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, formatDate } from '@/lib/format';
import { printDocument } from '@/lib/printDocument';
import type { Facture, StatutFacture } from '@/types/facture.types';

const STATUT_BADGE: Record<StatutFacture, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
  emise: { label: 'Émise', cls: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200' },
  payee: { label: 'Payée', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' },
  partiellement_payee: { label: 'Partiellement payée', cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' },
  annulee: { label: 'Annulée', cls: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200' },
  impayee: { label: 'Impayée', cls: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' },
};

export default function FactureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const factureId = params.id as string;
  const etab = useEtablissement();
  const { profil } = useAuth();
  const devise = etab?.devise || 'XOF';
  const documentRef = useRef<HTMLDivElement>(null);

  const [facture, setFacture] = useState<Facture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Paiement dialog
  const [showPaiement, setShowPaiement] = useState(false);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [paiementLoading, setPaiementLoading] = useState(false);
  const [paiementError, setPaiementError] = useState<string | null>(null);

  const fetchFacture = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FactureService.getById(factureId);
      setFacture(data);
    } catch (error) {
      console.error('Erreur chargement facture:', error);
      setFacture(null);
    } finally {
      setIsLoading(false);
    }
  }, [factureId]);

  useEffect(() => { fetchFacture(); }, [fetchFacture]);

  const handlePaiement = async () => {
    const montant = parseFloat(montantPaiement);
    if (!montant || montant <= 0) { setPaiementError('Montant invalide.'); return; }
    setPaiementLoading(true);
    setPaiementError(null);
    try {
      await FactureService.enregistrerPaiement(factureId, montant);
      setShowPaiement(false);
      setMontantPaiement('');
      fetchFacture();
    } catch (err: any) {
      setPaiementError(err.message || 'Erreur lors du paiement.');
    } finally {
      setPaiementLoading(false);
    }
  };

  const handleAnnuler = async () => {
    if (!confirm('Annuler cette facture ?')) return;
    try {
      await FactureService.update(factureId, { statut: 'annulee' });
      fetchFacture();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!facture) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Facture introuvable</p>
        <button onClick={() => router.push('/invoices')} className="mt-4 text-sm text-blue-600 hover:underline">Retour</button>
      </div>
    );
  }

  const badge = STATUT_BADGE[facture.statut] || STATUT_BADGE.emise;
  const canPay = facture.statut !== 'payee' && facture.statut !== 'annulee';
  const canCancel = facture.statut !== 'annulee' && facture.statut !== 'payee';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Action bar — hidden when printing */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.push('/invoices')} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{facture.numero}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Émise le {formatDate(facture.date_emission)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => documentRef.current && printDocument(documentRef.current, `Facture ${facture.numero}`)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
          {canPay && (
            <button onClick={() => setShowPaiement(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
              <CreditCard className="w-4 h-4" /> Paiement
            </button>
          )}
          {canCancel && (
            <button onClick={handleAnnuler} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <XCircle className="w-4 h-4" /> Annuler
            </button>
          )}
        </div>
      </div>

      {/* Document — le ref capture ce contenu pour l'impression */}
      <div ref={documentRef}>
      <DocumentLayout
        title="Facture"
        numero={facture.numero}
        date={facture.date_emission}
        praticien={profil ? { nom: profil.nom, prenom: profil.prenom } : null}
        patient={facture.patient ? {
          nom: facture.patient.nom,
          prenom: facture.patient.prenom,
          numero_dossier: facture.patient.numero_dossier,
        } : null}
        footer={
          <div className="flex justify-between items-end text-xs text-gray-400">
            <div>
              <p>{etab?.nom || 'Cabinet Dentaire'}</p>
              <p>TVA : {facture.taux_tva}%</p>
            </div>
            <div className="text-right">
              <p>Document généré le {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        }
      >
        {/* Lignes de facturation */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-widest pb-3">Libellé</th>
              <th className="text-center text-[10px] font-medium text-gray-400 uppercase tracking-widest pb-3 w-16">Qté</th>
              <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest pb-3 w-28">Prix unit.</th>
              <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-widest pb-3 w-32">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(facture.lignes ?? []).map((l, idx) => (
              <tr key={idx} className="print-no-break">
                <td className="py-3 pr-4">
                  <span className="text-sm text-gray-800">{l.libelle}</span>
                  {l.code && <span className="ml-2 text-xs text-gray-400 font-mono">{l.code}</span>}
                </td>
                <td className="py-3 text-center text-sm text-gray-600">{l.quantite}</td>
                <td className="py-3 text-right text-sm text-gray-600">{formatMoney(l.prix_unitaire, devise)}</td>
                <td className="py-3 text-right text-sm font-medium text-gray-800">{formatMoney(l.montant_ht, devise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="ml-auto w-72 space-y-2 print-no-break">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total HT</span>
            <span className="text-gray-800">{formatMoney(facture.total_ht, devise)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">TVA ({facture.taux_tva}%)</span>
            <span className="text-gray-800">{formatMoney(facture.montant_tva, devise)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t-2 border-gray-800">
            <span className="text-gray-900">Total TTC</span>
            <span className="text-gray-900">{formatMoney(facture.total_ttc, devise)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-gray-500">Payé</span>
            <span className="text-emerald-600 font-medium">{formatMoney(facture.total_paye, devise)}</span>
          </div>
          {facture.reste_a_payer > 0 && (
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-red-600">Reste à payer</span>
              <span className="text-red-600">{formatMoney(facture.reste_a_payer, devise)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{facture.notes}</p>
          </div>
        )}
      </DocumentLayout>
      </div>

      {/* Paiement dialog — hidden when printing */}
      {showPaiement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowPaiement(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enregistrer un paiement</h3>
            <p className="text-sm text-gray-500 mb-4">Reste à payer : <span className="font-medium text-gray-800">{formatMoney(facture.reste_a_payer, devise)}</span></p>
            {paiementError && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{paiementError}</div>}
            <input
              type="number"
              min="1"
              max={facture.reste_a_payer}
              value={montantPaiement}
              onChange={(e) => setMontantPaiement(e.target.value)}
              placeholder={`Montant en ${devise}`}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowPaiement(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Annuler</button>
              <button onClick={handlePaiement} disabled={paiementLoading} className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {paiementLoading ? 'Enregistrement...' : 'Valider le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
