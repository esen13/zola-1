"use client"

import type { Appointment } from "@/app/types/schedule.types"
import { addHours, format, isSameDay, startOfDay } from "date-fns"
import { ru } from "date-fns/locale"
import { useMemo } from "react"
import { CalendarEvent } from "./calendar-event"

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

  // Фильтруем записи только для выбранного дня
  const filteredAppointments = useMemo(() => {
    const result = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.starts_at)
      return isSameDay(appointmentDate, date)
    })

    return result
  }, [appointments, date])

  const getTimeSlotPosition = (appointment: Appointment) => {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()
    const durationMinutes = endMinutes - startMinutes

    // Используем проценты от общей высоты дня (24 часа)
    const totalMinutes = 24 * 60
    const topPercent = (startMinutes / totalMinutes) * 100
    const heightPercent = (durationMinutes / totalMinutes) * 100

    return { top: `${topPercent}%`, height: `${heightPercent}%` }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 flex-shrink-0 items-center border-b px-4 font-medium">
        {format(date, "EEEE, d MMMM yyyy", { locale: ru })}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-20 flex-shrink-0 border-r">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="text-muted-foreground bg-background sticky top-0 z-10 h-16 border-b px-2 py-1 text-xs"
              >
                {format(hour, "HH:mm", { locale: ru })}
              </div>
            ))}
          </div>

          <div className="relative flex-1">
            <div className="relative flex flex-col">
              {/* Time slots */}
              {hours.map((hour) => (
                <div
                  key={hour.toISOString()}
                  className="hover:bg-accent/50 h-16 cursor-pointer border-b transition-colors"
                  onClick={() => onTimeSlotClick(hour)}
                />
              ))}

              {/* Appointments */}
              {filteredAppointments.map((appointment) => {
                const { top, height } = getTimeSlotPosition(appointment)
                return (
                  <div
                    key={appointment.id}
                    className="absolute right-0 left-0 z-20 px-2"
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
