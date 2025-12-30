"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/lib/user-store/provider"
import { formatDateTime } from "@/lib/utils/date"
import { pdf } from "@react-pdf/renderer"
import { useQuery, useQueryClient, type Query } from "@tanstack/react-query"
import { Download, Eye } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { MedicalPdfDocument } from "./medical-pdf-document"

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

// Функция для получения конкретной аудио записи
const fetchAudioRecord = async (
  audioId: string
): Promise<AudioRecord | null> => {
  const response = await fetch("/api/doctors/audio")
  if (!response.ok) {
    throw new Error("Ошибка загрузки списка аудио")
  }
  const data = await response.json()
  const audioList = data.audio || []
  return audioList.find((a: AudioRecord) => a.id === audioId) || null
}

export const AudioTranscriptionSheet = ({
  audio,
  open,
  onOpenChange,
}: AudioTranscriptionSheetProps) => {
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const pdfPreviewRef = useRef<HTMLIFrameElement>(null)

  // Получаем актуальные данные аудио записи с автоматическим обновлением
  const {
    data: currentAudio,
    refetch: refetchAudio,
    isLoading: isLoadingAudio,
  } = useQuery<AudioRecord | null>({
    queryKey: ["doctors-audio", audio?.id],
    queryFn: () => (audio?.id ? fetchAudioRecord(audio.id) : null),
    enabled: !!audio?.id && open,
    refetchOnWindowFocus: true,
    // Фоновое обновление каждые 5 секунд, если final_text пустой
    refetchInterval: (query: Query<AudioRecord | null>) => {
      const audioData = query.state.data
      if (audioData && !audioData.final_text) {
        return 5000 // 5 секунд
      }
      return false // Останавливаем обновление, если final_text есть
    },
  })

  // Используем актуальные данные или переданные через props
  const displayAudio: AudioRecord | null = currentAudio || audio

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<FormData>({
    defaultValues: {
      transcribe_text: "",
      final_text: "",
    },
  })

  const finalTextValue = watch("final_text")

  // Обновляем форму при изменении данных аудио
  useEffect(() => {
    if (displayAudio) {
      reset({
        transcribe_text: displayAudio.transcribe_text || "",
        final_text: displayAudio.final_text || "",
      })
    }
  }, [displayAudio, reset])

  // Обновляем данные при открытии sheet
  useEffect(() => {
    if (open && audio?.id) {
      refetchAudio()
    }
  }, [open, audio?.id, refetchAudio])

  const onSubmit = async (data: FormData) => {
    if (!displayAudio) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/doctors/audio/${displayAudio.id}`, {
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

      // Обновляем список аудио записей и конкретную запись
      queryClient.invalidateQueries({ queryKey: ["doctors-audio"] })
      await refetchAudio()

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

  const generatePDFBlob = useCallback(async () => {
    if (!displayAudio || !finalTextValue || !finalTextValue.trim()) {
      return null
    }

    const doctorName =
      user?.display_name || user?.staff_name || user?.email || undefined

    const doc = (
      <MedicalPdfDocument
        finalText={finalTextValue}
        audioRecord={displayAudio}
        doctorName={doctorName}
      />
    )

    const blob = await pdf(doc).toBlob()
    return blob
  }, [displayAudio, finalTextValue, user])

  const handlePreviewPDF = useCallback(async () => {
    if (!displayAudio || !finalTextValue || !finalTextValue.trim()) {
      return
    }

    setIsGeneratingPDF(true)

    try {
      const blob = await generatePDFBlob()
      if (!blob) {
        console.error("Blob не был создан")
        return
      }

      console.log("PDF blob создан, размер:", blob.size, "байт")
      const url = URL.createObjectURL(blob)
      console.log("Blob URL создан:", url)
      setPdfPreviewUrl(url)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error("Ошибка генерации PDF для просмотра:", error)
      toast({
        title: "Ошибка генерации PDF",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось создать PDF документ",
        status: "error",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [displayAudio, finalTextValue, generatePDFBlob])

  const handleDownloadPDF = useCallback(async () => {
    if (!displayAudio || !finalTextValue || !finalTextValue.trim()) {
      return
    }

    setIsGeneratingPDF(true)

    try {
      const blob = await generatePDFBlob()
      if (!blob) return

      const url = URL.createObjectURL(blob)

      // Генерируем имя файла
      const fileName = `medical-report-${displayAudio.audio_filename.replace(
        ".webm",
        ""
      )}.pdf`

      // Создаем ссылку и скачиваем
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Освобождаем память
      URL.revokeObjectURL(url)

      toast({
        title: "PDF документ скачан",
        status: "success",
      })
    } catch (error) {
      console.error("Ошибка генерации PDF:", error)
      toast({
        title: "Ошибка генерации PDF",
        description:
          error instanceof Error
            ? error.message
            : "Не удалось создать PDF документ",
        status: "error",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [displayAudio, finalTextValue, generatePDFBlob])

  // Очищаем blob URL при закрытии модального окна
  useEffect(() => {
    if (!isPreviewOpen && pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }, [isPreviewOpen, pdfPreviewUrl])

  if (!displayAudio) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{displayAudio.audio_filename}</SheetTitle>
          <SheetDescription>
            {displayAudio.created_at
              ? formatDateTime(displayAudio.created_at as string)
              : "Дата неизвестна"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-20">
          {/* Индикатор загрузки при обновлении данных */}
          {isLoadingAudio && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Spinner />
              Обновление данных...
            </div>
          )}

          {/* Аудио плеер */}
          {displayAudio.signed_url && (
            <div className="space-y-2">
              <Label>Аудио запись:</Label>
              <div className="rounded-lg border p-4">
                <audio
                  src={displayAudio.signed_url}
                  controls
                  className="w-full"
                  preload="auto"
                />
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewPDF}
                  disabled={
                    !finalTextValue ||
                    !finalTextValue.trim() ||
                    isGeneratingPDF ||
                    isSubmitting
                  }
                  className="flex-1"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Spinner />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Eye />
                      Просмотр PDF
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={
                    !finalTextValue ||
                    !finalTextValue.trim() ||
                    isGeneratingPDF ||
                    isSubmitting
                  }
                  className="flex-1"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Spinner />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <Download />
                      Скачать PDF
                    </>
                  )}
                </Button>
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

      {/* Модальное окно просмотра PDF */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-[900px] p-0 sm:max-w-[900px]">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Предпросмотр PDF документа</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {pdfPreviewUrl ? (
              <div className="h-[70vh] w-full overflow-hidden rounded-lg border">
                <iframe
                  ref={pdfPreviewRef}
                  src={`${pdfPreviewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="h-full w-full"
                  title="PDF Preview"
                  onError={(e) => {
                    console.error("Ошибка загрузки PDF в iframe:", e)
                    toast({
                      title: "Ошибка отображения PDF",
                      description:
                        "Браузер не может отобразить PDF. Попробуйте скачать файл.",
                      status: "error",
                    })
                  }}
                />
              </div>
            ) : (
              <div className="flex h-[70vh] items-center justify-center rounded-lg border">
                <div className="text-center">
                  <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <p className="text-muted-foreground text-sm">
                    Загрузка PDF...
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
