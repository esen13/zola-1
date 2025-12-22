"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { formatDateTime } from "@/lib/utils/date"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

type AudioRecord = {
  id: string
  user_id: string
  audio_filename: string
  file_path: string
  created_at: string | null
  signed_url: string | null
  transcribe_text?: string | null
  final_text?: string | null
}

type AudioTranscriptionSheetProps = {
  audio: AudioRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormData = {
  transcribe_text: string
  final_text: string
}

export const AudioTranscriptionSheet = ({
  audio,
  open,
  onOpenChange,
}: AudioTranscriptionSheetProps) => {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FormData>({
    defaultValues: {
      transcribe_text: "",
      final_text: "",
    },
  })

  // Сбрасываем форму при изменении audio
  useEffect(() => {
    if (audio) {
      reset({
        transcribe_text: audio.transcribe_text || "",
        final_text: audio.final_text || "",
      })
    }
  }, [audio, reset])

  const onSubmit = async (data: FormData) => {
    if (!audio) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/doctors/audio/${audio.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcribe_text: data.transcribe_text || null,
          final_text: data.final_text || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка сохранения")
      }

      toast({
        title: "Изменения сохранены",
        status: "success",
      })

      // Обновляем список аудио записей
      queryClient.invalidateQueries({ queryKey: ["doctors-audio"] })

      // Сбрасываем форму после успешного сохранения
      reset(data)
    } catch (error) {
      console.error("Ошибка сохранения транскрипции:", error)
      toast({
        title: "Ошибка сохранения",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить изменения",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!audio) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{audio.audio_filename}</SheetTitle>
          <SheetDescription>
            {audio.created_at
              ? formatDateTime(audio.created_at as string)
              : "Дата неизвестна"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-20">
          {/* Аудио плеер */}
          {audio.signed_url && (
            <div className="space-y-2">
              <Label>Аудио запись:</Label>
              <div className="rounded-lg border p-4">
                <audio src={audio.signed_url} controls className="w-full" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Финальный текст */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Финальный текст</h3>
              <div className="space-y-2">
                <Label htmlFor="final_text" className="hidden">
                  Финальный текст:
                </Label>
                <Controller
                  name="final_text"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="final_text"
                      placeholder="Обработанный финальный текст..."
                      className="min-h-[200px] resize-y"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>

            {/* Транскрипция */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Транскрипция</h3>
              <div className="space-y-2">
                <Label htmlFor="transcribe_text" className="hidden">
                  Транскрипция:
                </Label>
                <Controller
                  name="transcribe_text"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="transcribe_text"
                      placeholder="Транскрипция аудио записи..."
                      className="min-h-[200px] resize-y"
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </div>

            {/* Кнопка сохранения */}
            {isDirty && (
              <div className="bg-background sticky bottom-0 border-t pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </div>
            )}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
