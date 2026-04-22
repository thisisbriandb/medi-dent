'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
  ClipboardList,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEtablissement } from '@/hooks/useEtablissement';
import { formatMoney, formatDate, formatTime } from '@/lib/format';
import RdvService from '@/app/services/RdvService';
import FactureService from '@/app/services/FactureService';
import ConsultationService from '@/app/services/ConsultationService';
import PatientSupabaseService from '@/app/services/PatientSupabaseService';
import type { RendezVous, StatutRdv } from '@/types/rdv.types';
import type { Consultation } from '@/types/consultation.types';

// ─── Helpers ───

function todayRange(): { from: string; to: string } {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return { from: `${yyyy}-${mm}-${dd}T00:00:00`, to: `${yyyy}-${mm}-${dd}T23:59:59` };
}

const RDV_STATUT_CLS: Record<StatutRdv, string> = {
  planifie: 'bg-blue-50 text-blue-600',
  confirme: 'bg-emerald-50 text-emerald-600',
  en_cours: 'bg-amber-50 text-amber-700',
  termine: 'bg-gray-100 text-gray-500',
  annule: 'bg-red-50 text-red-500',
  absent: 'bg-gray-100 text-gray-400',
};

const RDV_STATUT_LABEL: Record<StatutRdv, string> = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
  absent: 'Absent',
};

// ─── Dashboard state ───

interface DashboardData {
  rdvAujourdhui: RendezVous[];
  dernieresConsultations: Consultation[];
  factureStats: { totalEmis: number; totalPaye: number; totalImpaye: number; nbFactures: number };
  nbPatients: number;
}

export default function DashboardPage() {
  const { profil, isAuthenticated, isLoading: authLoading } = useAuth();
  const etab = useEtablissement();
  const devise = etab?.devise || 'XOF';
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    const { from, to } = todayRange();

    const [rdvRes, consultRes, factStats, patientRes] = await Promise.all([
      RdvService.getByDateRange(from, to),
      ConsultationService.getAll({ page: 1, limit: 5 }),
      FactureService.getStats(),
      PatientSupabaseService.getAll({ page: 1, limit: 1 }),
    ]);

    setData({
      rdvAujourdhui: rdvRes,
      dernieresConsultations: consultRes.data,
      factureStats: factStats,
      nbPatients: patientRes.total,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated, fetchDashboard]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const rdvActifs = data?.rdvAujourdhui.filter(r => r.statut !== 'annule' && r.statut !== 'absent') ?? [];
  const prochainRdv = rdvActifs.find(r => new Date(r.date_heure) >= new Date());

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, Dr. {profil?.prenom} {profil?.nom}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {etab?.nom && <span> — {etab.nom}</span>}
        </p>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Patients"
              value={String(data.nbPatients)}
              icon={<Users className="w-5 h-5 text-blue-400" />}
              onClick={() => router.push('/patients')}
            />
            <StatCard
              label="RDV aujourd'hui"
              value={String(rdvActifs.length)}
              icon={<Calendar className="w-5 h-5 text-purple-400" />}
              onClick={() => router.push('/appointments')}
            />
            <StatCard
              label="Encaissé"
              value={formatMoney(data.factureStats.totalPaye, devise)}
              icon={<Wallet className="w-5 h-5 text-emerald-400" />}
              onClick={() => router.push('/invoices')}
            />
            <StatCard
              label="Impayé"
              value={formatMoney(data.factureStats.totalImpaye, devise)}
              icon={<TrendingDown className="w-5 h-5 text-red-400" />}
              color={data.factureStats.totalImpaye > 0 ? 'text-red-600' : undefined}
              onClick={() => router.push('/invoices')}
            />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* RDV du jour */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Rendez-vous du jour</h2>
                <button
                  onClick={() => router.push('/appointments')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Voir l'agenda
                </button>
              </div>

              {rdvActifs.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aucun rendez-vous aujourd'hui</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {rdvActifs.slice(0, 6).map((rdv) => {
                    const isPast = new Date(rdv.date_heure) < new Date();
                    return (
                      <div
                        key={rdv.id}
                        className={`flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${isPast ? 'opacity-60' : ''}`}
                        onClick={() => router.push('/appointments')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center w-12">
                            <span className="text-sm font-bold text-gray-900">{formatTime(rdv.date_heure)}</span>
                            <span className="text-[10px] text-gray-400">{rdv.duree_minutes}min</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {rdv.patient?.prenom} {rdv.patient?.nom}
                            </p>
                            <p className="text-xs text-gray-400">{rdv.motif || 'RDV'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${RDV_STATUT_CLS[rdv.statut]}`}>
                          {RDV_STATUT_LABEL[rdv.statut]}
                        </span>
                      </div>
                    );
                  })}
                  {rdvActifs.length > 6 && (
                    <div className="px-6 py-3 text-center">
                      <button onClick={() => router.push('/appointments')} className="text-xs text-blue-600 hover:underline">
                        +{rdvActifs.length - 6} autre{rdvActifs.length - 6 > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Activité récente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Dernières consultations</h2>
                <button
                  onClick={() => router.push('/consultation')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {data.dernieresConsultations.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aucune consultation récente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.dernieresConsultations.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/consultation/${c.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.patient?.prenom} {c.patient?.nom}
                          </p>
                          <p className="text-xs text-gray-400">{c.motif || 'Consultation'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(c.date_consultation)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Résumé financier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Factures</p>
                <p className="text-lg font-bold text-gray-900">{data.factureStats.nbFactures}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total émis</p>
                <p className="text-lg font-bold text-gray-900">{formatMoney(data.factureStats.totalEmis, devise)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Encaissé</p>
                <p className="text-lg font-bold text-emerald-600">{formatMoney(data.factureStats.totalPaye, devise)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Impayé</p>
                <p className={`text-lg font-bold ${data.factureStats.totalImpaye > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatMoney(data.factureStats.totalImpaye, devise)}
                </p>
              </div>
            </div>
          </div>

          {/* Next appointment highlight */}
          {prochainRdv && (
            <div
              className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:bg-blue-100/50 transition-colors"
              onClick={() => router.push('/appointments')}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Prochain RDV — {formatTime(prochainRdv.date_heure)}</p>
                  <p className="text-sm text-blue-700">
                    {prochainRdv.patient?.prenom} {prochainRdv.patient?.nom}
                    {prochainRdv.motif && <span className="text-blue-500"> — {prochainRdv.motif}</span>}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Stat Card ───

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-gray-200 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}