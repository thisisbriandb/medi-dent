export type RecurrenceType = "daily" | "weekly" | "monthly"

export interface Recurrence {
  type: RecurrenceType
  interval: number
  until: Date
}

export interface Appointment {
  id: string
  title: string
  description?: string
  date: Date
  time: string
  duration: number
  patientId: string
  doctorId: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  recurrence?: Recurrence
  createdAt: Date
  updatedAt: Date
  heure_debut: string
  heure_fin: string
  
  
}

export interface TimeSlot {
  date: Date
  startTime: string
  endTime: string
  isAvailable: boolean
  appointmentId?: string
}

export interface DayAvailability {
  date: Date
  timeSlots: TimeSlot[]
}

export interface WeekAvailability {
  startDate: Date
  endDate: Date
  days: DayAvailability[]
}

export interface CreateAppointmentDTO {
  title: string
  description?: string
  date: Date
  time: string
  duration: number
  patientId: string
  doctorId: string
  id_creneau: string
  motif: string
  recurrence?: Omit<Recurrence, "id">
}

export interface UpdateAppointmentDTO extends Partial<CreateAppointmentDTO> {
  status?: Appointment["status"]
}

export interface AppointmentResponse {
  appointment: Appointment
  nextOccurrence?: Date
  recurrenceInfo?: {
    totalOccurrences: number
    remainingOccurrences: number
  }
}

export interface CreneauResponse {
  success: boolean;
  data: Creneau[];
}

export interface Creneau {
  id_creneau: number;
  date_creneau: string;
  heure_debut: string;
  heure_fin: string;
  id_medecin: number;
} 