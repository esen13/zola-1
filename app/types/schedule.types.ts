export type UserRole =
  | "doctor"
  | "manager"
  | "moderator"
  | "admin"
  | "user"
  | "patient"

export type AppointmentStatus =
  | "booked"
  | "cancelled"
  | "completed"
  | "start"
  | "pause"
  | "reschedule"

export type CalendarView = "day" | "week" | "month"

export interface Appointment {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  doctor_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  notes: string | null
  title: string | null
  label: string | null
  // Joined data
  doctor?: {
    id: string
    name: string
    staff_id: number | null
    staff_name: string | null
  }
  patient?: {
    id: string
    full_name: string
    email: string
    phone: string | null
  }
}

export interface CreateAppointmentInput {
  doctor_id: string
  patient_id: string
  starts_at: string
  ends_at: string
  status?: AppointmentStatus
  notes?: string | null
  title?: string | null
  label?: string | null
}

export interface UpdateAppointmentInput {
  doctor_id?: string
  patient_id?: string
  starts_at?: string
  ends_at?: string
  status?: AppointmentStatus
  notes?: string | null
  title?: string | null
  label?: string | null
}

export interface AppointmentFilters {
  doctor_id?: string
  patient_id?: string
  start_date?: string
  end_date?: string
  status?: AppointmentStatus
}

