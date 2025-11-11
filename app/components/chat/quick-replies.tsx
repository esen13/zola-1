"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QuickRepliesProps = {
  replies: string[]
  onSelect: (reply: string) => void
  disabled?: boolean
  className?: string
}

export function QuickReplies({
  replies,
  onSelect,
  disabled = false,
  className,
}: QuickRepliesProps) {
  if (!replies || replies.length === 0) {
    return null
  }

  const handleClick = (reply: string) => {
    if (disabled) return
    onSelect(reply)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    reply: string
  ) => {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(reply)
    }
  }

  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", className)}>
      {replies.map((reply, index) => (
        <Button
          key={`${reply}-${index}`}
          // initial={{ opacity: 0, scale: 0.9 }}
          // animate={{ opacity: disabled ? 0.5 : 1, scale: 1 }}
          // transition={{ delay: index * 0.05, duration: 0.2 }}
          className={cn(
            "border-border rounded-full font-normal",
            disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-info-foreground hover:bg-info-foreground/50 active:bg-info-foreground/80 border-info/20 text-info cursor-pointer transition-colors duration-200"
          )}
          variant="secondary"
          size="sm"
          onClick={() => handleClick(reply)}
          onKeyDown={(e) => handleKeyDown(e, reply)}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          aria-label={
            disabled ? `Ответ недоступен: ${reply}` : `Выбрать ответ: ${reply}`
          }
          aria-disabled={disabled}
          type="button"
        >
          {reply}
        </Button>
      ))}
    </div>
  )
}
