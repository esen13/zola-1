import type { Chats } from "@/lib/chat-store/types"
import {
  format,
  formatDistanceToNow,
  parseISO,
  startOfDay,
  startOfYear,
  subDays,
} from "date-fns"
import { ru } from "date-fns/locale"

type TimeGroup = {
  name: string
  chats: Chats[]
}

// Group chats by time periods
export function groupChatsByDate(
  chats: Chats[],
  searchQuery: string
): TimeGroup[] | null {
  if (searchQuery) return null // Don't group when searching

  const now = new Date()
  const today = startOfDay(now).getTime()
  const weekAgo = subDays(startOfDay(now), 7).getTime()
  const monthAgo = subDays(startOfDay(now), 30).getTime()
  const yearStart = startOfYear(now).getTime()

  const todayChats: Chats[] = []
  const last7DaysChats: Chats[] = []
  const last30DaysChats: Chats[] = []
  const thisYearChats: Chats[] = []
  const olderChats: Record<number, Chats[]> = {}

  chats.forEach((chat) => {
    if (chat.project_id) return

    if (!chat.updated_at) {
      todayChats.push(chat)
      return
    }

    let chatDate: Date
    try {
      chatDate = parseISO(chat.updated_at)
    } catch {
      chatDate = new Date(chat.updated_at)
    }

    const chatTimestamp = chatDate.getTime()

    if (chatTimestamp >= today) {
      todayChats.push(chat)
    } else if (chatTimestamp >= weekAgo) {
      last7DaysChats.push(chat)
    } else if (chatTimestamp >= monthAgo) {
      last30DaysChats.push(chat)
    } else if (chatTimestamp >= yearStart) {
      thisYearChats.push(chat)
    } else {
      const year = chatDate.getFullYear()
      if (!olderChats[year]) {
        olderChats[year] = []
      }
      olderChats[year].push(chat)
    }
  })

  const result: TimeGroup[] = []

  if (todayChats.length > 0) {
    result.push({ name: "Today", chats: todayChats })
  }

  if (last7DaysChats.length > 0) {
    result.push({ name: "Last 7 days", chats: last7DaysChats })
  }

  if (last30DaysChats.length > 0) {
    result.push({ name: "Last 30 days", chats: last30DaysChats })
  }

  if (thisYearChats.length > 0) {
    result.push({ name: "This year", chats: thisYearChats })
  }

  Object.entries(olderChats)
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
    .forEach(([year, yearChats]) => {
      result.push({ name: year, chats: yearChats })
    })

  return result
}

// Format date in a human-readable way
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "No date"

  let date: Date
  try {
    date = parseISO(dateString)
  } catch {
    date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid date"
  }

  const now = new Date()

  // Less than 1 minute: show "Just now"
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  if (diffMinutes < 1) return "Just now"

  // Less than 1 hour: show minutes
  if (diffMinutes < 60) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ru })
  }

  // Less than 24 hours: show hours
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  )
  if (diffHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ru })
  }

  // Less than 7 days: show days
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ru })
  }

  // Same year: show month and day
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "d MMMM", { locale: ru })
  }

  // Different year: show month, day and year
  return format(date, "d MMMM yyyy", { locale: ru })
}
