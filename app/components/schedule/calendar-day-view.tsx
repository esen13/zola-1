"use client"

import { useMemo } from "react"
import { format, startOfDay, addHours } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarEvent } from "./calendar-event"
import type { Appointment } from "@/app/types/schedule.types"
import { cn } from "@/lib/utils"

interface CalendarDayViewProps {
  date: Date
  appointments: Appointment[]
  onTimeSlotClick: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}

export const CalendarDayView = ({
  date,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
}: CalendarDayViewProps) => {
  const hours = useMemo(() => {
    const hoursArray = []
    const start = startOfDay(date)
    for (let i = 0; i < 24; i++) {
      hoursArray.push(addHours(start, i))
    }
    return hoursArray
  }, [date])

  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, Appointment[]> = {}
    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.starts_at)
      const hour = appointmentDate.getHours()
      if (!grouped[hour]) {
        grouped[hour] = []
      }
      grouped[hour].push(appointment)
    })
    return grouped
  }, [appointments])

  const getTimeSlotPosition = (appointment: Appointment) => {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const duration = endMinutes - startMinutes
    const topPercent = (startMinutes / (24 * 60)) * 100
    const heightPercent = (duration / (24 * 60)) * 100
    return { top: `${topPercent}%`, height: `${heightPercent}%` }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="h-12 border-b font-medium px-4 flex items-center flex-shrink-0">
        {format(date, "EEEE, d MMMM yyyy", { locale: ru })}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-20 flex-shrink-0 border-r">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="h-16 border-b px-2 py-1 text-xs text-muted-foreground sticky top-0 bg-background z-10"
              >
                {format(hour, "HH:mm", { locale: ru })}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            <div className="relative">
              {/* Time slots */}
              {hours.map((hour) => (
                <div
                  key={hour.toISOString()}
                  className="h-16 border-b cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onTimeSlotClick(hour)}
                />
              ))}

              {/* Appointments */}
              {appointments.map((appointment) => {
                const { top, height } = getTimeSlotPosition(appointment)
                return (
                  <div
                    key={appointment.id}
                    className="absolute left-0 right-0 px-2"
                    style={{ top, height }}
                  >
                    <CalendarEvent
                      appointment={appointment}
                      onClick={() => onAppointmentClick(appointment)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

