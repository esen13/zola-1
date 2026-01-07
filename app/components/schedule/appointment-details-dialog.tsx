"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useUpdateAppointment, useDeleteAppointment } from "@/app/hooks/use-appointments"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { toast } from "sonner"
import type { Appointment } from "@/app/types/schedule.types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AppointmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onUpdated?: () => void
  onDeleted?: () => void
}

export const AppointmentDetailsDialog = ({
  open,
  onOpenChange,
  appointment,
  onUpdated,
  onDeleted,
}: AppointmentDetailsDialogProps) => {
  const { updateAppointment, isLoading: isUpdating } = useUpdateAppointment()
  const { deleteAppointment, isLoading: isDeleting } = useDeleteAppointment()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false)
    }
  }, [open])

  const handleStatusChange = async (newStatus: string) => {
    const result = await updateAppointment(appointment.id, {
      status: newStatus as any,
    })

    if (result) {
      toast.success("Статус обновлен")
      onUpdated?.()
    } else {
      toast.error("Ошибка обновления статуса")
    }
  }

  const handleDelete = async () => {
    const success = await deleteAppointment(appointment.id)
    if (success) {
      toast.success("Запись удалена")
      onDeleted?.()
      onOpenChange(false)
    } else {
      toast.error("Ошибка удаления записи")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {appointment.title || "Детали записи"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Доктор</h3>
              <p className="text-sm">
                {appointment.doctor?.name || "Не указан"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Пациент</h3>
              <p className="text-sm">
                {appointment.patient?.full_name || "Не указан"}
              </p>
              {appointment.patient?.phone && (
                <p className="text-xs text-muted-foreground">
                  {appointment.patient.phone}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Время</h3>
              <p className="text-sm">
                {format(new Date(appointment.starts_at), "d MMMM yyyy, HH:mm", {
                  locale: ru,
                })}{" "}
                - {format(new Date(appointment.ends_at), "HH:mm", { locale: ru })}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Статус</h3>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={appointment.status === "start" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange("start")}
                  disabled={isUpdating}
                >
                  Начато
                </Button>
                <Button
                  variant={appointment.status === "pause" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange("pause")}
                  disabled={isUpdating}
                >
                  Пауза
                </Button>
                <Button
                  variant={appointment.status === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                  disabled={isUpdating}
                >
                  Завершено
                </Button>
                <Button
                  variant={appointment.status === "cancelled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={isUpdating}
                >
                  Отменено
                </Button>
              </div>
            </div>

            {appointment.label && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Метка</h3>
                <p className="text-sm">{appointment.label}</p>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Заметка</h3>
                <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    Удалить
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Запись будет удалена безвозвратно.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

