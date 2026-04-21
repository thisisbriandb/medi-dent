// @ts-nocheck
// TODO: Migrer ce service pour utiliser Supabase directement
import { api } from './api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiAppointment {
  id_rdv: number;
  date_rdv: string;
  statut: string;
  id_creneau: number;
  id_patient: number;
  id_compte_rendu: number | null;
  patient: {
    id_patient: number;
    nom: string;
    prenom: string;
    date_naissance: string;
  };
}

export interface Appointment {
  id: number;
  patientName?: string;
  doctorName?: string;
  specialty?: string;
  time: string;
  type: 'presentiel' | 'visio';
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Patient {
  id: number;
  name: string;
  lastVisit: string;
  avatar: string;
  age: number;
}

export interface Document {
  id: number;
  title: string;
  type: string;
  date: string;
  doctorName: string;
}

export interface DashboardStats {
  todayAppointments: number;
  weeklyTeleconsultations: number;
  totalPatients: number;
  pendingRequests: number;
}

class DashboardService {
  // Services pour le dashboard médecin
  async getDoctorStats(): Promise<DashboardStats> {
    try {
      const { data } = await api.get('/doctor/stats');
      console.log('Stats response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        todayAppointments: 0,
        weeklyTeleconsultations: 0,
        totalPatients: 0,
        pendingRequests: 0
      };
    }
  }

  async getDoctorAppointments(): Promise<ApiResponse<ApiAppointment[]>> {
    try {
      const { data } = await api.get('/doctor/appointments/today');
      console.log('Appointments response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  async getDoctorRecentPatients(): Promise<Patient[]> {
    try {
      const { data } = await api.get('/doctor/patients/recent');
      console.log('Recent patients response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  // Services pour le dashboard patient
  async getPatientUpcomingAppointments(): Promise<Appointment[]> {
    const { data } = await api.get('/patient/appointments/upcoming');
    return data;
  }

  async getPatientDocuments(): Promise<Document[]> {
    const { data } = await api.get('/patient/documents');
    return data;
  }

  // Services communs
  async searchPatients(query: string): Promise<Patient[]> {
    const { data } = await api.get(`/search/patients?q=${encodeURIComponent(query)}`);
    return data;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const { data } = await api.get(`/search/documents?q=${encodeURIComponent(query)}`);
    return data;
  }
}

export const dashboardService = new DashboardService(); 