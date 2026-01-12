import type { Appointment, UserRole } from "@/app/types/schedule.types"

/**
 * Проверяет, может ли пользователь просматривать записи для указанного доктора
 */
export const canViewAppointments = (
  userRole: UserRole | null | undefined,
  doctorId: string | null | undefined,
  currentUserId: string
): boolean => {
  if (!userRole) return false

  // Manager, moderator, admin могут видеть все записи
  if (
    userRole === "manager" ||
    userRole === "moderator" ||
    userRole === "admin"
  ) {
    return true
  }

  // Doctor может видеть только свои записи
  if (userRole === "doctor") {
    return doctorId === currentUserId
  }

  // Patient/user может видеть только свои записи (как пациент)
  if (userRole === "patient" || userRole === "user") {
    // Для patient/user проверка будет по patient_id, не doctor_id
    return false
  }

  return false
}

/**
 * Проверяет, может ли пользователь создавать записи для указанного доктора
 */
export const canCreateAppointment = (
  userRole: UserRole | null | undefined,
  doctorId: string,
  currentUserId: string
): boolean => {
  if (!userRole) return false

  console.log("canCreateAppointment", userRole, doctorId, currentUserId)

  // Doctor может создавать записи только для себя
  if (userRole === "doctor") {
    return doctorId === currentUserId
  }

  // Manager, moderator, admin могут создавать записи для любого доктора
  if (
    userRole === "manager" ||
    userRole === "moderator" ||
    userRole === "admin"
  ) {
    return true
  }

  // Patient/user не могут создавать записи
  return false
}

/**
 * Проверяет, может ли пользователь редактировать запись
 */
export const canEditAppointment = (
  userRole: UserRole | null | undefined,
  appointment: Appointment,
  currentUserId: string
): boolean => {
  if (!userRole) return false

  // Doctor может редактировать только свои записи или записи, которые он создал
  if (userRole === "doctor") {
    return (
      appointment.doctor_id === currentUserId ||
      appointment.created_by === currentUserId
    )
  }
  // Manager, moderator, admin могут редактировать любые записи
  if (
    userRole === "manager" ||
    userRole === "moderator" ||
    userRole === "admin"
  ) {
    return true
  }

  // Patient/user не могут редактировать записи
  return false
}

/**
 * Проверяет, может ли пользователь удалять запись
 */
export const canDeleteAppointment = (
  userRole: UserRole | null | undefined,
  appointment: Appointment,
  currentUserId: string
): boolean => {
  if (!userRole) return false

  // Doctor может удалять только свои записи или записи, которые он создал
  if (userRole === "doctor") {
    return (
      appointment.doctor_id === currentUserId ||
      appointment.created_by === currentUserId
    )
  }
  // Manager, moderator, admin могут удалять любые записи
  if (
    userRole === "manager" ||
    userRole === "moderator" ||
    userRole === "admin"
  ) {
    return true
  }

  // Patient/user не могут удалять записи
  return false
}

/**
 * Проверяет, может ли пользователь просматривать записи как пациент
 */
export const canViewAppointmentsAsPatient = (
  userRole: UserRole | null | undefined,
  patientId: string | null | undefined,
  currentUserId: string
): boolean => {
  if (!userRole) return false

  // Patient/user может видеть только свои записи
  if (userRole === "patient" || userRole === "user") {
    return patientId === currentUserId
  }

  // Остальные роли не используют этот метод
  return false
}
