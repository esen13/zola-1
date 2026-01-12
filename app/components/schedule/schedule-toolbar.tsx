"use client"

import type { CalendarView } from "@/app/types/schedule.types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/user-store/provider"
import { addDays, format, startOfToday, subDays } from "date-fns"
import { ru } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface Doctor {
  id: string
  name: string
  staff_id: number | null
  staff_name: string | null
}

interface ScheduleToolbarProps {
  view: CalendarView
  selectedDate: Date
  selectedDoctorId: string | null
  onViewChange: (view: CalendarView) => void
  onDateChange: (date: Date) => void
  onDoctorChange: (doctorId: string | null) => void
}

export const ScheduleToolbar = ({
  view,
  selectedDate,
  selectedDoctorId,
  onViewChange,
  onDateChange,
  onDoctorChange,
}: ScheduleToolbarProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const { user } = useUser()
  const userRole = user?.role || null

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/doctors")
        if (response.ok) {
          const data = await response.json()
          setDoctors(data.doctors || [])
        }
      } catch (error) {
        console.error("Ошибка загрузки докторов:", error)
      }
    }

    // Загружаем докторов только для manager/moderator/admin или doctor
    if (
      userRole === "manager" ||
      userRole === "moderator" ||
      userRole === "admin" ||
      userRole === "doctor"
    ) {
      fetchDoctors()
    }
  }, [userRole])

  const handlePrev = () => {
    let newDate: Date
    if (view === "day") {
      newDate = subDays(selectedDate, 1)
    } else if (view === "week") {
      newDate = subDays(selectedDate, 7)
    } else {
      newDate = subDays(selectedDate, 30)
    }
    onDateChange(newDate)
  }

  const handleNext = () => {
    let newDate: Date
    if (view === "day") {
      newDate = addDays(selectedDate, 1)
    } else if (view === "week") {
      newDate = addDays(selectedDate, 7)
    } else {
      newDate = addDays(selectedDate, 30)
    }
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(startOfToday())
  }

  const formatDateLabel = () => {
    if (view === "day") {
      return format(selectedDate, "EEEE, d MMMM yyyy", { locale: ru })
    } else if (view === "week") {
      const weekStart = selectedDate
      const weekEnd = addDays(weekStart, 6)
      return `${format(weekStart, "d MMM", { locale: ru })} - ${format(weekEnd, "d MMM yyyy", { locale: ru })}`
    } else {
      return format(selectedDate, "MMMM yyyy", { locale: ru })
    }
  }

  const canSelectDoctor =
    userRole === "manager" || userRole === "moderator" || userRole === "admin"

  return (
    <div className="bg-background border-b px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Календарь</h1>
          <Tabs
            value={view}
            onValueChange={(v) => onViewChange(v as CalendarView)}
          >
            <TabsList>
              <TabsTrigger value="day">День</TabsTrigger>
              <TabsTrigger value="week">Неделя</TabsTrigger>
              <TabsTrigger value="month">Месяц</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Сегодня
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-4 text-sm font-medium">{formatDateLabel()}</div>
        </div>

        <div className="flex items-center gap-2">
          {canSelectDoctor && (
            <Select
              value={selectedDoctorId || "all"}
              onValueChange={(value) =>
                onDoctorChange(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Выберите доктора" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все доктора</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}
