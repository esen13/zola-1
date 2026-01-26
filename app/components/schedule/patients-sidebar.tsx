"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { DatePicker } from "./date-picker"

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface PatientsSidebarProps {
  selectedPatientId: string | null
  onPatientSelect: (patientId: string | null) => void
  isInSheet?: boolean
}

export const PatientsSidebar = ({
  selectedPatientId,
  onPatientSelect,
  isInSheet = false,
}: PatientsSidebarProps) => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectAll, setSelectAll] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/patients")

        if (!response.ok) {
          // Если нет доступа к пациентам (например, для patient/user роли), просто не показываем список
          setPatients([])
          return
        }

        const data = await response.json()
        setPatients(data.patients || [])
        setFilteredPatients(data.patients || [])
      } catch (error) {
        console.error("Ошибка загрузки пациентов:", error)
        setPatients([])
        setFilteredPatients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatients()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = patients.filter(
      (patient) =>
        patient.full_name.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query) ||
        (patient.phone && patient.phone.toLowerCase().includes(query))
    )
    setFilteredPatients(filtered)
  }, [searchQuery, patients])

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      const allIds = new Set(filteredPatients.map((p) => p.id))
      setSelectedPatients(allIds)
      onPatientSelect(null) // Если выбраны все, сбрасываем фильтр
    } else {
      setSelectedPatients(new Set())
      onPatientSelect(null)
    }
  }

  const handlePatientToggle = (patientId: string, checked: boolean) => {
    const newSelected = new Set(selectedPatients)
    if (checked) {
      newSelected.add(patientId)
    } else {
      newSelected.delete(patientId)
    }
    setSelectedPatients(newSelected)
    setSelectAll(newSelected.size === filteredPatients.length)

    // Если выбран один пациент, устанавливаем фильтр
    if (newSelected.size === 1) {
      const singleId = Array.from(newSelected)[0]
      onPatientSelect(singleId)
    } else {
      onPatientSelect(null)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("bg-background p-4", !isInSheet && "w-80 border-l")}>
        <div className="text-muted-foreground text-sm">Загрузка...</div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-background flex h-full flex-col",
        !isInSheet && "w-80 border-l"
      )}
    >
      {/* Patients Section */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Пациенты</h2>
            <Button variant="ghost" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="cursor-pointer text-sm">
              Select all
            </label>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredPatients.map((patient) => {
              const isSelected = selectedPatients.has(patient.id)
              return (
                <div
                  key={patient.id}
                  className={cn(
                    "hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => handlePatientToggle(patient.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handlePatientToggle(patient.id, checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {patient.full_name}
                    </div>
                    {patient.phone && (
                      <div className="text-muted-foreground text-xs">
                        {patient.phone}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredPatients.length === 0 && (
              <div className="text-muted-foreground py-4 text-center text-sm">
                Пациенты не найдены
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
