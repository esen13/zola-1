"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { formatDuration } from "@/lib/utils/audio"
import { CirclePause, CirclePlay, CircleStop, Mic, Pause } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type RecordingState = "idle" | "recording" | "paused" | "processing"

export const AudioRecorder = ({
  onRecordingComplete,
}: {
  onRecordingComplete?: () => void
}) => {
  const [state, setState] = useState<RecordingState>("idle")
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedDurationRef = useRef<number>(0)

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4"

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState("idle")
        setDuration(0)
        pausedDurationRef.current = 0
      }

      mediaRecorder.start()
      setState("recording")
      startTimeRef.current = Date.now() - pausedDurationRef.current

      // Обновляем длительность каждую секунду
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setDuration(Math.floor(elapsed / 1000))
      }, 1000)
    } catch (error) {
      console.error("Ошибка доступа к микрофону:", error)
      toast({
        title: "Ошибка доступа к микрофону",
        description: "Разрешите доступ к микрофону в настройках браузера",
        status: "error",
      })
      setState("idle")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause()
      setState("paused")
      pausedDurationRef.current = Date.now() - startTimeRef.current
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume()
      setState("recording")
      startTimeRef.current = Date.now() - pausedDurationRef.current

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setDuration(Math.floor(elapsed / 1000))
      }, 1000)
    }
  }, [state])

  const handleSave = useCallback(async () => {
    if (!audioBlob) return

    setState("processing")

    try {
      const formData = new FormData()
      const audioFile = new File([audioBlob], "recording.webm", {
        type: audioBlob.type,
      })
      formData.append("audio", audioFile)

      const response = await fetch("/api/doctors/audio", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка загрузки аудио")
      }

      toast({
        title: "Аудио успешно сохранено",
        status: "success",
      })

      // Очищаем состояние
      setAudioBlob(null)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      onRecordingComplete?.()
    } catch (error) {
      console.error("Ошибка сохранения аудио:", error)
      toast({
        title: "Ошибка сохранения",
        description:
          error instanceof Error ? error.message : "Не удалось сохранить аудио",
        status: "error",
      })
    } finally {
      setState("idle")
    }
  }, [audioBlob, audioUrl, onRecordingComplete])

  const handleDiscard = useCallback(() => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setState("idle")
    setDuration(0)
  }, [audioUrl])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Запись аудио</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {state === "idle" && !audioBlob && (
          <div className="flex flex-col items-center gap-4">
            <Button onClick={startRecording} size="lg" className="w-full">
              <Mic className="size-4" />
              Начать запись
            </Button>
          </div>
        )}

        {(state === "recording" || state === "paused") && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  state === "recording"
                    ? "bg-destructive animate-pulse"
                    : "bg-muted"
                }`}
              >
                <Mic className="size-8 text-white" />
              </div>
              <div className="font-mono text-2xl font-semibold">
                {formatDuration(duration)}
              </div>
            </div>

            <div className="flex gap-2">
              {state === "recording" ? (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <CirclePause />
                  Пауза
                </Button>
              ) : (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <CirclePlay />
                  Продолжить
                </Button>
              )}
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
              >
                <CircleStop />
                Остановить
              </Button>
            </div>
          </div>
        )}

        {audioBlob && audioUrl && state === "idle" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <audio src={audioUrl} controls className="w-full" />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDiscard}
                variant="outline"
                className="flex-1"
              >
                Отменить
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Сохранить
              </Button>
            </div>
          </div>
        )}

        {state === "processing" && (
          <div className="flex items-center justify-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">
              Сохранение аудио...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
