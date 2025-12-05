"use client"

import {
  PatientDetailsSheet,
  type Patient,
} from "@/app/components/doctors/patient-details-sheet"
import { PatientsDataTable } from "@/app/components/doctors/patients-data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export const DoctorsPageClient = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/patients")

        if (!response.ok) {
          if (response.status === 403) {
            setError("Доступ запрещен. Требуется роль доктора.")
            return
          }
          if (response.status === 401) {
            setError("Не авторизован. Пожалуйста, войдите в систему.")
            return
          }
          const errorData = await response.json().catch(() => ({}))
          setError(errorData.error || "Ошибка загрузки данных")
          return
        }

        const data = await response.json()
        setPatients(data.patients || [])
      } catch (err) {
        console.error("Ошибка загрузки пациентов:", err)
        setError("Произошла ошибка при загрузке данных")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsSheetOpen(true)
  }

  const handlePatientUpdate = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
    )
    setSelectedPatient(updatedPatient)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="border-destructive bg-destructive/10 rounded-lg border p-4">
          <h2 className="text-destructive mb-2 text-lg font-semibold">
            Ошибка
          </h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Пациенты</h1>
          <p className="text-muted-foreground">
            Управление информацией о пациентах
          </p>
        </div>

        {/* Таблица пациентов */}
        {patients.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">Нет пациентов</p>
          </div>
        ) : (
          <PatientsDataTable data={patients} onRowClick={handleRowClick} />
        )}

        {/* Боковая панель с деталями пациента */}
        <PatientDetailsSheet
          patient={selectedPatient}
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          onUpdate={handlePatientUpdate}
        />
      </div>
    </div>
  )
}
