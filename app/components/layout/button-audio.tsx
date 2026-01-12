"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/lib/user-store/provider"
import { Mic } from "lucide-react"
import Link from "next/link"

export function ButtonAudio() {
  const { user } = useUser()
  const isDoctor = user?.role === "doctor"
  const isAdmin = user?.role === "admin"
  if (!isDoctor && !isAdmin) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/doctors/audio"
          className="text-muted-foreground hover:text-foreground hover:bg-muted bg-background rounded-full p-1.5 transition-colors"
          prefetch
          aria-label="Аудио записи"
        >
          <Mic size={18} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>Аудио записи</TooltipContent>
    </Tooltip>
  )
}
