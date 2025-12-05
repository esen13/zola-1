"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { formatDate, formatDateTime } from "@/lib/utils/date"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

export type Patient = {
  id: string
  full_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  created_at: string | null
  updated_at: string | null
  anonymous?: boolean | null
  premium?: boolean | null
  chat_status?: string | null
  staff_name?: string | null
  company_name?: string | null
  preliminary_diagnosis?: string | null
  staff_id?: number | null
  comments?: string | null
  treatment_plan?: string | null
}

type Doctor = {
  id: string
  name: string
  staff_id: number | null
  staff_name: string | null
}

type PatientFormData = {
  preliminary_diagnosis: string
  staff_id: string
  comments: string
  treatment_plan: string
}

type PatientDetailsSheetProps = {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (updatedPatient: Patient) => void
}

export const PatientDetailsSheet = ({
  patient,
  open,
  onOpenChange,
  onUpdate,
}: PatientDetailsSheetProps) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<PatientFormData>({
    defaultValues: {
      preliminary_diagnosis: "",
      staff_id: "none",
      comments: "",
      treatment_plan: "",
    },
  })

  useEffect(() => {
    if (open && patient) {
      reset({
        preliminary_diagnosis: patient.preliminary_diagnosis || "",
        staff_id: patient.staff_id?.toString() || "none",
        comments: patient.comments || "",
        treatment_plan: patient.treatment_plan || "",
      })
    }
  }, [open, patient, reset])

  useEffect(() => {
    if (open) {
      fetchDoctors()
    }
  }, [open])

  const fetchDoctors = async () => {
    try {
      setIsLoadingDoctors(true)
      const response = await fetch("/api/doctors")
      if (!response.ok) {
        throw new Error("Ошибка загрузки докторов")
      }
      const data = await response.json()
      setDoctors(data.doctors || [])
    } catch (error) {
      console.error("Ошибка загрузки докторов:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список докторов",
        status: "error",
      })
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    if (!patient) return

    try {
      // Находим выбранного доктора
      let selectedDoctor: Doctor | undefined
      if (data.staff_id && data.staff_id !== "none") {
        // Сначала ищем по staff_id
        selectedDoctor = doctors.find(
          (d) => d.staff_id?.toString() === data.staff_id
        )
        // Если не нашли по staff_id, ищем по id
        if (!selectedDoctor) {
          selectedDoctor = doctors.find((d) => d.id === data.staff_id)
        }
      }

      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_id:
            data.staff_id &&
            data.staff_id !== "none" &&
            selectedDoctor?.staff_id
              ? Number(selectedDoctor.staff_id)
              : null,
          staff_name: selectedDoctor?.name || null,
          preliminary_diagnosis: data.preliminary_diagnosis.trim() || null,
          comments: data.comments.trim() || null,
          treatment_plan: data.treatment_plan.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка сохранения")
      }

      const responseData = await response.json()

      // Обновляем локальное состояние пациента
      const updatedPatient: Patient = {
        ...patient,
        staff_id: responseData.patient.staff_id,
        staff_name: responseData.patient.staff_name,
        preliminary_diagnosis: responseData.patient.preliminary_diagnosis,
        comments: responseData.patient.comments,
        treatment_plan: responseData.patient.treatment_plan,
      }

      // Вызываем callback для обновления списка пациентов
      if (onUpdate) {
        onUpdate(updatedPatient)
      }

      // Сбрасываем форму после успешного сохранения
      reset(data, { keepValues: true })

      toast({
        title: "Успешно",
        description: "Данные пациента обновлены",
        status: "success",
      })
    } catch (error) {
      console.error("Ошибка сохранения:", error)
      toast({
        title: "Ошибка",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить данные",
        status: "error",
      })
    }
  }

  if (!patient) return null

  const getStatusLabel = (status: string | null | undefined): string => {
    if (!status) return "Не начато"

    const statusMap: Record<string, string> = {
      start: "Сессия началась",
      end: "Сессия завершена",
      continue: "Сессия продолжается",
      review: "На одобрении",
      accepted: "Одобрено",
      declined: "Отклонено",
    }

    return statusMap[status] || status
  }

  const getStatusVariant = (
    status: string | null | undefined
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "outline"

    switch (status) {
      case "start":
      case "continue":
        return "default"
      case "end":
      case "review":
        return "secondary"
      case "accepted":
        return "default"
      case "declined":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-2xl">{patient.full_name}</SheetTitle>
          <SheetDescription>Подробная информация о пациенте</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-20">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">ID:</span>
                <span className="text-right font-mono text-sm break-all">
                  {patient.id}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">ФИО:</span>
                <span className="text-right text-sm font-medium">
                  {patient.full_name}
                </span>
              </div>
              <Separator />
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">Пол:</span>
                <span className="text-right text-sm">
                  {patient.gender || "Не указано"}
                </span>
              </div>
              {patient.date_of_birth && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Дата рождения:
                    </span>
                    <span className="text-right text-sm">
                      {formatDate(patient.date_of_birth)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Медицинская информация */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Медицинская информация</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Предварительный диагноз:
                  </Label>
                  <Controller
                    name="preliminary_diagnosis"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Введите диагноз..."
                        className="min-h-24"
                      />
                    )}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Лечащий врач:</Label>
                  <Controller
                    name="staff_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoadingDoctors}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите врача" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не привязан</SelectItem>
                          {doctors.map((doctor) => {
                            // Используем staff_id если есть, иначе id
                            const value =
                              doctor.staff_id?.toString() || doctor.id
                            return (
                              <SelectItem key={doctor.id} value={value}>
                                {doctor.name}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Дополнительная информация
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Комментарии:</Label>
                  <Controller
                    name="comments"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Введите комментарии для пациента..."
                        className="min-h-32"
                      />
                    )}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-muted-foreground">План лечения:</Label>
                  <Controller
                    name="treatment_plan"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Введите план лечения..."
                        className="min-h-32"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            {isDirty && (
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            )}
          </form>

          {/* Контакты */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Контакты</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">Email:</span>
                <span className="text-right text-sm break-all">
                  {patient.email}
                </span>
              </div>
              {patient.phone && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Телефон:
                    </span>
                    <span className="text-right text-sm">{patient.phone}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Системная информация */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Системная информация</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground text-sm">
                  Дата создания:
                </span>
                <span className="text-right text-sm">
                  {formatDateTime(patient.created_at)}
                </span>
              </div>
              {patient.updated_at && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Дата обновления:
                    </span>
                    <span className="text-right text-sm">
                      {formatDateTime(patient.updated_at)}
                    </span>
                  </div>
                </>
              )}
              {patient.company_name && (
                <>
                  <Separator />
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground text-sm">
                      Компания:
                    </span>
                    <span className="text-right text-sm">
                      {patient.company_name}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Статус:</span>
                <Badge variant={getStatusVariant(patient.chat_status)}>
                  {getStatusLabel(patient.chat_status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
