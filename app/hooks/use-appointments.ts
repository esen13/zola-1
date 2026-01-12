import type {
  Appointment,
  AppointmentFilters,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/app/types/schedule.types"
import { useEffect, useState } from "react"

interface UseAppointmentsResult {
  appointments: Appointment[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export const useAppointments = (
  filters?: AppointmentFilters
): UseAppointmentsResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchAppointments = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters?.doctor_id) {
          params.append("doctor_id", filters.doctor_id)
        }
        if (filters?.patient_id) {
          params.append("patient_id", filters.patient_id)
        }
        if (filters?.start_date) {
          params.append("start_date", filters.start_date)
        }
        if (filters?.end_date) {
          params.append("end_date", filters.end_date)
        }
        if (filters?.status) {
          params.append("status", filters.status)
        }

        const response = await fetch(`/api/appointments?${params.toString()}`)

        if (cancelled) return

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Ошибка загрузки записей")
        }

        const data = await response.json()
        if (!cancelled) {
          setAppointments(data.appointments || [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Ошибка загрузки записей:", err)
          setError(
            err instanceof Error ? err.message : "Ошибка загрузки записей"
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchAppointments()

    return () => {
      cancelled = true
    }
  }, [
    filters?.doctor_id,
    filters?.patient_id,
    filters?.start_date,
    filters?.end_date,
    filters?.status,
  ])

  const refetch = async () => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (filters?.doctor_id) {
      params.append("doctor_id", filters.doctor_id)
    }
    if (filters?.patient_id) {
      params.append("patient_id", filters.patient_id)
    }
    if (filters?.start_date) {
      params.append("start_date", filters.start_date)
    }
    if (filters?.end_date) {
      params.append("end_date", filters.end_date)
    }
    if (filters?.status) {
      params.append("status", filters.status)
    }

    try {
      const response = await fetch(`/api/appointments?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка загрузки записей")
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (err) {
      console.error("Ошибка загрузки записей:", err)
      setError(err instanceof Error ? err.message : "Ошибка загрузки записей")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    appointments,
    isLoading,
    error,
    refetch,
  }
}

export const useCreateAppointment = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAppointment = async (
    input: CreateAppointmentInput
  ): Promise<Appointment | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка создания записи")
      }

      const data = await response.json()
      return data.appointment
    } catch (err) {
      console.error("Ошибка создания записи:", err)
      setError(err instanceof Error ? err.message : "Ошибка создания записи")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { createAppointment, isLoading, error }
}

export const useUpdateAppointment = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAppointment = async (
    appointmentId: string,
    input: UpdateAppointmentInput
  ): Promise<Appointment | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка обновления записи")
      }

      const data = await response.json()
      return data.appointment
    } catch (err) {
      console.error("Ошибка обновления записи:", err)
      setError(err instanceof Error ? err.message : "Ошибка обновления записи")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { updateAppointment, isLoading, error }
}

export const useDeleteAppointment = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAppointment = async (appointmentId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка удаления записи")
      }

      return true
    } catch (err) {
      console.error("Ошибка удаления записи:", err)
      setError(err instanceof Error ? err.message : "Ошибка удаления записи")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteAppointment, isLoading, error }
}
