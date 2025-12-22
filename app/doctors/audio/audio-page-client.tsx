"use client"

import { AudioList } from "@/app/components/doctors/audio-list"
import { AudioRecorder } from "@/app/components/doctors/audio-recorder"
import { useQueryClient } from "@tanstack/react-query"

export const AudioPageClient = () => {
  const queryClient = useQueryClient()

  const handleRecordingComplete = () => {
    // Обновляем список после сохранения новой записи
    queryClient.invalidateQueries({ queryKey: ["doctors-audio"] })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Запись аудио</h1>
        <p className="text-muted-foreground">
          Записывайте и сохраняйте аудио записи для пациентов
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        <AudioList />
      </div>
    </div>
  )
}

