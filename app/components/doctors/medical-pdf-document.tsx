import { formatDateTime } from "@/lib/utils/date"
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

// Регистрируем шрифт с поддержкой кириллицы
// Используем шрифт из Google Fonts через CDN
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
      fontWeight: 300,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
})

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

type MedicalPdfDocumentProps = {
  finalText: string
  audioRecord: AudioRecord
  doctorName?: string
}

// Стили для PDF документа
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Roboto",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #000000",
    paddingBottom: 10,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  clinicInfo: {
    fontSize: 9,
    marginBottom: 2,
    color: "#333333",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    marginBottom: 8,
    color: "#333333",
  },
  content: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 10,
    color: "#000000",
  },
  paragraph: {
    marginBottom: 8,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: "1 solid #cccccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  signature: {
    fontSize: 10,
  },
  doctorName: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 30,
  },
  stamp: {
    width: 80,
    height: 80,
  },
})

export const MedicalPdfDocument = ({
  finalText,
  audioRecord,
  doctorName,
}: MedicalPdfDocumentProps) => {
  // Разбиваем текст на абзацы
  const paragraphs = finalText.split("\n").filter((p) => p.trim().length > 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Заголовок клиники */}
        <View style={styles.header}>
          <Text style={styles.clinicName}>Airis - Медицинский ассистент</Text>
          <Text style={styles.clinicInfo}>Лицензия НГМУ 4151</Text>
          <Text style={styles.clinicInfo}>г. Бишкек, Аалы Токомбаева 9А</Text>
          <Text style={styles.clinicInfo}>+996 772 207 999</Text>
        </View>

        {/* Информация о записи */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация о записи</Text>
          <View>
            <Text style={styles.label}>Дата обращения:</Text>
            <Text style={styles.value}>
              {formatDateTime(audioRecord.created_at)}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Номер записи:</Text>
            <Text style={styles.value}>{audioRecord.audio_filename}</Text>
          </View>
        </View>

        {/* Основной контент */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Медицинское заключение</Text>
          <View style={styles.content}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph.trim()}
              </Text>
            ))}
          </View>
        </View>

        {/* Подпись и печать */}
        <View style={styles.footer}>
          <View>
            {doctorName && (
              <Text style={styles.doctorName}>Врач: {doctorName}</Text>
            )}
          </View>
          <View>
            <Image src="/logo/airis-stamp.webp" style={styles.stamp} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
