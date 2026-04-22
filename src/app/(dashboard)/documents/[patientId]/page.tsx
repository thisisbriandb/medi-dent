'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ClipboardList,
  Receipt,
  FileText,
  Heart,
  Activity,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import PatientSupabaseService from '@/app/services/PatientSupabaseService';
import { useEtablissement } from '@/hooks/useEtablissement';
import { formatDate, formatMoney } from '@/lib/format';
import type { Patient, ConsultationRow, FactureRow, OrdonnanceRow, StatutFacture } from '@/types/patient.types';

type TabKey = 'resume' | 'chronologie' | 'consultations' | 'ordonnances' | 'factures';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'resume', label: 'Résumé', icon: <Activity className="w-4 h-4" /> },
  { key: 'chronologie', label: 'Chronologie', icon: <Calendar className="w-4 h-4" /> },
  { key: 'consultations', label: 'Consultations', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'ordonnances', label: 'Ordonnances', icon: <FileText className="w-4 h-4" /> },
  { key: 'factures', label: 'Factures', icon: <Receipt className="w-4 h-4" /> },
];

const STATUT_CLS: Record<StatutFacture, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  emise: 'bg-blue-50 text-blue-700',
  payee: 'bg-emerald-50 text-emerald-700',
  partiellement_payee: 'bg-amber-50 text-amber-700',
  annulee: 'bg-gray-50 text-gray-400',
  impayee: 'bg-red-50 text-red-600',
};

const STATUT_LABEL: Record<StatutFacture, string> = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  payee: 'Payée',
  partiellement_payee: 'Partielle',
  annulee: 'Annulée',
  impayee: 'Impayée',
};

function calculateAge(d: string | null): string | null {
  if (!d) return null;
  const birth = new Date(d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} ans`;
}

// ─── Timeline event type ───

interface TimelineEvent {
  id: string;
  date: string;
  type: 'consultation' | 'ordonnance' | 'facture';
  title: string;
  subtitle?: string;
  detail?: string;
  link?: string;
}

export default function DossierMedicalPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const etab = useEtablissement();
  const devise = etab?.devise || 'XOF';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [factures, setFactures] = useState<FactureRow[]>([]);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('resume');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const [p, c, f, o] = await Promise.all([
      PatientSupabaseService.getById(patientId),
      PatientSupabaseService.getConsultations(patientId),
      PatientSupabaseService.getFactures(patientId),
      PatientSupabaseService.getOrdonnances(patientId),
    ]);
    setPatient(p);
    setConsultations(c);
    setFactures(f);
    setOrdonnances(o);
    setIsLoading(false);
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Computed stats ───

  const stats = useMemo(() => {
    const totalFacture = factures.filter(f => f.statut !== 'annulee').reduce((s, f) => s + (f.total_ttc || 0), 0);
    const totalPaye = factures.filter(f => f.statut !== 'annulee').reduce((s, f) => s + (f.total_paye || 0), 0);
    const totalImpaye = factures.filter(f => f.statut !== 'annulee').reduce((s, f) => s + (f.reste_a_payer || 0), 0);
    return {
      nbConsultations: consultations.length,
      nbOrdonnances: ordonnances.length,
      nbFactures: factures.length,
      totalFacture,
      totalPaye,
      totalImpaye,
    };
  }, [consultations, factures, ordonnances]);

  // ─── Timeline ───

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    consultations.forEach(c => {
      events.push({
        id: `c-${c.id}`,
        date: c.date_consultation,
        type: 'consultation',
        title: c.motif || 'Consultation',
        subtitle: c.praticien ? `Dr. ${c.praticien.prenom} ${c.praticien.nom}` : undefined,
        detail: c.notes_cliniques || undefined,
        link: `/consultation/${c.id}`,
      });
    });

    ordonnances.forEach(o => {
      events.push({
        id: `o-${o.id}`,
        date: o.created_at,
        type: 'ordonnance',
        title: 'Ordonnance médicale',
        subtitle: o.praticien ? `Dr. ${o.praticien.prenom} ${o.praticien.nom}` : undefined,
        detail: o.notes_patient || undefined,
        link: `/prescriptions/${o.id}`,
      });
    });

    factures.forEach(f => {
      events.push({
        id: `f-${f.id}`,
        date: f.date_emission || '',
        type: 'facture',
        title: `Facture ${f.numero}`,
        subtitle: `${formatMoney(f.total_ttc, devise)} — ${STATUT_LABEL[f.statut] || f.statut}`,
        link: `/invoices/${f.id}`,
      });
    });

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return events;
  }, [consultations, ordonnances, factures, devise]);

  // ─── Loading / Error ───

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Patient introuvable</p>
        <button onClick={() => router.push('/documents')} className="mt-4 text-sm text-blue-600 hover:underline">Retour</button>
      </div>
    );
  }

  const age = calculateAge(patient.date_naissance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => router.push('/documents')} className="mt-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-blue-600">{patient.prenom?.[0]}{patient.nom?.[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.prenom} {patient.nom}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400 font-mono">{patient.numero_dossier}</span>
                {age && <span className="text-sm text-gray-500">{age}</span>}
                {patient.sexe && <span className="text-sm text-gray-500">{patient.sexe === 'M' ? 'Homme' : 'Femme'}</span>}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/patients/${patient.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> Fiche patient
        </button>
      </div>

      {/* Medical alerts */}
      {patient.allergies && (
        <div className="flex items-start gap-3 bg-red-50 rounded-xl border border-red-100 p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Allergies</p>
            <p className="text-sm text-red-600 mt-0.5">{patient.allergies}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'resume' && (
            <TabResume patient={patient} stats={stats} devise={devise} />
          )}
          {activeTab === 'chronologie' && (
            <TabChronologie events={timeline} router={router} />
          )}
          {activeTab === 'consultations' && (
            <TabConsultations data={consultations} router={router} />
          )}
          {activeTab === 'ordonnances' && (
            <TabOrdonnances data={ordonnances} router={router} />
          )}
          {activeTab === 'factures' && (
            <TabFactures data={factures} devise={devise} router={router} />
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Résumé
// ═══════════════════════════════════════════

function TabResume({
  patient,
  stats,
  devise,
}: {
  patient: Patient;
  stats: { nbConsultations: number; nbOrdonnances: number; nbFactures: number; totalFacture: number; totalPaye: number; totalImpaye: number };
  devise: string;
}) {
  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Consultations" value={String(stats.nbConsultations)} icon={<ClipboardList className="w-4 h-4 text-blue-400" />} />
        <StatCard label="Ordonnances" value={String(stats.nbOrdonnances)} icon={<FileText className="w-4 h-4 text-purple-400" />} />
        <StatCard label="Facturé" value={formatMoney(stats.totalFacture, devise)} icon={<Receipt className="w-4 h-4 text-gray-400" />} />
        <StatCard label="Impayé" value={formatMoney(stats.totalImpaye, devise)} icon={<Receipt className="w-4 h-4 text-red-400" />} color={stats.totalImpaye > 0 ? 'text-red-600' : undefined} />
      </div>

      {/* Medical info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Informations médicales</h3>
          <div className="space-y-0">
            <InfoRow label="Groupe sanguin" value={patient.groupe_sanguin} />
            <InfoRow label="Allergies" value={patient.allergies} />
            <InfoRow label="Antécédents" value={patient.antecedents} />
            <InfoRow label="Traitements en cours" value={patient.traitements_en_cours} />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Informations de contact</h3>
          <div className="space-y-0">
            <InfoRow label="Téléphone" value={patient.telephone} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Adresse" value={patient.adresse} />
            <InfoRow label="Dernière visite" value={formatDate(patient.derniere_visite)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        {icon}
      </div>
      <p className={`text-lg font-bold ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Chronologie
// ═══════════════════════════════════════════

const EVENT_STYLE: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  consultation: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <ClipboardList className="w-4 h-4 text-blue-500" /> },
  ordonnance: { bg: 'bg-purple-50', border: 'border-purple-200', icon: <FileText className="w-4 h-4 text-purple-500" /> },
  facture: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Receipt className="w-4 h-4 text-emerald-500" /> },
};

function TabChronologie({ events, router }: { events: TimelineEvent[]; router: ReturnType<typeof useRouter> }) {
  if (events.length === 0) {
    return <EmptyState message="Aucun événement dans le dossier" />;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {events.map((evt) => {
          const style = EVENT_STYLE[evt.type] || EVENT_STYLE.consultation;
          return (
            <div key={evt.id} className="flex gap-4 relative">
              {/* Dot */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.bg} border ${style.border} flex items-center justify-center z-10`}>
                {style.icon}
              </div>
              {/* Content */}
              <div
                className="flex-1 bg-white rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors cursor-pointer"
                onClick={() => evt.link && router.push(evt.link)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{evt.title}</p>
                    {evt.subtitle && <p className="text-xs text-gray-500 mt-0.5">{evt.subtitle}</p>}
                    {evt.detail && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{evt.detail}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatDate(evt.date)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Consultations
// ═══════════════════════════════════════════

function TabConsultations({ data, router }: { data: ConsultationRow[]; router: ReturnType<typeof useRouter> }) {
  if (data.length === 0) return <EmptyState message="Aucune consultation enregistrée" />;

  return (
    <div className="space-y-3">
      {data.map((c) => (
        <div
          key={c.id}
          onClick={() => router.push(`/consultation/${c.id}`)}
          className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">{c.motif || 'Consultation'}</p>
            {c.praticien && (
              <p className="text-xs text-gray-500">Dr. {c.praticien.prenom} {c.praticien.nom}</p>
            )}
            {c.notes_cliniques && (
              <p className="text-xs text-gray-400 line-clamp-2 max-w-lg mt-1">{c.notes_cliniques}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatDate(c.date_consultation)}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Ordonnances
// ═══════════════════════════════════════════

function TabOrdonnances({ data, router }: { data: OrdonnanceRow[]; router: ReturnType<typeof useRouter> }) {
  if (data.length === 0) return <EmptyState message="Aucune ordonnance enregistrée" />;

  return (
    <div className="space-y-3">
      {data.map((o) => (
        <div
          key={o.id}
          onClick={() => router.push(`/prescriptions/${o.id}`)}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-800">Ordonnance du {formatDate(o.created_at)}</p>
            {o.praticien && (
              <p className="text-xs text-gray-500">Dr. {o.praticien.prenom} {o.praticien.nom}</p>
            )}
            {o.notes_patient && (
              <p className="text-xs text-gray-400 line-clamp-2 max-w-lg mt-1">{o.notes_patient}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatDate(o.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// TAB: Factures
// ═══════════════════════════════════════════

function TabFactures({ data, devise, router }: { data: FactureRow[]; devise: string; router: ReturnType<typeof useRouter> }) {
  if (data.length === 0) return <EmptyState message="Aucune facture enregistrée" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Numéro</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Date</th>
            <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Total TTC</th>
            <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Payé</th>
            <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Reste</th>
            <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider pb-3">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((f) => (
            <tr
              key={f.id}
              onClick={() => router.push(`/invoices/${f.id}`)}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <td className="py-3 text-sm font-mono text-gray-600">{f.numero || '—'}</td>
              <td className="py-3 text-sm text-gray-500">{formatDate(f.date_emission)}</td>
              <td className="py-3 text-sm text-gray-800 text-right">{formatMoney(f.total_ttc, devise)}</td>
              <td className="py-3 text-sm text-gray-500 text-right">{formatMoney(f.total_paye, devise)}</td>
              <td className="py-3 text-sm text-gray-800 text-right font-medium">{formatMoney(f.reste_a_payer, devise)}</td>
              <td className="py-3 text-right">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUT_CLS[f.statut] || ''}`}>
                  {STATUT_LABEL[f.statut] || f.statut}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════
// Empty state
// ═══════════════════════════════════════════

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
