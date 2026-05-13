'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  TrendingDown,
  Wallet,
  ClipboardList,
  Clock,
  ChevronRight,
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
  planifie: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  confirme: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  en_cours: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  termine: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  annule: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200',
  absent: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
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
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
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
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setData(null);
      setLoadError('Impossible de charger le dashboard.');
    } finally {
      setIsLoading(false);
    }
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
      {/* Header : greeting + stats inline */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, Dr. {profil?.prenom}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {etab?.nom && <span> — {etab.nom}</span>}
          </p>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm">
            <button onClick={() => router.push('/patients')} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-gray-800">{data.nbPatients}</span>
              <span className="text-gray-400 hidden sm:inline">patients</span>
            </button>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <button onClick={() => router.push('/appointments')} className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-gray-800">{rdvActifs.length}</span>
              <span className="text-gray-400">RDV</span>
            </button>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <button onClick={() => router.push('/invoices')} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-gray-800">{formatMoney(data.factureStats.totalPaye, devise)}</span>
            </button>
            {data.factureStats.totalImpaye > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                <button onClick={() => router.push('/invoices')} className="flex items-center gap-1.5 hover:text-red-600 transition-colors">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-red-600">{formatMoney(data.factureStats.totalImpaye, devise)}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : loadError || !data ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">{loadError || 'Données indisponibles.'}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Prochain RDV — bannière discrète */}
          {prochainRdv && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 bg-blue-50/60 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => router.push('/appointments')}
            >
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Prochain : {formatTime(prochainRdv.date_heure)}</span>
                {' — '}
                {prochainRdv.patient?.prenom} {prochainRdv.patient?.nom}
                {prochainRdv.motif && <span className="text-blue-500"> · {prochainRdv.motif}</span>}
              </p>
              <ChevronRight className="w-4 h-4 text-blue-300 ml-auto flex-shrink-0" />
            </div>
          )}

          {/* Contenu principal : RDV dominant (2/3) + consultations secondaire (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* RDV du jour — zone principale */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Rendez-vous du jour</h2>
                <button
                  onClick={() => router.push('/appointments')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Voir l&apos;agenda
                </button>
              </div>

              {rdvActifs.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun rendez-vous aujourd&apos;hui</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {rdvActifs.slice(0, 8).map((rdv) => {
                    const isPast = new Date(rdv.date_heure) < new Date();
                    return (
                      <div
                        key={rdv.id}
                        className={`flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${isPast ? 'opacity-50' : ''}`}
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
                  {rdvActifs.length > 8 && (
                    <div className="px-6 py-2.5 text-center">
                      <button onClick={() => router.push('/appointments')} className="text-xs text-blue-600 hover:underline">
                        +{rdvActifs.length - 8} autre{rdvActifs.length - 8 > 1 ? 's' : ''}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dernières consultations — zone secondaire */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Consultations</h2>
                <button
                  onClick={() => router.push('/consultation')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {data.dernieresConsultations.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune consultation</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.dernieresConsultations.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/consultation/${c.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {c.patient?.prenom} {c.patient?.nom}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{c.motif || 'Consultation'}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDate(c.date_consultation)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}