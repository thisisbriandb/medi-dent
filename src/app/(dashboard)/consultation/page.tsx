'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ConsultationPage() {
  const { profil, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Consultations</h1>
      <p className="text-gray-500">Module consultations — en cours de développement.</p>
      <p className="text-sm text-gray-400 mt-2">Connecté en tant que : {profil?.prenom} {profil?.nom} ({profil?.role})</p>
    </div>
  );
}