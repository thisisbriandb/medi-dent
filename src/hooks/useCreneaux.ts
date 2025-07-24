import { useState, useEffect } from "react"
import { isBefore, eachDayOfInterval, startOfToday } from "date-fns"
import { CreneauxService } from "@/app/services/CreneauxService"
import type { TimeSlot, WeekAvailability } from "@/types/appointment.types"
import type { Creneau } from "@/types/creneaux.types"

const mapCreneauToTimeSlot = (creneau: Creneau): TimeSlot => ({
  date: new Date(creneau.date_creneau),
  startTime: creneau.heure_debut,
  endTime: creneau.heure_fin,
  isAvailable: creneau.disponible,
  appointmentId: creneau.patient_id
})

export function useCreneaux(startDate: Date, endDate: Date) {
  const [availability, setAvailability] = useState<WeekAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCreneaux = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const today = startOfToday()

        if (isBefore(endDate, today)) {
          setError("Impossible de consulter les créneaux passés")
          return
        }

        const medecinId = "current-doctor-id"
        
        const days = await Promise.all(
          eachDayOfInterval({ start: startDate, end: endDate })
            .map(async (date) => {
              if (isBefore(date, today)) {
                return { date, timeSlots: [] }
              }

              try {
                const creneaux = await CreneauxService.getCreneauxDisponibles(medecinId, date)
                return {
                  date,
                  timeSlots: Array.isArray(creneaux) ? creneaux.map(mapCreneauToTimeSlot) : []
                }
              } catch (error: any) {
                if (error.response?.status === 422) {
                  return { date, timeSlots: [] }
                }
                throw error
              }
            })
        )

        setAvailability({
          startDate,
          endDate,
          days
        })
      } catch (error: any) {
        console.error("Erreur lors du chargement des créneaux:", error)
        setError(error.response?.data?.message || "Erreur lors du chargement des créneaux")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreneaux()
  }, [startDate, endDate])

  return { availability, isLoading, error }
} 