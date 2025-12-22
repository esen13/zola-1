import { MedicalPdfDocument } from "@/app/components/doctors/medical-pdf-document"
import { pdf } from "@react-pdf/renderer"

type AudioRecord = {
  id: string
  user_id: string
  audio_filename: string
  file_path: string
  created_at: string | null
  signed_url: string | null
  transcribe_text?: string | null
  final_text?: string | null
}

/**
 * Генерирует и скачивает PDF документ с медицинским шаблоном
 */
export const generateMedicalPDF = async (
  finalText: string,
  audioRecord: AudioRecord,
  doctorName?: string
): Promise<void> => {
  try {
    // Создаем PDF документ
    const doc = (
      <MedicalPdfDocument
        finalText={finalText}
        audioRecord={audioRecord}
        doctorName={doctorName}
      />
    )

    // Рендерим в Blob
    const blob = await pdf(doc).toBlob()

    // Создаем URL для скачивания
    const url = URL.createObjectURL(blob)

    // Генерируем имя файла
    const fileName = `medical-report-${audioRecord.audio_filename.replace(
      ".webm",
      ""
    )}.pdf`

    // Создаем ссылку и скачиваем
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Освобождаем память
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Ошибка генерации PDF:", error)
    throw new Error("Не удалось создать PDF документ")
  }
}
