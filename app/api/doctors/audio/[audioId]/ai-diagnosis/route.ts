import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server-service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const N8N_WEBHOOK_URL =
  "https://esen.app.n8n.cloud/webhook/64378039-bfe3-4e69-9f1b-4726fabb73d2"

/**
 * POST /api/doctors/audio/[audioId]/ai-diagnosis
 * Генерация AI отчета предварительного диагноза
 */
export async function POST(
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

    // Используем service role клиент для получения данных аудио
    const serviceClient = createServiceRoleClient()
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service client не настроен" },
        { status: 500 }
      )
    }

    // Получаем данные аудио записи
    const { data: audioRecord, error: audioError } = await serviceClient
      .from("users_audio")
      .select("user_id, audio_filename")
      .eq("id", audioId)
      .single()

    if (audioError || !audioRecord) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
    }

    // Проверяем, что запись принадлежит текущему пользователю
    if (audioRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Отправляем запрос на webhook
    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: audioRecord.user_id,
          audio_filename: audioRecord.audio_filename,
        }),
      })

      if (!webhookResponse.ok) {
        console.error(
          "Ошибка webhook:",
          webhookResponse.status,
          webhookResponse.statusText
        )
        return NextResponse.json(
          { error: "Ошибка получения AI диагноза от сервиса" },
          { status: 500 }
        )
      }

      // Получаем ответ от webhook (ожидаем строку)
      const aiDiagnosis = await webhookResponse.text()

      return NextResponse.json({
        success: true,
        ai_diagnoses: aiDiagnosis,
      })
    } catch (webhookError) {
      console.error("Ошибка отправки запроса на webhook:", webhookError)
      return NextResponse.json(
        {
          error:
            webhookError instanceof Error
              ? webhookError.message
              : "Ошибка соединения с сервисом AI",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Ошибка API генерации AI диагноза:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
