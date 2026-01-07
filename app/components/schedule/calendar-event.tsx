"use client"

import type { Appointment } from "@/app/types/schedule.types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface CalendarEventProps {
  appointment: Appointment
  onClick?: () => void
  className?: string
}

export const CalendarEvent = ({
  appointment,
  onClick,
  className,
}: CalendarEventProps) => {
  const startTime = format(new Date(appointment.starts_at), "HH:mm", {
    locale: ru,
  })
  const endTime = format(new Date(appointment.ends_at), "HH:mm", { locale: ru })
  const title = appointment.title || appointment.patient?.full_name || "Запись"

  const getStatusColor = () => {
    switch (appointment.status) {
      case "booked":
        return "bg-blue-500"
      case "start":
        return "bg-green-500"
      case "pause":
        return "bg-yellow-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      case "reschedule":
        return "bg-orange-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-md border-l-4 px-2 py-1 text-xs transition-colors hover:opacity-80",
        getStatusColor(),
        className
      )}
    >
      <div className="font-medium text-white">{title}</div>
      <div className="text-white/80">
        {startTime} - {endTime}
      </div>
      {appointment.patient && (
        <div className="truncate text-white/70">
          {appointment.patient.full_name}
        </div>
      )}
    </div>
  )
}
