"use client"

import { AppointmentDetailsDialog } from "@/app/components/schedule/appointment-details-dialog"
import { AppointmentDialog } from "@/app/components/schedule/appointment-dialog"
import { CalendarDayView } from "@/app/components/schedule/calendar-day-view"
import { CalendarMonthView } from "@/app/components/schedule/calendar-month-view"
import { CalendarWeekView } from "@/app/components/schedule/calendar-week-view"
import { PatientsSidebar } from "@/app/components/schedule/patients-sidebar"
import { ScheduleToolbar } from "@/app/components/schedule/schedule-toolbar"
import { useAppointments } from "@/app/hooks/use-appointments"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useScheduleNavigation } from "@/app/hooks/use-schedule-navigation"
import type {
  Appointment,
  AppointmentFilters,
  CalendarView,
} from "@/app/types/schedule.types"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { Users } from "lucide-react"
import { useMemo, useState } from "react"

export const SchedulePageClient = () => {
  const [view, setView] = useState<CalendarView>("day")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  )
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [appointmentStartTime, setAppointmentStartTime] = useState<Date | null>(
    null
  )
  const [isPatientsSheetOpen, setIsPatientsSheetOpen] = useState(false)
  const isMobile = useBreakpoint(768)

  const { startDate, endDate } = useScheduleNavigation(view, selectedDate)

  // Вычисляем диапазон месяца для загрузки записей (независимо от режима просмотра)
  const monthRange = useMemo(() => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    return {
      start: monthStart,
      end: monthEnd,
    }
  }, [selectedDate])

  // Фильтры для получения записей - всегда загружаем за весь месяц
  const filters: AppointmentFilters = useMemo(
    () => ({
      doctor_id: selectedDoctorId || undefined,
      patient_id: selectedPatientId || undefined,
      start_date: format(monthRange.start, "yyyy-MM-dd"),
      end_date: format(monthRange.end, "yyyy-MM-dd"),
    }),
    [selectedDoctorId, selectedPatientId, monthRange.start, monthRange.end]
  )

  const { appointments, isLoading, error, refetch } = useAppointments(filters)

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  const handleViewChange = (newView: CalendarView) => {
    setView(newView)
  }

  const handleDoctorChange = (doctorId: string | null) => {
    setSelectedDoctorId(doctorId)
  }

  const handlePatientSelect = (patientId: string | null) => {
    setSelectedPatientId(patientId)
  }

  const handleTimeSlotClick = (date: Date) => {
    setAppointmentStartTime(date)
    setIsAppointmentDialogOpen(true)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsDialogOpen(true)
  }

  const handleAppointmentCreated = () => {
    setIsAppointmentDialogOpen(false)
    setAppointmentStartTime(null)
    refetch()
  }

  const handleAppointmentUpdated = () => {
    setIsDetailsDialogOpen(false)
    setSelectedAppointment(null)
    refetch()
  }

  const handleAppointmentDeleted = () => {
    setIsDetailsDialogOpen(false)
    setSelectedAppointment(null)
    refetch()
  }

  return (
    <div className="flex h-full flex-col py-20">
      <ScheduleToolbar
        view={view}
        selectedDate={selectedDate}
        selectedDoctorId={selectedDoctorId}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onDoctorChange={handleDoctorChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {view === "day" && (
                <CalendarDayView
                  date={selectedDate}
                  appointments={appointments || []}
                  onTimeSlotClick={handleTimeSlotClick}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
              {view === "week" && (
                <CalendarWeekView
                  startDate={startDate}
                  appointments={appointments || []}
                  onTimeSlotClick={handleTimeSlotClick}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
              {view === "month" && (
                <CalendarMonthView
                  date={selectedDate}
                  appointments={appointments || []}
                  onDateClick={handleDateChange}
                  onAppointmentClick={handleAppointmentClick}
                />
              )}
            </div>
          </div>
        </div>

        {!isMobile && (
          <PatientsSidebar
            selectedPatientId={selectedPatientId}
            onPatientSelect={handlePatientSelect}
          />
        )}
      </div>

      {isMobile && (
        <Sheet open={isPatientsSheetOpen} onOpenChange={setIsPatientsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
              size="icon"
            >
              <Users className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>Пациенты</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <PatientsSidebar
                selectedPatientId={selectedPatientId}
                onPatientSelect={(patientId) => {
                  handlePatientSelect(patientId)
                  setIsPatientsSheetOpen(false)
                }}
                isInSheet={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {isAppointmentDialogOpen && (
        <AppointmentDialog
          open={isAppointmentDialogOpen}
          onOpenChange={setIsAppointmentDialogOpen}
          startTime={appointmentStartTime}
          selectedDoctorId={selectedDoctorId}
          selectedPatientId={selectedPatientId}
          onSuccess={handleAppointmentCreated}
        />
      )}

      {isDetailsDialogOpen && selectedAppointment && (
        <AppointmentDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          appointment={selectedAppointment}
          onUpdated={handleAppointmentUpdated}
          onDeleted={handleAppointmentDeleted}
        />
      )}
    </div>
  )
}
