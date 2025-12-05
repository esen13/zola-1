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
    // Предполагаем, что роль хранится в поле role таблицы users
    // Если роли нет, считаем что это не доктор
    const userRole = (userProfile as any).role
    if (userRole !== "doctor") {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуется роль доктора." },
        { status: 403 }
      )
    }

    // Получаем список пациентов
    // Предполагаем, что пациенты - это пользователи с role = "patient" или без роли (не докторы)
    const { data: patients, error: patientsError } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        display_name,
        created_at,
        anonymous,
        premium,
        last_active_at,
        role,
        phone_number,
        date_of_birth,
        gender,
        username,
        chat_status,
        staff_name,
        staff_id,
        company_name,
        preliminary_diagnosis
      `
      )
      .neq("id", user.id) // Исключаем текущего пользователя
      .order("created_at", { ascending: false })

    if (patientsError) {
      console.error("Ошибка получения пациентов:", patientsError)
      return NextResponse.json(
        { error: "Ошибка получения данных пациентов" },
        { status: 500 }
      )
    }

    // Форматируем данные для фронтенда
    const formattedPatients = (patients || []).map((patient) => ({
      id: patient.id,
      full_name: patient.display_name || patient.username || "Без имени",
      email: patient.email,
      phone: patient.phone_number || null,
      date_of_birth: patient.date_of_birth || null,
      gender: patient.gender || null,
      created_at: patient.created_at,
      updated_at: patient.last_active_at || patient.created_at,
      anonymous: patient.anonymous,
      premium: patient.premium,
      chat_status: patient.chat_status || null,
      staff_name: patient.staff_name || null,
      staff_id: patient.staff_id || null,
      company_name: patient.company_name || null,
      preliminary_diagnosis: patient.preliminary_diagnosis || null,
    }))

    return NextResponse.json({ patients: formattedPatients })
  } catch (error) {
    console.error("Ошибка API пациентов:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
