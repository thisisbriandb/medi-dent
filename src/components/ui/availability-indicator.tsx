"use client"

import { memo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Calendar, Clock } from "lucide-react"
import { format, isBefore, startOfDay, isSameDay } from "date-fns"
import type { TimeSlot } from "@/types/appointment.types"

interface TimeSlotProps {
  timeSlot: TimeSlot
  onClick?: () => void
  className?: string
  isPast: boolean
}

const TimeSlotComponent = memo(function TimeSlotComponent({
  timeSlot,
  onClick,
  className,
  isPast,
}: TimeSlotProps) {

  const isBooked = !!timeSlot.appointmentId;

  const baseClasses = "flex items-center justify-between p-2 rounded-lg transition-all w-full text-left";
  const colorClasses = isPast
    ? "bg-gray-100 text-gray-400"
    : isBooked
    ? "bg-indigo-100 text-indigo-700"
    : "bg-green-100 text-green-800 hover:bg-green-200 hover:scale-105";
  
  const disabledClasses = (!timeSlot.isAvailable || isPast) && "cursor-not-allowed";

  return (
    <button
      className={cn(baseClasses, colorClasses, disabledClasses, className)}
      onClick={onClick}
      disabled={!timeSlot.isAvailable || isPast}
    >
      <span className="text-sm font-medium">
        {timeSlot.startTime.substring(0, 5)} - {timeSlot.endTime.substring(0, 5)}
      </span>
      {isBooked && !isPast && <span className="text-xs font-semibold">Réservé</span>}
    </button>
  )
})

interface DayGridProps {
  day: Date
  timeSlots: TimeSlot[]
  onTimeSlotClick?: (timeSlot: TimeSlot) => void
  className?: string
  isToday: boolean
}

const DayGrid = memo(function DayGrid({
  day,
  timeSlots = [],
  onTimeSlotClick,
  className,
  isToday
}: DayGridProps) {

  if (!Array.isArray(timeSlots)) {
    console.warn('DayGrid: timeSlots is not an array')
    return null
  }
  
  const dayStart = startOfDay(new Date());
  const isPastDay = isBefore(day, dayStart);

  return (
    <div className={cn("bg-white rounded-lg p-3 space-y-2", className)}>
       <div className="flex items-baseline gap-2">
         <h3 className={cn("text-sm font-semibold text-center capitalize text-gray-500", isToday && "text-indigo-600")}>
           {format(day, "eee")}
         </h3>
         <p className={cn("text-xl font-bold", isToday && "text-indigo-600")}>
           {format(day, "d")}
         </p>
       </div>
      <div className="min-h-[200px] border-t pt-2">
        {timeSlots.length > 0 ? (
          <div className="grid gap-2">
            {timeSlots.map((slot, index) => (
              <TimeSlotComponent
                key={`${format(day, 't')}-${slot.startTime}-${index}`}
                timeSlot={slot}
                onClick={() => onTimeSlotClick?.(slot)}
                isPast={isPastDay || isBefore(new Date(slot.date), dayStart)}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 pt-10">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm text-center">
              {isPastDay ? "Jour passé" : "Aucun créneau"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

interface WeekGridProps {
  availability: {
    startDate: Date,
    endDate: Date,
    days: {
      date: Date;
      timeSlots: TimeSlot[];
    }[];
  } | null
  onTimeSlotClick?: (timeSlot: TimeSlot) => void
  className?: string
  today?: Date
}

export const WeekAvailabilityGrid = memo(function WeekAvailabilityGrid({
  availability,
  onTimeSlotClick,
  className,
  today = new Date()
}: WeekGridProps) {

  if (!availability) return null;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-7 gap-4 bg-gray-50 p-4 rounded-xl", className)}>
      {availability.days.map((dayData, dayIndex) => (
        <DayGrid
          key={dayIndex}
          day={dayData.date}
          timeSlots={dayData.timeSlots || []}
          onTimeSlotClick={onTimeSlotClick}
          isToday={isSameDay(dayData.date, today)}
        />
      ))}
    </div>
  )
}) 