'use client';

import { useAuth } from '@/contexts/AuthContext';
import MedecinConsultation from '@/app/components/consultation/MedecinConsultation';
import BookingPage from '@/app/components/consultation/PatientConsultation';

export default function ConsultationPage() {
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
    return < MedecinConsultation/>;
  }
  
  if (user?.role === 'patient') {
    return <BookingPage />;
  }

  // Fallback au cas où le rôle n'est pas défini (sécurité)
  return (
    <div className="flex items-center justify-center min-h-screen">
       <p>Rôle utilisateur non reconnu.</p>
    </div>
  );
} 