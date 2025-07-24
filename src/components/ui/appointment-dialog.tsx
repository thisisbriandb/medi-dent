"use client"

import * as React from "react"
import { format } from "date-fns"
import Flatpickr from "react-flatpickr"
import "flatpickr/dist/themes/light.css"
import { French } from "flatpickr/dist/l10n/fr"
import { AppointmentService } from "@/app/services/AppointmentService"
import { Button } from "./button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Label } from "./label"
import { Input } from "./input"

interface AppointmentDialogProps {
  isOpen: boolean
  onClose: () => void
  medecinId: string
  onCreneauxCreated: () => void
}

export function AppointmentDialog({ isOpen, onClose, medecinId, onCreneauxCreated }: AppointmentDialogProps) {
  const [dates, setDates] = React.useState<Date[]>([])
  const [startTime, setStartTime] = React.useState("09:00")
  const [endTime, setEndTime] = React.useState("18:00")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setDates([])
      setStartTime("09:00")
      setEndTime("18:00")
      setIsLoading(false)
      setError(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dates.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const creationPromises = dates.map(date => 
        AppointmentService.createCreneau(medecinId, date, startTime, endTime)
      )
      
      await Promise.all(creationPromises)
      
      onCreneauxCreated()
      onClose()
    } catch (err: any) {
      console.error("Erreur lors de la création des créneaux:", err)
      setError(err.response?.data?.message || "Une erreur est survenue.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[90%] rounded-lg">
        <DialogHeader>
          <DialogTitle>Créer de nouveaux créneaux</DialogTitle>
          <DialogDescription>
            Sélectionnez un ou plusieurs jours et définissez les détails des créneaux.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="grid gap-2">
              <Label>Date(s)</Label>
              <Flatpickr
                options={{
                  mode: "multiple",
                  dateFormat: "d/m/Y",
                  locale: French,
                  minDate: "today",
                  allowInput: true,
                  static: true,
                }}
                value={dates}
                onChange={(selectedDates) => setDates(selectedDates)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Annuler</Button>
            <Button type="submit" disabled={dates.length === 0 || isLoading}>
              {isLoading ? "Création en cours..." : "Créer les créneaux"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
 