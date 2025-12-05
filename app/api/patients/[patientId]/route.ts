import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params
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

    // Парсим тело запроса
    const body = await request.json()
    const { staff_id, staff_name, preliminary_diagnosis } = body

    // Подготавливаем объект обновления
    const updateData: any = {}

    if (staff_id !== undefined) {
      updateData.staff_id = staff_id
    }

    if (staff_name !== undefined) {
      updateData.staff_name = staff_name
    }

    if (preliminary_diagnosis !== undefined) {
      updateData.preliminary_diagnosis = preliminary_diagnosis
    }

    // Обновляем данные пациента
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", patientId)
      .select("id, staff_id, staff_name, preliminary_diagnosis")
      .single()

    if (error) {
      console.error("Ошибка обновления пациента:", error)
      return NextResponse.json(
        { error: "Ошибка обновления данных пациента" },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      patient: {
        staff_id: data.staff_id,
        staff_name: data.staff_name,
        preliminary_diagnosis: data.preliminary_diagnosis,
      },
    })
  } catch (error) {
    console.error("Ошибка API обновления пациента:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
