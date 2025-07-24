import { format } from 'date-fns'
import { api } from './api'
import type {
  Appointment,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
  WeekAvailability,
  AppointmentResponse,
  CreneauResponse
} from '@/types/appointment.types'

export class AppointmentService {
  static async createAppointment(data: CreateAppointmentDTO): Promise<AppointmentResponse> {
    const response = await api.post('/rendezvous', data)
    return response.data
  }

  static async updateAppointment(id: string, data: UpdateAppointmentDTO): Promise<AppointmentResponse> {
    const response = await api.patch(`/rendezvous/`, data)
    return response.data
  }

  static async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/rendezvous/${id}`)
  }

  static async getAppointment(id: string): Promise<AppointmentResponse> {
    const response = await api.get(`/rendezvous/`)
    return response.data
  }

  static async getAppointmentsByDoctor(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CreneauResponse> {
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }

    const response = await api.get(`/medecins/${doctorId}/creneaux`, { params })
    return response.data
  }

  static async getAppointmentsByPatient(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ success: boolean; data: Appointment[] }> {
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }

    const response = await api.get(`/patients/${patientId}/rendezvous`, { params })
    return response.data
  }

  static async getDoctorAvailability(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WeekAvailability> {
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }

    const response = await api.get(`/medecins/${doctorId}/creneaux/disponibles`, { params })
    return response.data
  }

  static async confirmAppointment(id: string): Promise<AppointmentResponse> {
    const response = await api.post(`/rendezvous/${id}/confirm`)
    return response.data
  }

  static async cancelAppointment(id: string): Promise<AppointmentResponse> {
    const response = await api.post(`/rendezvous/${id}/cancel`)
    return response.data
  }

  static async getRecurringAppointments(
    appointmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    const params = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }

    const response = await api.get(`/rendezvous/${appointmentId}/recurring`, { params })
    return response.data
  }

  static async updateRecurringAppointment(
    appointmentId: string,
    data: UpdateAppointmentDTO,
    updateAll: boolean
  ): Promise<AppointmentResponse[]> {
    const response = await api.patch(`/rendezvous/${appointmentId}/recurring`, {
      ...data,
      updateAll,
    })
    return response.data
  }

  static async createCreneau(
    medecinId: string,
    date: Date,
    heureDebut: string,
    heureFin: string
  ): Promise<AppointmentResponse> {
    const data = {
      date_creneau: format(date, 'yyyy-MM-dd'),
      heure_debut: heureDebut,
      heure_fin: heureFin
    }

    const response = await api.post(`/medecins/${medecinId}/creneaux`, data)
    return response.data
  }

  static async createCreneauxJournee(
    medecinId: string,
    date: Date,
    heureDebut: string = "08:00",
    heureFin: string = "20:00",
    dureeCreneau: number = 30
  ): Promise<AppointmentResponse[]> {
    const creneaux = []
    const formattedDate = format(date, 'yyyy-MM-dd')
    
    // Convertir les heures en minutes pour faciliter le calcul
    const [debutHeure, debutMinute] = heureDebut.split(':').map(Number)
    const [finHeure, finMinute] = heureFin.split(':').map(Number)
    const debutMinutes = debutHeure * 60 + debutMinute
    const finMinutes = finHeure * 60 + finMinute

    for (let minutes = debutMinutes; minutes < finMinutes; minutes += dureeCreneau) {
      const heureActuelle = Math.floor(minutes / 60)
      const minuteActuelle = minutes % 60
      const heureFinCreneau = Math.floor((minutes + dureeCreneau) / 60)
      const minuteFinCreneau = (minutes + dureeCreneau) % 60

      const heure_debut = `${String(heureActuelle).padStart(2, '0')}:${String(minuteActuelle).padStart(2, '0')}`
      const heure_fin = `${String(heureFinCreneau).padStart(2, '0')}:${String(minuteFinCreneau).padStart(2, '0')}`

      try {
        const response = await this.createCreneau(
          medecinId,
          new Date(formattedDate),
          heure_debut,
          heure_fin
        )
        creneaux.push(response)
      } catch (error) {
        console.error(`Erreur lors de la création du créneau ${heure_debut}-${heure_fin}:`, error)
      }
    }

    return creneaux
  }
} 