import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase не настроен" },
        { status: 500 }
      )
    }

    // Проверяем аутентификацию пользователя
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Получаем профиль пользователя для проверки роли
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "Профиль пользователя не найден" },
        { status: 404 }
      )
    }

    // Проверяем роль пользователя
    const userRole = (userProfile as any).role
    if (userRole !== "doctor") {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуется роль доктора." },
        { status: 403 }
      )
    }

    // Получаем текущего пользователя с полной информацией
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, display_name, username, email, staff_id, staff_name")
      .eq("id", user.id)
      .single()

    // Получаем список всех докторов (включая текущего)
    const { data: doctors, error: doctorsError } = await supabase
      .from("users")
      .select("id, display_name, username, email, staff_id, staff_name")
      .eq("role", "doctor")
      .order("display_name", { ascending: true })

    if (doctorsError) {
      console.error("Ошибка получения докторов:", doctorsError)
      return NextResponse.json(
        { error: "Ошибка получения данных докторов" },
        { status: 500 }
      )
    }

    // Форматируем данные для фронтенда
    const formattedDoctors = (doctors || []).map((doctor) => ({
      id: doctor.id,
      name:
        doctor.display_name || doctor.username || doctor.email || "Без имени",
      staff_id: doctor.staff_id,
      staff_name: doctor.staff_name,
    }))

    // Если текущий пользователь не в списке (маловероятно, но на всякий случай)
    if (currentUser && !formattedDoctors.find((d) => d.id === currentUser.id)) {
      formattedDoctors.unshift({
        id: currentUser.id,
        name:
          currentUser.display_name ||
          currentUser.username ||
          currentUser.email ||
          "Без имени",
        staff_id: currentUser.staff_id,
        staff_name: currentUser.staff_name,
      })
    }

    return NextResponse.json({ doctors: formattedDoctors })
  } catch (error) {
    console.error("Ошибка API докторов:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
