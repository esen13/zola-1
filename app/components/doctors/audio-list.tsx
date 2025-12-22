"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatDateTime } from "@/lib/utils/date"
import { useQuery } from "@tanstack/react-query"
import { useCallback } from "react"

type AudioRecord = {
  id: string
  user_id: string
  audio_filename: string
  file_path: string
  created_at: string | null
  signed_url: string | null
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
  const {
    data: audioList,
    isLoading,
    error,
    refetch,
  } = useQuery<AudioRecord[]>({
    queryKey: ["doctors-audio"],
    queryFn: fetchAudioList,
  })

  const handleDownload = useCallback(
    (audio: AudioRecord) => {
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
    },
    []
  )

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
          <div className="text-center text-destructive">
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
          <div className="text-center text-muted-foreground py-8">
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
          <div
            key={audio.id}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {audio.audio_filename}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {audio.created_at
                    ? formatDateTime(new Date(audio.created_at))
                    : "Дата неизвестна"}
                </div>
              </div>
            </div>

            {audio.signed_url && (
              <div className="space-y-2">
                <audio src={audio.signed_url} controls className="w-full" />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(audio)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
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
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    Скачать
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

