'use client';

import { useAuth } from '@/contexts/AuthContext';
import MedecinDashboard from '@/app/components/dashboard/MedecinDashboard';
import PatientDashboard from '@/app/components/dashboard/PatientDashboard'; // Import du nouveau composant

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // On affiche un spinner tant que l'authentification n'est pas terminée
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Aiguillage basé sur le rôle pour afficher le bon composant
  if (user?.role === 'medecin') {
    return <MedecinDashboard />;
  }
  
  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  // Fallback au cas où le rôle n'est pas défini (sécurité)
  return (
    <div className="flex items-center justify-center min-h-screen">
       <p>Rôle utilisateur non reconnu.</p>
    </div>
  );
} 