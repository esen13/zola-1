export type UserInfo = {
  username?: string | null
  email?: string | null
}

/**
 * Генерирует UUID (работает на сервере и клиенте)
 */
const generateUUID = (): string => {
  // Проверяем наличие crypto.randomUUID (доступно в Node.js 14.17+ и современных браузерах)
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }
  // Fallback для старых браузеров
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Генерирует имя файла для аудио записи
 * Формат: {username|email}_{uuid}.webm
 */
export const generateAudioFilename = (user: UserInfo): string => {
  const identifier = user.username || user.email?.split("@")[0] || "user"
  const uuid = generateUUID()
  return `${identifier}_${uuid}.webm`
}

/**
 * Форматирует длительность в секундах в читаемый формат (MM:SS)
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Валидация аудио файла
 */
export const validateAudioFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB для аудио
  const ALLOWED_AUDIO_TYPES = [
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
  ]

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Размер файла превышает ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  }

  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Неподдерживаемый формат аудио файла",
    }
  }

  return { isValid: true }
}

