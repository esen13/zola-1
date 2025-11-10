/**
 * Парсит варианты ответов (quick replies) из текста сообщения ассистента.
 * Поддерживает следующие форматы:
 * - Варианты в скобках: "В какой области (верх живота, грудная клетка, спина)?"
 * - Пары через "или": "Боль становится сильнее или слабее?"
 * - Списки через запятые или "или"
 *
 * @param text - Текст сообщения ассистента
 * @returns Массив уникальных вариантов (до 8 штук)
 */
export function parseQuickReplies(text: string): string[] {
  if (!text || typeof text !== "string") {
    return []
  }

  const variants: Set<string> = new Set()

  // 1. Парсинг вариантов в скобках: (вариант1, вариант2, вариант3)
  const bracketPattern = /\(([^)]+)\)/g
  let match
  while ((match = bracketPattern.exec(text)) !== null) {
    const content = match[1].trim()
    if (content) {
      // Разделяем по запятым или "или"
      const items = splitVariants(content)
      items.forEach((item) => {
        const cleaned = cleanVariant(item)
        if (cleaned && isValidVariant(cleaned)) {
          variants.add(cleaned)
        }
      })
    }
  }

  // 2. Парсинг пар через "или": "сильнее или слабее"
  // Ищем паттерны вида: "фраза1 или фраза2" (не в скобках)
  // Используем более точный паттерн для извлечения полных фраз
  const orPattern = /([^()]+?)\s+или\s+([^()]+?)(?:\s|$|[.,!?;:]|\))/gi
  let orMatch
  const processedRanges: Array<{ start: number; end: number }> = []

  while ((orMatch = orPattern.exec(text)) !== null) {
    const matchStart = orMatch.index
    const matchEnd = matchStart + orMatch[0].length

    // Проверяем, что это не часть скобок
    const beforeBracket = text.lastIndexOf("(", matchStart)
    const afterBracket = text.indexOf(")", matchEnd)
    const isInsideBrackets =
      beforeBracket !== -1 &&
      afterBracket !== -1 &&
      beforeBracket < matchStart &&
      afterBracket > matchEnd

    // Проверяем, что мы не обрабатывали этот участок текста
    const isOverlapping = processedRanges.some(
      (range) => matchStart < range.end && matchEnd > range.start
    )

    // Пропускаем, если в тексте до или после "или" есть "ли"
    const beforeOr = orMatch[1].trim()
    const afterOr = orMatch[2].trim()
    const containsLi = /ли/i.test(beforeOr) || /ли/i.test(afterOr)

    if (!isInsideBrackets && !isOverlapping && !containsLi) {
      let cleanedBeforeOr = beforeOr

      // Убираем служебные слова в конце перед "или"
      cleanedBeforeOr = cleanedBeforeOr.replace(
        /\s+(ли|есть|какие-то|какие\s+то|например|вроде|типа|как\s+то|в\s+виде|вроде\s+как)\s*$/i,
        ""
      )

      // Извлекаем последнюю фразу перед "или" (до 2 слов, максимум)
      const beforeWords = cleanedBeforeOr.split(/\s+/)
      const beforePhrase =
        beforeWords.length <= 2
          ? beforeWords.join(" ")
          : beforeWords.slice(-2).join(" ")

      // Берем первые 1-2 слова после "или"
      const afterWords = afterOr.split(/\s+/)
      const afterPhrase =
        afterWords.length <= 2
          ? afterWords.join(" ")
          : afterWords.slice(0, 2).join(" ")

      const cleaned1 = cleanVariant(beforePhrase)
      const cleaned2 = cleanVariant(afterPhrase)

      if (cleaned1 && isValidVariant(cleaned1)) {
        variants.add(cleaned1)
      }
      if (cleaned2 && isValidVariant(cleaned2)) {
        variants.add(cleaned2)
      }

      processedRanges.push({ start: matchStart, end: matchEnd })
    }
  }

  // 3. Парсинг списков через запятые в конце предложения
  // Ищем паттерны вида: "вариант1, вариант2, вариант3?"
  const listPattern = /([^.?]+?)\s*[?]?\s*$/g
  const listMatch = listPattern.exec(text.trim())
  if (listMatch) {
    const potentialList = listMatch[1].trim()
    // Проверяем, что это не часть скобок
    if (!potentialList.includes("(") && potentialList.includes(",")) {
      const items = splitVariants(potentialList)
      // Берем только если есть 2+ варианта
      if (items.length >= 2) {
        items.forEach((item) => {
          const cleaned = cleanVariant(item)
          if (cleaned && isValidVariant(cleaned)) {
            variants.add(cleaned)
          }
        })
      }
    }
  }

  // Ограничиваем до 8 уникальных значений и фильтруем
  // Используем Map для нормализации (приводим к нижнему регистру для сравнения)
  const normalizedMap = new Map<string, string>()

  for (const variant of variants) {
    if (isValidVariant(variant)) {
      const normalized = variant.toLowerCase().trim()
      // Сохраняем оригинальный вариант (с правильным регистром)
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, variant)
      }
    }
  }

  const result = Array.from(normalizedMap.values()).slice(0, 8)

  return result
}

/**
 * Разделяет строку на варианты по запятым или "или"
 */
function splitVariants(text: string): string[] {
  // Сначала разделяем по запятым
  const byComma = text.split(",").map((s) => s.trim())

  // Затем для каждого элемента проверяем наличие "или"
  const result: string[] = []
  for (const item of byComma) {
    if (item.includes(" или ")) {
      const byOr = item.split(/\s+или\s+/).map((s) => s.trim())
      result.push(...byOr)
    } else {
      result.push(item)
    }
  }

  return result.filter((s) => s.length > 0)
}

/**
 * Очищает вариант от лишних символов и форматирует
 */
function cleanVariant(variant: string): string {
  if (!variant) return ""

  let cleaned = variant
    .trim()
    .replace(/^[.,!?;:\s]+|[.,!?;:\s]+$/g, "") // Убираем пунктуацию с краев
    .replace(/\s+/g, " ") // Нормализуем пробелы
    .trim()

  // Убираем служебные слова и фразы в начале
  const stopWords = [
    /^ли\s+/i,
    /^есть\s+ли\s+/i,
    /^какие-то\s+/i,
    /^какие\s+то\s+/i,
    /^например\s+/i,
    /^вроде\s+/i,
    /^типа\s+/i,
    /^как\s+то\s+/i,
    /^в\s+виде\s+/i,
    /^вроде\s+как\s+/i,
  ]

  for (const pattern of stopWords) {
    cleaned = cleaned.replace(pattern, "")
  }

  // Убираем "ли" в середине фразы (например, "ли боль" -> "боль")
  cleaned = cleaned.replace(/\s+ли\s+/i, " ")
  cleaned = cleaned.replace(/^ли\s+/i, "")

  return cleaned.trim()
}

/**
 * Проверяет, является ли фраза вопросом или слишком длинной
 */
function isValidVariant(variant: string): boolean {
  if (!variant || variant.length < 2 || variant.length > 40) {
    return false
  }

  // Исключаем фразы, которые являются вопросами
  const questionPatterns = [
    /ли/i, // Исключаем все фразы, содержащие "ли" в любом месте
    /есть\s+ли/i,
    /какие-то/i,
    /какие\s+то/i,
    /какой/i,
    /какая/i,
    /какое/i,
    /какие/i,
    /что\s+то/i,
    /что-то/i,
    /как\s+то/i,
    /как-то/i,
    /сопутствующие\s+симптомы/i,
    /симптомы/i,
    /например/i,
  ]

  for (const pattern of questionPatterns) {
    if (pattern.test(variant)) {
      return false
    }
  }

  // Исключаем слишком длинные фразы (более 4 слов обычно не вариант ответа)
  const wordCount = variant.split(/\s+/).length
  if (wordCount > 4) {
    return false
  }

  // Исключаем фразы, состоящие только из пунктуации и пробелов
  if (!variant.match(/[а-яёa-z]/i)) {
    return false
  }

  return true
}
