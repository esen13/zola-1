import { createClient } from "@/lib/supabase/server"
import {
  canCreateAppointment,
  canViewAppointments,
  canViewAppointmentsAsPatient,
} from "@/lib/schedule/permissions"
import {
  checkTimeConflict,
  validateAppointmentTime,
  calculateEndTime,
} from "@/lib/schedule/validation"
import type { CreateAppointmentInput } from "@/app/types/schedule.types"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/appointments
 * Получение списка записей с фильтрацией
 */
export async function GET(request: NextRequest) {
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

    const userRole = (userProfile as any).role

    // Получаем параметры фильтрации из query string
    const searchParams = request.nextUrl.searchParams
    const doctorId = searchParams.get("doctor_id")
    const patientId = searchParams.get("patient_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const status = searchParams.get("status")

    // Определяем, какие записи может видеть пользователь
    let query = supabase.from("appointments").select(`
      *,
      doctor:users!appointments_doctor_id_fkey(id, display_name, username, email, staff_id, staff_name),
      patient:users!appointments_patient_id_fkey(id, display_name, username, email, phone_number)
    `)

    // Применяем фильтры в зависимости от роли
    if (userRole === "doctor") {
      // Доктор видит только свои записи
      query = query.eq("doctor_id", user.id)
    } else if (userRole === "patient" || userRole === "user") {
      // Пациент видит только свои записи
      query = query.eq("patient_id", user.id)
    } else if (userRole === "manager" || userRole === "moderator" || userRole === "admin") {
      // Manager/moderator/admin могут видеть все записи, но можно фильтровать по доктору
      if (doctorId) {
        query = query.eq("doctor_id", doctorId)
      }
    } else {
      return NextResponse.json(
        { error: "Доступ запрещен" },
        { status: 403 }
      )
    }

    // Фильтр по пациенту (для всех ролей)
    if (patientId) {
      query = query.eq("patient_id", patientId)
    }

    // Фильтр по датам
    if (startDate) {
      query = query.gte("starts_at", startDate)
    }
    if (endDate) {
      query = query.lte("starts_at", endDate)
    }

    // Фильтр по статусу
    if (status) {
      query = query.eq("status", status)
    }

    // Сортируем по времени начала
    query = query.order("starts_at", { ascending: true })

    const { data: appointments, error: appointmentsError } = await query

    if (appointmentsError) {
      console.error("Ошибка получения записей:", appointmentsError)
      return NextResponse.json(
        { error: "Ошибка получения данных записей" },
        { status: 500 }
      )
    }

    // Форматируем данные для фронтенда
    const formattedAppointments = (appointments || []).map((appointment: any) => ({
      id: appointment.id,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      created_by: appointment.created_by,
      doctor_id: appointment.doctor_id,
      patient_id: appointment.patient_id,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      status: appointment.status,
      notes: appointment.notes,
      title: appointment.title,
      label: appointment.label,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            name:
              appointment.doctor.display_name ||
              appointment.doctor.username ||
              appointment.doctor.email ||
              "Без имени",
            staff_id: appointment.doctor.staff_id,
            staff_name: appointment.doctor.staff_name,
          }
        : undefined,
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            full_name:
              appointment.patient.display_name ||
              appointment.patient.username ||
              "Без имени",
            email: appointment.patient.email,
            phone: appointment.patient.phone_number || null,
          }
        : undefined,
    }))

    return NextResponse.json({ appointments: formattedAppointments })
  } catch (error) {
    console.error("Ошибка API записей:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/appointments
 * Создание новой записи
 */
export async function POST(request: NextRequest) {
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

    const userRole = (userProfile as any).role

    // Парсим тело запроса
    const body = (await request.json()) as CreateAppointmentInput

    const {
      doctor_id,
      patient_id,
      starts_at,
      ends_at,
      status = "start",
      notes,
      title,
      label,
    } = body

    // Валидация обязательных полей
    if (!doctor_id || !patient_id || !starts_at) {
      return NextResponse.json(
        { error: "Не указаны обязательные поля: doctor_id, patient_id, starts_at" },
        { status: 400 }
      )
    }

    // Проверка прав на создание записи
    if (!canCreateAppointment(userRole, doctor_id, user.id)) {
      return NextResponse.json(
        { error: "Недостаточно прав для создания записи" },
        { status: 403 }
      )
    }

    // Вычисляем время окончания, если не указано
    const finalEndsAt = ends_at || calculateEndTime(starts_at, 30)

    // Валидация времени
    const timeValidation = validateAppointmentTime(starts_at, finalEndsAt)
    if (!timeValidation.valid) {
      return NextResponse.json(
        { error: timeValidation.error },
        { status: 400 }
      )
    }

    // Проверка конфликтов времени
    const conflictCheck = await checkTimeConflict(
      supabase,
      doctor_id,
      starts_at,
      finalEndsAt
    )

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        {
          error: "Время записи пересекается с существующей записью",
          conflictingAppointment: conflictCheck.conflictingAppointment,
        },
        { status: 409 }
      )
    }

    // Создаем запись
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        created_by: user.id,
        doctor_id,
        patient_id,
        starts_at,
        ends_at: finalEndsAt,
        status,
        notes: notes || null,
        title: title || null,
        label: label || null,
      })
      .select(`
        *,
        doctor:users!appointments_doctor_id_fkey(id, display_name, username, email, staff_id, staff_name),
        patient:users!appointments_patient_id_fkey(id, display_name, username, email, phone_number)
      `)
      .single()

    if (insertError) {
      console.error("Ошибка создания записи:", insertError)
      return NextResponse.json(
        { error: "Ошибка создания записи" },
        { status: 500 }
      )
    }

    // Форматируем ответ
    const formattedAppointment = {
      id: appointment.id,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      created_by: appointment.created_by,
      doctor_id: appointment.doctor_id,
      patient_id: appointment.patient_id,
      starts_at: appointment.starts_at,
      ends_at: appointment.ends_at,
      status: appointment.status,
      notes: appointment.notes,
      title: appointment.title,
      label: appointment.label,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            name:
              appointment.doctor.display_name ||
              appointment.doctor.username ||
              appointment.doctor.email ||
              "Без имени",
            staff_id: appointment.doctor.staff_id,
            staff_name: appointment.doctor.staff_name,
          }
        : undefined,
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            full_name:
              appointment.patient.display_name ||
              appointment.patient.username ||
              "Без имени",
            email: appointment.patient.email,
            phone: appointment.patient.phone_number || null,
          }
        : undefined,
    }

    return NextResponse.json({ appointment: formattedAppointment }, { status: 201 })
  } catch (error) {
    console.error("Ошибка создания записи:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}

