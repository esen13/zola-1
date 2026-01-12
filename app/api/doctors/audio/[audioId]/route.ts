import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server-service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * PATCH /api/doctors/audio/[audioId]
 * Обновление транскрипции аудио записи
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ audioId: string }> }
) {
  try {
    const { audioId } = await params
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
    if (userRole !== "doctor" && userRole !== "admin") {
      return NextResponse.json(
        {
          error: "Доступ запрещен. Требуется роль доктора или администратора.",
        },
        { status: 403 }
      )
    }

    // Получаем данные из запроса
    const body = await request.json()
    const { transcribe_text, final_text } = body

    // Валидация: хотя бы одно поле должно быть обновлено
    if (transcribe_text === undefined && final_text === undefined) {
      return NextResponse.json(
        { error: "Необходимо указать хотя бы одно поле для обновления" },
        { status: 400 }
      )
    }

    // Используем service role клиент для обновления
    const serviceClient = createServiceRoleClient()
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service client не настроен" },
        { status: 500 }
      )
    }

    // Проверяем, что запись существует и принадлежит текущему пользователю
    const { data: existingRecord, error: checkError } = await serviceClient
      .from("users_audio")
      .select("user_id")
      .eq("id", audioId)
      .single()

    if (checkError || !existingRecord) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
    }

    if (existingRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Подготавливаем данные для обновления
    const updateData: {
      transcribe_text?: string | null
      final_text?: string | null
    } = {}
    if (transcribe_text !== undefined) {
      updateData.transcribe_text = transcribe_text || null
    }
    if (final_text !== undefined) {
      updateData.final_text = final_text || null
    }

    // Обновляем запись
    const { data: updatedRecord, error: updateError } = await serviceClient
      .from("users_audio")
      .update(updateData)
      .eq("id", audioId)
      .select()
      .single()

    if (updateError) {
      console.error("Ошибка обновления транскрипции:", updateError)
      return NextResponse.json(
        { error: `Ошибка обновления данных: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      audio: updatedRecord,
    })
  } catch (error) {
    console.error("Ошибка API обновления транскрипции:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
