"use client"

import type { Appointment } from "@/app/types/schedule.types"
import { cn } from "@/lib/utils"
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ru } from "date-fns/locale"
import { useMemo } from "react"
import { CalendarEvent } from "./calendar-event"

interface CalendarMonthViewProps {
  date: Date
  appointments: Appointment[]
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}

export const CalendarMonthView = ({
  date,
  appointments,
  onDateClick,
  onAppointmentClick,
}: CalendarMonthViewProps) => {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { locale: ru })
  const calendarEnd = endOfWeek(monthEnd, { locale: ru })

  const calendarDays = useMemo(() => {
    const days = []
    let current = calendarStart
    while (current <= calendarEnd) {
      days.push(current)
      current = addDays(current, 1)
    }
    return days
  }, [calendarStart, calendarEnd])

  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.starts_at)
      const dateKey = format(appointmentDate, "yyyy-MM-dd")
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(appointment)
    })
    return grouped
  }, [appointments])

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="border-r px-2 py-2 text-center text-sm font-medium last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayAppointments = appointmentsByDate[dateKey] || []
          const isCurrentMonth = isSameMonth(day, date)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "hover:bg-accent/50 cursor-pointer border-r border-b p-1 transition-colors last:border-r-0 min-h-[82px]",
                !isCurrentMonth && "bg-muted/50"
              )}
              onClick={() => onDateClick(day)}
            >
              <div
                className={cn(
                  "mb-1 text-sm font-medium",
                  isToday &&
                    "bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full"
                )}
              >
                {format(day, "d", { locale: ru })}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <CalendarEvent
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => onAppointmentClick(appointment)}
                    className="py-0.5 text-[10px]"
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-muted-foreground text-xs">
                    +{dayAppointments.length - 3} еще
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
