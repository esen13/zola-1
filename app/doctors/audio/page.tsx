import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AudioPageClient } from "./audio-page-client"

export const dynamic = "force-dynamic"

export default async function AudioPage() {
  const supabase = await createClient()
  if (!supabase) {
    redirect("/")
  }

  // Проверяем аутентификацию пользователя
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/")
  }

  // Получаем профиль пользователя для проверки роли
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !userProfile) {
    redirect("/")
  }

  // Проверяем роль пользователя
  const userRole = (userProfile as any).role
  if (userRole !== "doctor" && userRole !== "admin") {
    // Если роль не доктор, перенаправляем на главную страницу чата
    redirect("/")
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <AudioPageClient />
      </LayoutApp>
    </MessagesProvider>
  )
}
