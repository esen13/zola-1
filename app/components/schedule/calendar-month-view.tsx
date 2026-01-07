"use client"

import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarEvent } from "./calendar-event"
import type { Appointment } from "@/app/types/schedule.types"
import { cn } from "@/lib/utils"

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
            className="border-r last:border-r-0 px-2 py-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayAppointments = appointmentsByDate[dateKey] || []
          const isCurrentMonth = isSameMonth(day, date)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b last:border-r-0 p-1 cursor-pointer hover:bg-accent/50 transition-colors",
                !isCurrentMonth && "bg-muted/50"
              )}
              onClick={() => onDateClick(day)}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                )}
              >
                {format(day, "d", { locale: ru })}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <CalendarEvent
                    key={appointment.id}
                    appointment={appointment}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(appointment)
                    }}
                    className="text-[10px] py-0.5"
                  />
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground">
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

