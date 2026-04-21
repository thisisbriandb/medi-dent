'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { profil, isAuthenticated, isLoading, modeActif } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, Dr. {profil?.prenom} {profil?.nom}
        </h1>
        <p className="text-gray-500">
          Mode actif : {modeActif === 'cabinet' ? 'Cabinet Dentaire' : 'Hôpital'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Rôle</p>
          <p className="text-lg font-semibold capitalize">{profil?.role?.replace('_', ' ')}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Établissement</p>
          <p className="text-lg font-semibold">{profil?.etablissement?.nom || 'Non configuré'}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-sm text-gray-500">Spécialité</p>
          <p className="text-lg font-semibold">{profil?.specialite || '—'}</p>
        </div>
      </div>
      <p className="text-gray-400 text-sm">Le tableau de bord complet sera implémenté dans la prochaine phase.</p>
    </div>
  );
}