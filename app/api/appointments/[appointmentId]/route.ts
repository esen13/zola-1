import type { UpdateAppointmentInput } from "@/app/types/schedule.types"
import {
  canDeleteAppointment,
  canEditAppointment,
} from "@/lib/schedule/permissions"
import {
  checkTimeConflict,
  validateAppointmentTime,
} from "@/lib/schedule/validation"
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * PUT /api/appointments/[appointmentId]
 * Обновление записи
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
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

    // Получаем существующую запись
    const { data: existingAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
    }

    // Проверка прав на редактирование
    if (!canEditAppointment(userRole, existingAppointment as any, user.id)) {
      return NextResponse.json(
        { error: "Недостаточно прав для редактирования записи" },
        { status: 403 }
      )
    }

    // Парсим тело запроса
    const body = (await request.json()) as UpdateAppointmentInput

    const {
      doctor_id,
      patient_id,
      starts_at,
      ends_at,
      status,
      notes,
      title,
      label,
    } = body

    // Подготавливаем данные для обновления
    const updateData: any = {}

    if (doctor_id !== undefined) {
      // Проверяем права на изменение доктора
      if (
        userRole !== "manager" &&
        userRole !== "moderator" &&
        userRole !== "admin"
      ) {
        return NextResponse.json(
          { error: "Недостаточно прав для изменения доктора" },
          { status: 403 }
        )
      }
      updateData.doctor_id = doctor_id
    }

    if (patient_id !== undefined) {
      updateData.patient_id = patient_id
    }

    if (starts_at !== undefined) {
      updateData.starts_at = starts_at
    }

    if (ends_at !== undefined) {
      updateData.ends_at = ends_at
    }

    if (status !== undefined) {
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (title !== undefined) {
      updateData.title = title
    }

    if (label !== undefined) {
      updateData.label = label
    }

    // Валидация времени, если изменилось
    const finalStartsAt = starts_at || existingAppointment.starts_at
    const finalEndsAt = ends_at || existingAppointment.ends_at
    const finalDoctorId = doctor_id || existingAppointment.doctor_id

    if (starts_at || ends_at) {
      const timeValidation = validateAppointmentTime(finalStartsAt, finalEndsAt)
      if (!timeValidation.valid) {
        return NextResponse.json(
          { error: timeValidation.error },
          { status: 400 }
        )
      }
    }

    // Проверка конфликтов времени, если изменилось время или доктор
    if (starts_at || ends_at || doctor_id) {
      const conflictCheck = await checkTimeConflict(
        supabase,
        finalDoctorId,
        finalStartsAt,
        finalEndsAt,
        appointmentId
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
    }

    // Обновляем запись
    const { data: appointment, error: updateError } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId)
      .select(
        `
        *,
        doctor:users!doctor_id(id, display_name, username, email, staff_id, staff_name),
        patient:users!patient_id(id, display_name, username, email, phone_number)
      `
      )
      .single()

    if (updateError) {
      console.error("Ошибка обновления записи:", updateError)
      return NextResponse.json(
        { error: "Ошибка обновления записи" },
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

    return NextResponse.json({ appointment: formattedAppointment })
  } catch (error) {
    console.error("Ошибка обновления записи:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/appointments/[appointmentId]
 * Удаление записи
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
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

    // Получаем существующую запись
    const { data: existingAppointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()

    if (fetchError || !existingAppointment) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 })
    }

    // Проверка прав на удаление
    if (!canDeleteAppointment(userRole, existingAppointment as any, user.id)) {
      return NextResponse.json(
        { error: "Недостаточно прав для удаления записи" },
        { status: 403 }
      )
    }

    // Удаляем запись
    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId)

    if (deleteError) {
      console.error("Ошибка удаления записи:", deleteError)
      return NextResponse.json(
        { error: "Ошибка удаления записи" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка удаления записи:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
