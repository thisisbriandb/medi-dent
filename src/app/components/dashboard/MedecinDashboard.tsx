'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, VideoIcon, Activity, Search, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { dashboardService, type Appointment, type Patient, type DashboardStats } from '@/app/services/DashboardService';

const DEFAULT_STATS: DashboardStats = {
  todayAppointments: 0,
  weeklyTeleconsultations: 0,
  totalPatients: 0,
  pendingRequests: 0
};

const DEFAULT_AVATAR = '/default-avatar.png';

export default function MedecinDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [statsData, appointmentsResponse, patientsData] = await Promise.all([
          dashboardService.getDoctorStats(),
          dashboardService.getDoctorAppointments(),
          dashboardService.getDoctorRecentPatients()
        ]);

        setStats(statsData || DEFAULT_STATS);

        if (appointmentsResponse.success && Array.isArray(appointmentsResponse.data)) {
          const formattedAppointments = appointmentsResponse.data.map(apiApp => ({
            id: apiApp.id_rdv,
            patientName: `${apiApp.patient.prenom} ${apiApp.patient.nom}`,
            time: format(new Date(apiApp.date_rdv), 'HH:mm'),
            type: 'presentiel' as const,
            status: apiApp.statut === 'en_attente' ? 'pending' as const : 'confirmed' as const
          }));
          setAppointments(formattedAppointments);
        } else {
          setAppointments([]);
        }

        if (Array.isArray(patientsData)) {
          setRecentPatients(patientsData);
        } else {
          setRecentPatients([]);
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);




  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const results = await dashboardService.searchPatients(query);
        // Gérer les résultats de recherche ici
      } catch (err) {
        console.error('Erreur recherche:', err);
      }
    }
  };

  const getAvatarUrl = (url: string | undefined) => {
    if (!url || url === '') return DEFAULT_AVATAR;
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-6rem)]">
      {/* En-tête du dashboard */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord Médecin</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
            <span className="text-sm font-medium text-gray-400">Aujourd'hui</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.todayAppointments}</h3>
          <p className="text-gray-600">Rendez-vous</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <VideoIcon className="w-8 h-8 text-green-500" />
            <span className="text-sm font-medium text-gray-400">Cette semaine</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.weeklyTeleconsultations}</h3>
          <p className="text-gray-600">Téléconsultations</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <span className="text-sm font-medium text-gray-400">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.totalPatients}</h3>
          <p className="text-gray-600">Patients</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-red-500" />
            <span className="text-sm font-medium text-gray-400">En attente</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats.pendingRequests}</h3>
          <p className="text-gray-600">Demandes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendez-vous du jour */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Rendez-vous du jour</h2>
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center">
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    {appointment.type === 'visio' ? (
                      <VideoIcon className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Users className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{appointment.patientName}</h3>
                    <p className="text-sm text-gray-500">{appointment.time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {appointment.status === 'confirmed' ? 'Confirmé' :
                   appointment.status === 'pending' ? 'En attente' : 'Annulé'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Patients récents */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Patients récents</h2>
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center">
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="flex items-center space-x-4">
                <div className="relative w-10 h-10">
                  <Image
                    src={getAvatarUrl(patient.avatar)}
                    alt={patient.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{patient.name}</h3>
                  <p className="text-sm text-gray-500">{patient.lastVisit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}