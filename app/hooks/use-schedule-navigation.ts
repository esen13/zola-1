import { useMemo } from "react"
import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { ru } from "date-fns/locale"
import type { CalendarView } from "@/app/types/schedule.types"

export const useScheduleNavigation = (
  view: CalendarView,
  selectedDate: Date
): { startDate: Date; endDate: Date } => {
  return useMemo(() => {
    const date = selectedDate

    switch (view) {
      case "day":
        return {
          startDate: startOfDay(date),
          endDate: startOfDay(date),
        }

      case "week":
        return {
          startDate: startOfWeek(date, { locale: ru }),
          endDate: endOfWeek(date, { locale: ru }),
        }

      case "month":
        return {
          startDate: startOfMonth(date),
          endDate: endOfMonth(date),
        }

      default:
        return {
          startDate: startOfDay(date),
          endDate: startOfDay(date),
        }
    }
  }, [view, selectedDate])
}

