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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/lib/user-store/provider"
import { formatDateTime } from "@/lib/utils/date"
import { pdf } from "@react-pdf/renderer"
import { useQueryClient } from "@tanstack/react-query"
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

  const generatePDFBlob = useCallback(async () => {
    if (!audio || !finalTextValue || !finalTextValue.trim()) {
      return null
    }

    const doctorName =
      user?.display_name || user?.staff_name || user?.email || undefined

    const doc = (
      <MedicalPdfDocument
        finalText={finalTextValue}
        audioRecord={audio}
        doctorName={doctorName}
      />
    )

    const blob = await pdf(doc).toBlob()
    return blob
  }, [audio, finalTextValue, user])

  const handlePreviewPDF = useCallback(async () => {
    if (!audio || !finalTextValue || !finalTextValue.trim()) {
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
  }, [audio, finalTextValue, generatePDFBlob])

  const handleDownloadPDF = useCallback(async () => {
    if (!audio || !finalTextValue || !finalTextValue.trim()) {
      return
    }

    setIsGeneratingPDF(true)

    try {
      const blob = await generatePDFBlob()
      if (!blob) return

      const url = URL.createObjectURL(blob)

      // Генерируем имя файла
      const fileName = `medical-report-${audio.audio_filename.replace(
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
  }, [audio, finalTextValue, generatePDFBlob])

  // Очищаем blob URL при закрытии модального окна
  useEffect(() => {
    if (!isPreviewOpen && pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
      setPdfPreviewUrl(null)
    }
  }, [isPreviewOpen, pdfPreviewUrl])

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
                <audio
                  src={audio.signed_url}
                  controls
                  className="w-full"
                  preload="none"
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
                      <div className="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M1 12s4-4 11-4 11 4 11 4-4 4-11 4-11-4-11-4z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
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
                      <div className="border-primary mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
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
