'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, VideoIcon, ChevronRight } from 'lucide-react';
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
      {/* En-tête avec stats inline */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
            <span className="text-lg font-bold text-gray-800">{stats.todayAppointments}</span>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Patients</span>
            <span className="text-lg font-bold text-gray-800">{stats.totalPatients}</span>
          </div>
        </div>
      </div>

      {/* Contenu principal : RDV dominant + patients secondaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rendez-vous du jour — zone principale (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Rendez-vous du jour</h2>
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center">
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">Aucun rendez-vous aujourd&apos;hui</p>
            )}
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    {appointment.type === 'visio' ? (
                      <VideoIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{appointment.patientName}</h3>
                    <p className="text-xs text-gray-400">{appointment.time}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                  appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {appointment.status === 'confirmed' ? 'Confirmé' :
                   appointment.status === 'pending' ? 'En attente' : 'Annulé'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Patients récents — zone secondaire (1/3) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Patients récents</h2>
            <button className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center">
              Voir tout <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentPatients.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">Aucun patient récent</p>
            )}
            {recentPatients.map((patient) => (
              <div key={patient.id} className="flex items-center space-x-3">
                <div className="relative w-9 h-9">
                  <Image
                    src={getAvatarUrl(patient.avatar)}
                    alt={patient.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_AVATAR;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 truncate">{patient.name}</h3>
                  <p className="text-xs text-gray-400">{patient.lastVisit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}