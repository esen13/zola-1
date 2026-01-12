import type { CalendarView } from "@/app/types/schedule.types"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ru } from "date-fns/locale"
import { useMemo } from "react"

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
          endDate: endOfDay(date),
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
          endDate: endOfDay(date),
        }
    }
  }, [view, selectedDate])
}
