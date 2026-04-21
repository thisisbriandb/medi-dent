'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, ChevronRight, MessageSquare, FolderKanban, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { patientService, type RendezVous } from '@/app/services/PatientService';
import { Button } from '@/components/ui/button';

export default function PatientDashboard() {
  const { profil, isLoading: isAuthLoading } = useAuth();
  const [upcomingAppointment, setUpcomingAppointment] = useState<RendezVous | null>(null);
  const [history, setHistory] = useState<RendezVous[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    // Ne rien faire tant que le processus d'authentification n'est pas terminé.
    if (isAuthLoading) {
      return;
    }

    // Si l'authentification est terminée et que nous avons un utilisateur, charger les données.
    if (profil?.id) {
      const fetchAppointments = async () => {
        setIsDataLoading(true);
        try {
          const response = await patientService.getRendezVous();
          const allAppointments = response.success ? response.data : [];
          
          const now = new Date();
          const futureAppointments = allAppointments
            .filter(rdv => {
              // Construire la date complète à partir de date_creneau et heure_debut
              const rdvDate = new Date(`${rdv.creneau.date_creneau}T${rdv.creneau.heure_debut}`);
              return rdvDate > now && rdv.statut !== 'annule';
            })
            .map(rdv => ({
              id: rdv.id_rdv,
              date_heure: `${rdv.creneau.date_creneau}T${rdv.creneau.heure_debut}`,
              status: rdv.statut as 'confirme' | 'en_attente' | 'annule',
              type: 'presentiel' as const,
              medecin: {
                id: rdv.creneau.medecin.id_medecin,
                nom: rdv.creneau.medecin.nom,
                prenom: rdv.creneau.medecin.prenom,
                specialite: rdv.creneau.medecin.specialite
              }
            }))
            .sort((a, b) => new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime());
          
          const pastAppointments = allAppointments
            .filter(rdv => {
              const rdvDate = new Date(`${rdv.creneau.date_creneau}T${rdv.creneau.heure_debut}`);
              return rdvDate <= now;
            })
            .map(rdv => ({
              id: rdv.id_rdv,
              date_heure: `${rdv.creneau.date_creneau}T${rdv.creneau.heure_debut}`,
              status: rdv.statut as 'confirme' | 'en_attente' | 'annule',
              type: 'presentiel' as const,
              medecin: {
                id: rdv.creneau.medecin.id_medecin,
                nom: rdv.creneau.medecin.nom,
                prenom: rdv.creneau.medecin.prenom,
                specialite: rdv.creneau.medecin.specialite
              }
            }))
            .sort((a, b) => new Date(b.date_heure).getTime() - new Date(a.date_heure).getTime());

          setUpcomingAppointment(futureAppointments[0] || null);
          setHistory(pastAppointments.slice(0, 3));
        } catch (error) {
          console.error('Erreur lors de la récupération des rendez-vous:', error);
        } finally {
          setIsDataLoading(false);
        }
      };

      fetchAppointments();
    } else {
      // Si l'auth est terminée mais qu'il n'y a pas d'utilisateur, arrêter le chargement.
      setIsDataLoading(false);
    }
  }, [profil, isAuthLoading]);

  const handleCancelAppointment = async (rdvId: number) => {
    try {
      setUpcomingAppointment(null); 
      await patientService.updateRendezVousStatus(rdvId, 'annule');
    } catch (error) {
      console.error("Erreur lors de l'annulation du rendez-vous", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(dateString));
  };

  // Afficher un spinner global pendant que l'authentification se résout.
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si l'authentification est terminée mais qu'il n'y a pas d'utilisateur.
  if (!profil) {
    return (
      <div className="p-6 bg-gray-50 min-h-[calc(100vh-6rem)] text-center">
        <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder à votre espace.</p>
        <Link href="/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Mon tableau de bord</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Bloc: Prochaine consultation */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ma prochaine consultation</h2>
            {isDataLoading ? (
                <div className="text-center py-8"><p className="text-gray-500">Chargement...</p></div>
            ) : upcomingAppointment ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-xl text-blue-800">{`Dr. ${upcomingAppointment.medecin.prenom} ${upcomingAppointment.medecin.nom}`}</p>
                    <p className="text-blue-600">{upcomingAppointment.medecin.specialite}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(upcomingAppointment.date_heure).split('à')[0]}</span>
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDate(upcomingAppointment.date_heure).split('à')[1]}</span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex flex-col sm:items-end gap-2">
                     <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        {upcomingAppointment.type === 'visio' ? <Video className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        {upcomingAppointment.type === 'visio' ? 'Démarrer la visio' : 'Itinéraire'}
                    </button>
                    <button onClick={() => handleCancelAppointment(upcomingAppointment.id)} className="w-full sm:w-auto text-sm text-center text-red-500 hover:text-red-700">Annuler</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Vous n'avez aucune consultation à venir.</p>
                <Link href="/consultation" passHref>
                  <Button className="flex items-center gap-2 mx-auto">
                    <Calendar className="w-5 h-5" /> Prendre un rendez-vous
                  </Button>
                </Link>
              </div>
            )}
          </div>
          

          {/* Bloc: Historique des consultations */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Historique récent</h2>
              <Link href="/patient/appointments" passHref>
                <Button variant="link" className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center p-0 h-auto">
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {isDataLoading ? (
                  <p className="text-gray-500 text-center py-4">Chargement...</p>
              ) : history.length > 0 ? history.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.type === 'visio' ? 'bg-green-100' : 'bg-purple-100'}`}>
                       {item.type === 'visio' ? <Video className="w-5 h-5 text-green-600" /> : <User className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{`Dr. ${item.medecin.prenom} ${item.medecin.nom}`}</p>
                      <p className="text-sm text-gray-500">{new Date(item.date_heure).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                  </div>
                  <Link href={`/patient/documents/${item.id}`} passHref>
                     <Button variant="link" className="text-sm text-blue-600 hover:underline p-0 h-auto">Voir le compte-rendu</Button>
                  </Link>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">Aucune consultation passée.</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne de droite */}
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ressources rapides</h2>
            <div className="space-y-4">
              <Link href="/patient/messages" passHref>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-6 h-6 text-gray-600"/>
                    <span className="font-medium text-gray-800">Messagerie</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400"/>
                </div>
              </Link>
              <Link href="/patient/documents" passHref>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <FolderKanban className="w-6 h-6 text-gray-600"/>
                    <span className="font-medium text-gray-800">Mon dossier médical</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400"/>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 