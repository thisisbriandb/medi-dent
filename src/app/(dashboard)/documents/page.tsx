'use client';

import { useAuth } from '@/contexts/AuthContext';

const DocumentsPage = () => {
  const { profil, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dossiers Médicaux</h1>
      <p className="text-gray-500">Module dossiers médicaux — en cours de développement.</p>
      <p className="text-sm text-gray-400 mt-2">Connecté en tant que : {profil?.prenom} {profil?.nom}</p>
    </div>
  );
};

export default DocumentsPage;
