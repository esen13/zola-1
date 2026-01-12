import type { SupabaseClientType } from "@/app/types/api.types"

/**
 * Проверяет валидность времени записи
 */
export const validateAppointmentTime = (
  startsAt: string,
  endsAt: string
): { valid: boolean; error?: string } => {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Некорректный формат даты" }
  }

  if (end <= start) {
    return { valid: false, error: "Время окончания должно быть позже времени начала" }
  }

  // Минимальная длительность - 5 минут
  const minDuration = 5 * 60 * 1000 // 5 минут в миллисекундах
  if (end.getTime() - start.getTime() < minDuration) {
    return { valid: false, error: "Минимальная длительность записи - 5 минут" }
  }

  return { valid: true }
}

/**
 * Проверяет конфликты времени для указанного доктора
 */
export const checkTimeConflict = async (
  supabase: SupabaseClientType,
  doctorId: string,
  startsAt: string,
  endsAt: string,
  excludeId?: string
): Promise<{ hasConflict: boolean; conflictingAppointment?: any }> => {
  try {
    // Получаем все записи доктора в указанном диапазоне времени
    let query = supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, title")
      .eq("doctor_id", doctorId)
      .in("status", ["booked", "start", "pause"]) // Проверяем только активные статусы
      .or(
        `and(starts_at.lte.${startsAt},ends_at.gt.${startsAt}),and(starts_at.lt.${endsAt},ends_at.gte.${endsAt}),and(starts_at.gte.${startsAt},ends_at.lte.${endsAt})`
      )

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Ошибка проверки конфликтов времени:", error)
      return { hasConflict: false } // В случае ошибки разрешаем создание
    }

    if (data && data.length > 0) {
      return {
        hasConflict: true,
        conflictingAppointment: data[0],
      }
    }

    return { hasConflict: false }
  } catch (error) {
    console.error("Ошибка при проверке конфликтов времени:", error)
    return { hasConflict: false } // В случае ошибки разрешаем создание
  }
}

/**
 * Вычисляет время окончания на основе времени начала и длительности (в минутах)
 */
export const calculateEndTime = (
  startsAt: string,
  durationMinutes: number = 30
): string => {
  const start = new Date(startsAt)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  return end.toISOString()
}

