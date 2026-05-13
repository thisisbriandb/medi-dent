'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import OrdonnanceService from '@/app/services/OrdonnanceService';
import { useAuth } from '@/contexts/AuthContext';
import type { Ordonnance, OrdonnanceFilters } from '@/types/ordonnance.types';

const LIMIT = 20;

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrdonnanceFilters>({ search: '', page: 1, limit: LIMIT });

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
        const result = await OrdonnanceService.getAll(filters);
        if (cancelled) return;
        setOrdonnances(result.data);
        setTotal(result.total);
      } catch (err) {
        console.error('Erreur chargement ordonnances:', err);
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
          <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
          <p className="text-sm text-gray-500 mt-1">{total} ordonnance{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/prescriptions/nouvelle')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nouvelle ordonnance
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par notes..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value || undefined, page: 1 }))}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <span className="text-gray-400 text-sm">à</span>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value || undefined, page: 1 }))}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          </div>
        ) : ordonnances.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune ordonnance trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Patient</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Praticien</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Médicaments</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ordonnances.map((o) => {
                const nbMedicaments = (o.lignes ?? []).length;
                return (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/prescriptions/${o.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(o.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {o.patient?.prenom} {o.patient?.nom}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{o.patient?.numero_dossier}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {o.praticien ? `Dr. ${o.praticien.prenom} ${o.praticien.nom}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {nbMedicaments} médicament{nbMedicaments !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500 line-clamp-1">{o.notes_patient || '—'}</span>
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
