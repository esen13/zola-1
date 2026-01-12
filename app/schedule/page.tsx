import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SchedulePageClient } from "./schedule-page-client"

export const dynamic = "force-dynamic"

export default async function SchedulePage() {
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
  // Разрешаем доступ для doctor, manager, moderator, admin, patient, user
  const userRole = (userProfile as any).role
  const allowedRoles = ["doctor", "manager", "moderator", "admin", "patient", "user"]

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Если роль не разрешена, перенаправляем на главную страницу
    redirect("/")
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <SchedulePageClient />
      </LayoutApp>
    </MessagesProvider>
  )
}

