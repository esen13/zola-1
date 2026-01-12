"use client"

import type { Appointment } from "@/app/types/schedule.types"
import { addDays, addHours, format, startOfDay, startOfWeek } from "date-fns"
import { ru } from "date-fns/locale"
import { useMemo } from "react"
import { CalendarEvent } from "./calendar-event"

interface CalendarWeekViewProps {
  startDate: Date
  appointments: Appointment[]
  onTimeSlotClick: (date: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
}

export const CalendarWeekView = ({
  startDate,
  appointments,
  onTimeSlotClick,
  onAppointmentClick,
}: CalendarWeekViewProps) => {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(startDate, { locale: ru })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [startDate])

  const hours = useMemo(() => {
    const hoursArray = []
    const start = startOfDay(weekDays[0])
    for (let i = 0; i < 24; i++) {
      hoursArray.push(addHours(start, i))
    }
    return hoursArray
  }, [weekDays])

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.starts_at)
      // Проверяем, что запись попадает в диапазон недели
      const weekStart = startOfWeek(startDate, { locale: ru })
      const weekEnd = addDays(weekStart, 6)
      if (appointmentDate >= weekStart && appointmentDate <= weekEnd) {
        const dayKey = format(appointmentDate, "yyyy-MM-dd")
        if (!grouped[dayKey]) {
          grouped[dayKey] = []
        }
        grouped[dayKey].push(appointment)
      }
    })
    return grouped
  }, [appointments, startDate])

  const getTimeSlotPosition = (appointment: Appointment, dayIndex: number) => {
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
      <div className="flex">
        <div className="w-20 flex-shrink-0 border-r border-b"></div>
        <div className="grid h-12 flex-1 flex-shrink-0 grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="border-r px-2 py-1 text-center text-sm font-medium last:border-r-0"
            >
              <div>{format(day, "EEE", { locale: ru })}</div>
              <div className="text-muted-foreground text-xs">
                {format(day, "d", { locale: ru })}
              </div>
            </div>
          ))}
        </div>
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

          <div className="grid flex-1 grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, "yyyy-MM-dd")
              const dayAppointments = appointmentsByDay[dayKey] || []

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-r last:border-r-0"
                >
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
                    {dayAppointments.map((appointment) => {
                      const { top, height } = getTimeSlotPosition(
                        appointment,
                        dayIndex
                      )
                      return (
                        <div
                          key={appointment.id}
                          className="absolute right-0 left-0 z-20 px-1"
                          style={{ top, height }}
                        >
                          <CalendarEvent
                            appointment={appointment}
                            onClick={() => onAppointmentClick(appointment)}
                            className="text-[10px]"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
