'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderOpen, Calendar, ChevronRight } from 'lucide-react';
import PatientSupabaseService from '@/app/services/PatientSupabaseService';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import type { Patient, PatientFilters } from '@/types/patient.types';

const LIMIT = 20;

export default function DossiersMedicauxPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PatientFilters>({ search: '', page: 1, limit: LIMIT, est_actif: true });

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
        const res = await PatientSupabaseService.getAll(filters);
        if (cancelled) return;
        setPatients(res.data);
        setTotal(res.total);
      } catch (error) {
        console.error('Erreur chargement dossiers médicaux:', error);
        if (cancelled) return;
        setPatients([]);
        setTotal(0);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, filters]);

  function calculateAge(dateNaissance: string | null): string {
    if (!dateNaissance) return '';
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} ans`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers médicaux</h1>
          <p className="text-sm text-gray-500 mt-1">{total} patient{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient par nom, prénom, n° dossier…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Patient list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Aucun patient trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/documents/${p.id}`)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-600">
                    {p.prenom?.[0]}{p.nom?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.prenom} {p.nom}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400 font-mono">{p.numero_dossier}</span>
                    {p.date_naissance && (
                      <span className="text-xs text-gray-400">{calculateAge(p.date_naissance)}</span>
                    )}
                    {p.sexe && (
                      <span className="text-xs text-gray-400">{p.sexe === 'M' ? 'H' : 'F'}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {p.derniere_visite && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(p.derniere_visite)}</span>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {filters.page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
              disabled={(filters.page ?? 1) <= 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page ?? 1) + 1) }))}
              disabled={(filters.page ?? 1) >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
