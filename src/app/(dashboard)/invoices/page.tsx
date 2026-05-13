'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronLeft, ChevronRight, Receipt, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import FactureService from '@/app/services/FactureService';
import { useEtablissement } from '@/hooks/useEtablissement';
import { formatMoney, formatDate } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import type { Facture, FactureFilters, StatutFacture } from '@/types/facture.types';

const LIMIT = 20;

const STATUT_BADGE: Record<StatutFacture, { label: string; cls: string }> = {
  brouillon: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' },
  emise: { label: 'Émise', cls: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200' },
  payee: { label: 'Payée', cls: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' },
  partiellement_payee: { label: 'Partielle', cls: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' },
  annulee: { label: 'Annulée', cls: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200' },
  impayee: { label: 'Impayée', cls: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200' },
};

export default function InvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const etab = useEtablissement();
  const devise = etab?.devise || 'XOF';
  const [factures, setFactures] = useState<Facture[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalEmis: 0, totalPaye: 0, totalImpaye: 0, nbFactures: 0 });
  const [filters, setFilters] = useState<FactureFilters>({ search: '', page: 1, limit: LIMIT });

  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const [result, s] = await Promise.all([
          FactureService.getAll(filters),
          FactureService.getStats(),
        ]);
        if (cancelled) return;
        setFactures(result.data);
        setTotal(result.total);
        setStats(s);
      } catch (err) {
        console.error('Erreur chargement factures:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.nbFactures} facture{stats.nbFactures !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/invoices/nouvelle')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total émis</span>
            <TrendingUp className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-xl font-bold text-gray-900">{formatMoney(stats.totalEmis, devise)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Encaissé</span>
            <Wallet className="w-4 h-4 text-emerald-300" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatMoney(stats.totalPaye, devise)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Impayé</span>
            <TrendingDown className="w-4 h-4 text-red-300" />
          </div>
          <p className="text-xl font-bold text-red-600">{formatMoney(stats.totalImpaye, devise)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par n° facture..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={filters.statut || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, statut: (e.target.value || undefined) as StatutFacture | undefined, page: 1 }))}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Tous les statuts</option>
            <option value="emise">Émise</option>
            <option value="payee">Payée</option>
            <option value="partiellement_payee">Partielle</option>
            <option value="impayee">Impayée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : factures.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune facture trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">N°</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Patient</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Date</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Total TTC</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Payé</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factures.map((f) => {
                const badge = STATUT_BADGE[f.statut] || STATUT_BADGE.emise;
                return (
                  <tr
                    key={f.id}
                    onClick={() => router.push(`/invoices/${f.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-gray-800">{f.numero}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {f.patient?.prenom} {f.patient?.nom}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{f.patient?.numero_dossier}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{formatDate(f.date_emission)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{formatMoney(f.total_ttc, devise)}</span>
                    </td>
                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{formatMoney(f.total_paye, devise)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {filters.page} sur {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))} disabled={(filters.page ?? 1) <= 1} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))} disabled={(filters.page ?? 1) >= totalPages} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
