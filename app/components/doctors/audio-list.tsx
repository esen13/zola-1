"use client"

import { AudioTranscriptionSheet } from "@/app/components/doctors/audio-transcription-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatDateTime } from "@/lib/utils/date"
import { useQuery } from "@tanstack/react-query"
import { Download, NotebookText } from "lucide-react"
import { useCallback, useState } from "react"

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

const fetchAudioList = async (): Promise<AudioRecord[]> => {
  const response = await fetch("/api/doctors/audio")
  if (!response.ok) {
    throw new Error("Ошибка загрузки списка аудио")
  }
  const data = await response.json()
  return data.audio || []
}

export const AudioList = () => {
  const [selectedAudio, setSelectedAudio] = useState<AudioRecord | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const {
    data: audioList,
    isLoading,
    error,
    refetch,
  } = useQuery<AudioRecord[]>({
    queryKey: ["doctors-audio"],
    queryFn: fetchAudioList,
  })

  const handleOpenDetails = useCallback((audio: AudioRecord) => {
    setSelectedAudio(audio)
    setIsSheetOpen(true)
  }, [])

  const handleDownload = useCallback((audio: AudioRecord) => {
    if (!audio.signed_url) {
      toast({
        title: "Ошибка",
        description: "URL для скачивания недоступен",
        status: "error",
      })
      return
    }

    const link = document.createElement("a")
    link.href = audio.signed_url
    link.download = audio.audio_filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои записи</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои записи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-center">
            Ошибка загрузки записей
          </div>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!audioList || audioList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои записи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            Нет сохраненных записей
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Мои записи</CardTitle>
          <Badge variant="secondary">{audioList.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioList.map((audio) => (
          <div key={audio.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="truncate font-medium whitespace-break-spaces">
                  {audio.audio_filename}
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {audio.created_at
                    ? formatDateTime(audio.created_at as string)
                    : "Дата неизвестна"}
                </div>
              </div>
            </div>

            {audio.signed_url && (
              <div className="space-y-2">
                <audio
                  src={audio.signed_url}
                  controls
                  className="w-full"
                  preload="auto"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(audio)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled
                  >
                    <Download />
                    Скачать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDetails(audio)}
                  >
                    <NotebookText className="size-4" />
                    Подробнее
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <AudioTranscriptionSheet
        audio={selectedAudio}
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)
          // Обновляем список при закрытии sheet
          if (!open) {
            refetch()
          }
        }}
      />
    </Card>
  )
}
