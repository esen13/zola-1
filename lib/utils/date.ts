import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns"
import { ru } from "date-fns/locale"

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Не указано"

  try {
    const date = parseISO(dateString)
    return format(date, "dd.MM.yyyy", { locale: ru })
  } catch {
    try {
      // Fallback для случаев, когда parseISO не работает
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Неверная дата"
      return format(date, "dd.MM.yyyy", { locale: ru })
    } catch {
      return "Неверная дата"
    }
  }
}

/**
 * Форматирует дату и время в формат DD.MM.YYYY HH:mm
 */
export const formatDateTime = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Не указано"

  try {
    const date = parseISO(dateString)
    return format(date, "dd.MM.yyyy HH:mm", { locale: ru })
  } catch {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Неверная дата"
      return format(date, "dd.MM.yyyy HH:mm", { locale: ru })
    } catch {
      return "Неверная дата"
    }
  }
}

/**
 * Форматирует дату в человекочитаемый формат (относительное время)
 * Например: "2 часа назад", "вчера", "15 января"
 */
export const formatRelativeDate = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Не указано"

  try {
    const date = parseISO(dateString)

    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ru })
    }

    if (isYesterday(date)) {
      return "Вчера"
    }

    // Если дата в текущем году, показываем только день и месяц
    const now = new Date()
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, "d MMMM", { locale: ru })
    }

    // Если дата в другом году, показываем полную дату
    return format(date, "d MMMM yyyy", { locale: ru })
  } catch {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Неверная дата"

      if (isToday(date)) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ru })
      }

      if (isYesterday(date)) {
        return "Вчера"
      }

      const now = new Date()
      if (date.getFullYear() === now.getFullYear()) {
        return format(date, "d MMMM", { locale: ru })
      }

      return format(date, "d MMMM yyyy", { locale: ru })
    } catch {
      return "Неверная дата"
    }
  }
}

/**
 * Форматирует дату в короткий формат для таблиц
 * Например: "15 янв 2024"
 */
export const formatShortDate = (
  dateString: string | null | undefined
): string => {
  if (!dateString) return "Не указано"

  try {
    const date = parseISO(dateString)
    return format(date, "d MMM yyyy", { locale: ru })
  } catch {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Неверная дата"
      return format(date, "d MMM yyyy", { locale: ru })
    } catch {
      return "Неверная дата"
    }
  }
}
