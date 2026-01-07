"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateAppointment } from "@/app/hooks/use-appointments"
import { format, addMinutes } from "date-fns"
import { ru } from "date-fns/locale"
import { toast } from "sonner"

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface Doctor {
  id: string
  name: string
  staff_id: number | null
  staff_name: string | null
}

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startTime?: Date | null
  selectedDoctorId?: string | null
  selectedPatientId?: string | null
  onSuccess?: () => void
}

interface FormData {
  doctor_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  title: string
  label: string
  notes: string
}

export const AppointmentDialog = ({
  open,
  onOpenChange,
  startTime,
  selectedDoctorId,
  selectedPatientId,
  onSuccess,
}: AppointmentDialogProps) => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const { createAppointment, isLoading, error } = useCreateAppointment()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>()

  useEffect(() => {
    if (open) {
      // Загружаем пациентов
      fetch("/api/patients")
        .then((res) => res.json())
        .then((data) => {
          if (data.patients) {
            setPatients(data.patients)
          }
        })
        .catch(() => {})

      // Загружаем докторов
      fetch("/api/doctors")
        .then((res) => res.json())
        .then((data) => {
          if (data.doctors) {
            setDoctors(data.doctors)
            setUserRole("doctor") // Предполагаем, что если есть доступ к докторам, то это manager/admin
          }
        })
        .catch(() => {
          // Если нет доступа, значит это doctor или patient
          setUserRole("doctor")
        })

      // Устанавливаем начальное время
      if (startTime) {
        const start = format(startTime, "yyyy-MM-dd'T'HH:mm")
        const end = format(addMinutes(startTime, 30), "yyyy-MM-dd'T'HH:mm")
        setValue("starts_at", start)
        setValue("ends_at", end)
      } else {
        const now = new Date()
        const start = format(now, "yyyy-MM-dd'T'HH:mm")
        const end = format(addMinutes(now, 30), "yyyy-MM-dd'T'HH:mm")
        setValue("starts_at", start)
        setValue("ends_at", end)
      }

      // Устанавливаем выбранного доктора
      if (selectedDoctorId) {
        setValue("doctor_id", selectedDoctorId)
      } else if (doctors.length > 0 && canSelectDoctor) {
        // Если доктор не выбран и есть доступ к выбору, берем первого
        setValue("doctor_id", doctors[0].id)
      }

      // Устанавливаем выбранного пациента
      if (selectedPatientId) {
        setValue("patient_id", selectedPatientId)
      }
    } else {
      reset()
    }
  }, [open, startTime, selectedDoctorId, selectedPatientId, doctors, setValue, reset])

  const onSubmit = async (data: FormData) => {
    if (!data.doctor_id || !data.patient_id) {
      toast.error("Заполните все обязательные поля")
      return
    }

    const result = await createAppointment({
      doctor_id: data.doctor_id,
      patient_id: data.patient_id,
      starts_at: new Date(data.starts_at).toISOString(),
      ends_at: new Date(data.ends_at).toISOString(),
      status: "start",
      title: data.title || null,
      label: data.label || null,
      notes: data.notes || null,
    })

    if (result) {
      toast.success("Запись успешно создана")
      onSuccess?.()
      onOpenChange(false)
    } else {
      toast.error(error || "Ошибка создания записи")
    }
  }

  const canSelectDoctor =
    userRole === "manager" || userRole === "moderator" || userRole === "admin"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Создать запись</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {canSelectDoctor && (
            <div className="space-y-2">
              <Label htmlFor="doctor_id">Доктор *</Label>
              <Select
                value={watch("doctor_id")}
                onValueChange={(value) => setValue("doctor_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите доктора" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctor_id && (
                <p className="text-sm text-destructive">
                  {errors.doctor_id.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="patient_id">Пациент *</Label>
            <Select
              value={watch("patient_id")}
              onValueChange={(value) => setValue("patient_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите пациента" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patient_id && (
              <p className="text-sm text-destructive">
                {errors.patient_id.message}
              </p>
            )}
            {!watch("patient_id") && (
              <p className="text-sm text-destructive">
                Выберите пациента
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Начало *</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...register("starts_at", { required: "Обязательное поле" })}
              />
              {errors.starts_at && (
                <p className="text-sm text-destructive">
                  {errors.starts_at.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Окончание *</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...register("ends_at", { required: "Обязательное поле" })}
              />
              {errors.ends_at && (
                <p className="text-sm text-destructive">
                  {errors.ends_at.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input id="title" {...register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Метка</Label>
              <Input id="label" {...register("label")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Заметка</Label>
            <Textarea id="notes" {...register("notes")} rows={4} />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Создание..." : "Создать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

