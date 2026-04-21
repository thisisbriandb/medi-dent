// @ts-nocheck
// TODO: Migrer ce service pour utiliser Supabase directement
import { format } from 'date-fns'
import { api } from './api'
import type { Creneau, CreateCreneauDTO, CreneauxResponse } from '@/types/creneaux.types'

export class CreneauxService {
  static async getAllCreneaux(medecinId: string): Promise<Creneau[]> {
    const response = await api.get(`/medecins/${medecinId}/creneaux`)
    return response.data.creneaux
  }

  static async getCreneauxDisponibles(medecinId: string): Promise<Creneau[]> {
    const response = await api.get(`/medecins/${medecinId}/creneaux/disponibles`)
    // La réponse de l'API est { success: boolean, data: Creneau[] }
    // On retourne directement le tableau de créneaux pour simplifier l'utilisation
    return response.data.data || []
  }

  static async createCreneau(
    medecinId: string,
    data: CreateCreneauDTO
  ): Promise<Creneau> {
    const response = await api.post(`/medecins/${medecinId}/creneaux`, data)
    return response.data.creneau
  }

  static async createCreneauxJournee(
    medecinId: string,
    date: Date,
    heureDebut: string = "08:00",
    heureFin: string = "20:00",
    dureeCreneau: number = 30
  ): Promise<Creneau[]> {
    const creneaux: Creneau[] = []
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
        const creneau = await this.createCreneau(medecinId, {
          date_creneau: formattedDate,
          heure_debut,
          heure_fin,
        })
        creneaux.push(creneau)
      } catch (error) {
        console.error(`Erreur lors de la création du créneau ${heure_debut}-${heure_fin}:`, error)
      }
    }

    return creneaux
  }
} 