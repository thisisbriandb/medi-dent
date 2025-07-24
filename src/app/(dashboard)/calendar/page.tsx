"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, isBefore, startOfToday, parseISO, isSameDay, isSameWeek } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AppointmentDialog } from "@/components/ui/appointment-dialog"
import { WeekAvailabilityGrid } from "@/components/ui/availability-indicator"
import { CreneauxService } from "@/app/services/CreneauxService"
import AuthService, { User } from "@/app/services/AuthService"
import type { TimeSlot, WeekAvailability } from "@/types/appointment.types"
import type { Creneau } from "@/types/creneaux.types"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const mapCreneauToTimeSlot = (creneau: Creneau): TimeSlot => ({
  date: parseISO(creneau.date_creneau),
  startTime: creneau.heure_debut,
  endTime: creneau.heure_fin,
  // Si disponible n'est pas fourni, on suppose que le créneau est libre
  // Si patient_id existe, le créneau n'est pas disponible
  isAvailable: creneau.disponible !== false && !creneau.patient_id,
  appointmentId: creneau.patient_id,
});

const MAX_WEEKS_IN_FUTURE = 12
const today = startOfToday()
const maxDate = addDays(today, MAX_WEEKS_IN_FUTURE * 7)

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(today)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [availability, setAvailability] = React.useState<WeekAvailability | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [allCreneaux, setAllCreneaux] = React.useState<Creneau[]>([])

  const startDate = useMemo(() => startOfWeek(currentDate, { locale: fr }), [currentDate])
  const endDate = useMemo(() => endOfWeek(currentDate, { locale: fr }), [currentDate])

  const daysOfWeek = useMemo(() => 
    eachDayOfInterval({ start: startDate, end: endDate })
      .map(date => format(date, "EEEE", { locale: fr })),
    [startDate, endDate]
  )

  const fetchCreneaux = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true)
    setError(null)
    try {
      const creneaux = await CreneauxService.getCreneauxDisponibles(currentUser.id.toString());
      setAllCreneaux(creneaux || [])
    } catch (error: any) {
      console.error("Erreur lors du chargement des créneaux:", error)
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors du chargement des créneaux"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true)
      try {
        const user = await AuthService.getCurrentUser();
        if (user && user.role === 'medecin') {
          setCurrentUser(user);
        } else {
          setError("Accès non autorisé. Cette page est réservée aux médecins.");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Impossible de récupérer les informations de l'utilisateur.");
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    if (currentUser) {
      fetchCreneaux()
    }
  }, [currentUser, fetchCreneaux])
  
  React.useEffect(() => {
    // Ce bloc s'exécute quand les créneaux sont chargés ou quand la semaine change.
    if (allCreneaux.length > 0) {
      const weekCreneaux = allCreneaux.map(creneau => ({
        ...creneau,
        date_creneau_date: parseISO(creneau.date_creneau)
      }));

      const days = eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
        const timeSlots = weekCreneaux
          .filter(creneau => isSameDay(creneau.date_creneau_date, date))
          .map(mapCreneauToTimeSlot);
        return { date, timeSlots };
      });
      
      setAvailability({ startDate, endDate, days });
    }
  }, [allCreneaux, startDate, endDate]);

  React.useEffect(() => {
    // Ce bloc fait sauter le calendrier à la date du premier créneau
    // s'il n'y a aucun créneau dans la vue actuelle.
    if (allCreneaux.length > 0 && !isLoading) {
      const creneauxInView = allCreneaux.some(c => 
        isSameDay(parseISO(c.date_creneau), currentDate) || 
        (isAfter(parseISO(c.date_creneau), startDate) && isBefore(parseISO(c.date_creneau), endDate))
      );

      if (!creneauxInView) {
        const firstCreneauDate = allCreneaux.map(c => parseISO(c.date_creneau)).sort((a, b) => a.getTime() - b.getTime())[0];
        if (firstCreneauDate) {
          setCurrentDate(firstCreneauDate);
        }
      }
    }
  }, [allCreneaux, isLoading, startDate, endDate, currentDate]);


  const handlePreviousWeek = useCallback(() => {
    setCurrentDate(prevDate => addDays(prevDate, -7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setCurrentDate(prevDate => addDays(prevDate, 7))
  }, [])

  const handleTimeSlotClick = useCallback((timeSlot: TimeSlot) => {
    const slotDateTime = new Date(timeSlot.date)
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number)
    slotDateTime.setHours(hours, minutes)
    
    // N'autorise l'ouverture que si le créneau est disponible et n'est pas dans le passé
    if (!timeSlot.isAvailable || isBefore(slotDateTime, new Date())) return
    
    //setSelectedTimeSlot(timeSlot)
    //setIsDialogOpen(true)
    // La logique de réservation patient sera différente, mais pour le médecin, on peut vouloir éditer.
    console.log("Créneau sélectionné:", timeSlot)
  }, [])

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  const isPrevWeekDisabled = isBefore(startDate, startOfWeek(today, { locale: fr }))
  const isNextWeekDisabled = isAfter(addDays(currentDate, 7), maxDate)
  
  if (isLoading && !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <div className="flex items-center rounded-md border">
            <Button onClick={handlePreviousWeek} variant="ghost" size="icon" className="rounded-r-none border-r" disabled={isLoading || isPrevWeekDisabled}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button onClick={() => setCurrentDate(today)} variant="ghost" className="rounded-none px-4 text-sm" disabled={isLoading || isSameWeek(currentDate, today, { locale: fr })}>
              Aujourd'hui
            </Button>
            <Button onClick={handleNextWeek} variant="ghost" size="icon" className="rounded-l-none border-l" disabled={isLoading || isNextWeekDisabled}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {currentUser && currentUser.role === 'medecin' && (
            <Button onClick={() => setIsDialogOpen(true)} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau créneau
            </Button>
        )}
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {isLoading && !availability && !error && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
      )}

      {availability && (
        <WeekAvailabilityGrid
          availability={availability}
          onTimeSlotClick={handleTimeSlotClick}
          className="mb-8"
          today={today}
        />
      )}

      {currentUser && (
        <AppointmentDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          medecinId={currentUser.id.toString()}
          onCreneauxCreated={fetchCreneaux}
        />
      )}
    </div>
  )
}
