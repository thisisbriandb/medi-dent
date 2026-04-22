'use client';

import React from 'react';
import { useEtablissement } from '@/hooks/useEtablissement';
import { formatDate } from '@/lib/format';
import Image from 'next/image';

interface DocumentLayoutProps {
  title: string;
  subtitle?: string;
  date?: string | null;
  numero?: string;
  praticien?: { nom: string; prenom: string } | null;
  patient?: {
    nom: string;
    prenom: string;
    numero_dossier?: string;
    date_naissance?: string | null;
  } | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Layout réutilisable pour tous les documents imprimables.
 * - En-tête avec logo/nom de l'établissement
 * - Informations praticien / patient
 * - Zone de contenu
 * - Footer personnalisable (signature, mentions légales, etc.)
 *
 * Usage :
 *  <DocumentLayout title="FACTURE" numero="FAC-2026-0001" patient={...}>
 *    {contenu}
 *  </DocumentLayout>
 */
export default function DocumentLayout({
  title,
  subtitle,
  date,
  numero,
  praticien,
  patient,
  children,
  footer,
}: DocumentLayoutProps) {
  const etab = useEtablissement();

  return (
    <div className="print-document bg-white rounded-xl shadow-sm border border-gray-100 p-8 print:shadow-none print:border-0 print:rounded-none print:p-0">
      {/* ─── En-tête établissement ─── */}
      <div className="flex items-start justify-between pb-6 mb-6 border-b-2 border-gray-200">
        <div className="flex items-center gap-4">
          {etab?.logoUrl && (
            <Image src={etab.logoUrl} alt={etab.nom} width={60} height={60} className="rounded-lg object-contain" />
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{etab?.nom || 'Cabinet Dentaire'}</h2>
            {etab?.modeActif && (
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                {etab.modeActif === 'cabinet' ? 'Cabinet dentaire' : 'Établissement hospitalier'}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">{title}</h1>
          {numero && <p className="text-sm font-mono text-gray-600 mt-1">{numero}</p>}
          {date && <p className="text-sm text-gray-500 mt-1">{formatDate(date)}</p>}
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* ─── Praticien & Patient ─── */}
      {(praticien || patient) && (
        <div className="grid grid-cols-2 gap-8 mb-8 print-no-break">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-2">Praticien</p>
            {praticien ? (
              <p className="text-sm font-medium text-gray-900">Dr. {praticien.prenom} {praticien.nom}</p>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-2">Patient</p>
            {patient ? (
              <div>
                <p className="text-sm font-medium text-gray-900">{patient.prenom} {patient.nom}</p>
                {patient.date_naissance && (
                  <p className="text-xs text-gray-500 mt-0.5">Né(e) le {formatDate(patient.date_naissance)}</p>
                )}
                {patient.numero_dossier && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{patient.numero_dossier}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Contenu du document ─── */}
      <div className="mb-8">
        {children}
      </div>

      {/* ─── Footer ─── */}
      {footer && (
        <div className="pt-6 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}
