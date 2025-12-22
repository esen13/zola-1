import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server-service"
import { generateAudioFilename, validateAudioFile } from "@/lib/utils/audio"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const N8N_WEBHOOK_URL =
  "https://esen.app.n8n.cloud/webhook-test/483b4361-5907-4712-9faf-074f1a8cb881"

/**
 * POST /api/doctors/audio
 * Загрузка аудио файла доктора
 */
export async function POST(request: Request) {
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
      .select("role, username, email")
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

    // Получаем FormData
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "Аудио файл не предоставлен" },
        { status: 400 }
      )
    }

    // Валидация файла
    const validation = validateAudioFile(audioFile)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Невалидный файл" },
        { status: 400 }
      )
    }

    // Генерируем имя файла
    const audioFilename = generateAudioFilename({
      username: userProfile.username,
      email: userProfile.email,
    })

    // Путь в storage: {user_id}/{audio_filename}
    const filePath = `${user.id}/${audioFilename}`

    // Используем service role клиент для операций записи (обходит RLS)
    const serviceClient = createServiceRoleClient()
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service client не настроен" },
        { status: 500 }
      )
    }

    // Загружаем файл в Supabase Storage (private bucket)
    const { error: uploadError } = await serviceClient.storage
      .from("audio_file_doctors")
      .upload(filePath, audioFile, {
        contentType: audioFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Ошибка загрузки аудио:", uploadError)
      return NextResponse.json(
        { error: `Ошибка загрузки файла: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Создаем signed URL для доступа к файлу
    const { data: signedUrlData, error: signedUrlError } =
      await serviceClient.storage
        .from("audio_file_doctors")
        .createSignedUrl(filePath, 93600) // 93600 секунд = 26 часов

    if (signedUrlError) {
      console.error("Ошибка создания signed URL:", signedUrlError)
    }

    // Сохраняем метаданные в базу данных используя service role клиент
    const { data: audioRecord, error: dbError } = await serviceClient
      .from("users_audio")
      .insert({
        user_id: user.id,
        audio_filename: audioFilename,
        file_path: filePath,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Ошибка сохранения в БД:", dbError)
      // Пытаемся удалить загруженный файл при ошибке БД
      await serviceClient.storage.from("audio_file_doctors").remove([filePath])
      return NextResponse.json(
        { error: `Ошибка сохранения данных: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Отправляем данные в n8n webhook (не блокируем при ошибке)
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          audio_filename: audioFilename,
          file_path: filePath,
          signed_url: signedUrlData?.signedUrl || null,
          created_at: audioRecord.created_at,
        }),
      })
    } catch (webhookError) {
      // Логируем ошибку, но не прерываем выполнение
      console.error("Ошибка отправки в n8n webhook:", webhookError)
    }

    return NextResponse.json({
      success: true,
      audio: {
        id: audioRecord.id,
        audio_filename: audioRecord.audio_filename,
        file_path: audioRecord.file_path,
        created_at: audioRecord.created_at,
        signed_url: signedUrlData?.signedUrl || null,
      },
    })
  } catch (error) {
    console.error("Ошибка API загрузки аудио:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/doctors/audio
 * Получение списка аудио записей доктора
 */
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

    // Получаем список аудио записей текущего доктора
    const { data: audioRecords, error: audioError } = await supabase
      .from("users_audio")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (audioError) {
      console.error("Ошибка получения аудио записей:", audioError)
      return NextResponse.json(
        { error: "Ошибка получения данных" },
        { status: 500 }
      )
    }

    // Создаем signed URLs для каждого файла
    const audioWithUrls = await Promise.all(
      (audioRecords || []).map(async (record) => {
        const { data: signedUrlData } = await supabase.storage
          .from("audio_file_doctors")
          .createSignedUrl(record.file_path, 3600) // 1 час

        return {
          ...record,
          signed_url: signedUrlData?.signedUrl || null,
        }
      })
    )

    return NextResponse.json({ audio: audioWithUrls })
  } catch (error) {
    console.error("Ошибка API получения аудио:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
