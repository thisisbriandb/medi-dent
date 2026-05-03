'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import OrdonnanceService from '@/app/services/OrdonnanceService';
import DocumentLayout from '@/app/components/documents/DocumentLayout';
import { useEtablissement } from '@/hooks/useEtablissement';
import { formatDateLong, formatDate } from '@/lib/format';
import { printDocument } from '@/lib/printDocument';
import type { Ordonnance } from '@/types/ordonnance.types';

export default function OrdonnanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ordonnanceId = params.id as string;
  const etab = useEtablissement();
  const documentRef = useRef<HTMLDivElement>(null);

  const [ordonnance, setOrdonnance] = useState<Ordonnance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await OrdonnanceService.getById(ordonnanceId);
      setOrdonnance(data);
    } catch (error) {
      console.error('Erreur chargement ordonnance:', error);
      setOrdonnance(null);
    } finally {
      setIsLoading(false);
    }
  }, [ordonnanceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!ordonnance) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Ordonnance introuvable</p>
        <button onClick={() => router.push('/prescriptions')} className="mt-4 text-sm text-blue-600 hover:underline">Retour</button>
      </div>
    );
  }

  const lignes = ordonnance.lignes ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Action bar — hidden when printing */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.push('/prescriptions')} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ordonnance</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDateLong(ordonnance.created_at)}</p>
          </div>
        </div>
        <button
          onClick={() => documentRef.current && printDocument(documentRef.current, 'Ordonnance médicale')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimer
        </button>
      </div>

      {/* Document — le ref capture ce contenu pour l'impression */}
      <div ref={documentRef}>
      <DocumentLayout
        title="Ordonnance médicale"
        date={ordonnance.created_at}
        praticien={ordonnance.praticien ? { nom: ordonnance.praticien.nom, prenom: ordonnance.praticien.prenom } : null}
        patient={ordonnance.patient ? {
          nom: ordonnance.patient.nom,
          prenom: ordonnance.patient.prenom,
          numero_dossier: ordonnance.patient.numero_dossier,
          date_naissance: ordonnance.patient.date_naissance,
        } : null}
        footer={
          <div className="flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p>{etab?.nom || 'Cabinet Dentaire'}</p>
              <p>Document généré le {formatDate(new Date().toISOString())}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-12">Signature du praticien</p>
              <div className="w-48 border-t border-gray-300" />
              {ordonnance.praticien && (
                <p className="text-xs text-gray-500 mt-1">
                  Dr. {ordonnance.praticien.prenom} {ordonnance.praticien.nom}
                </p>
              )}
            </div>
          </div>
        }
      >
        {/* Médicaments */}
        <div className="space-y-4">
          {lignes.map((l, idx) => (
            <div key={idx} className="flex gap-4 py-3 border-b border-gray-100 last:border-0 print-no-break">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-blue-600">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{l.medicament}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  {l.posologie && (
                    <span className="text-sm text-gray-600">{l.posologie}</span>
                  )}
                  {l.duree && (
                    <span className="text-sm text-gray-500">pendant {l.duree}</span>
                  )}
                </div>
                {l.remarques && (
                  <p className="text-xs text-gray-400 mt-1 italic">{l.remarques}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes patient */}
        {ordonnance.notes_patient && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-2">Notes pour le patient</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ordonnance.notes_patient}</p>
          </div>
        )}
      </DocumentLayout>
      </div>
    </div>
  );
}
