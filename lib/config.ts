import {
  Brain,
  Ear,
  FaceMask,
  IntersectThree,
  SmileySad,
  Thermometer,
} from "@phosphor-icons/react/dist/ssr"

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5
export const AUTH_DAILY_MESSAGE_LIMIT = 1000
export const REMAINING_QUERY_ALERT_THRESHOLD = 2
export const DAILY_FILE_UPLOAD_LIMIT = 5
export const DAILY_LIMIT_PRO_MODELS = 500

export const NON_AUTH_ALLOWED_MODELS = ["gpt-4.1-nano"]

export const FREE_MODELS_IDS = [
  "openrouter:deepseek/deepseek-r1:free",
  "openrouter:meta-llama/llama-3.3-8b-instruct:free",
  "pixtral-large-latest",
  "mistral-large-latest",
  "gpt-4.1-nano",
]

export const MODEL_DEFAULT = "gpt-4.1-nano"

export const APP_NAME = "Airis"
export const APP_DOMAIN = "https://airi.one"

export const SUGGESTIONS = [
  {
    label: "Боли в животе",
    highlight: "Боли в животе",
    prompt: `у меня боли в животе`,
    items: [
      "У меня болит живот, что делать?",
      "Отравление",
      "Скажите, что делать, если у меня болит живот",
    ],
    icon: IntersectThree,
  },
  {
    label: "Температура выше 38",
    highlight: "Температура выше 38",
    prompt: `Температура выше 38`,
    items: [
      "Скажите, что делать, если у меня температура выше 38",
      "Что делать, если у меня температура выше 38",
      "Озноб",
    ],
    icon: Thermometer,
  },
  {
    label: "Головная боль",
    highlight: "Головная боль",
    prompt: `Головная боль`,
    items: [
      "Скажите, что делать, если у меня головная боль",
      "Что делать, если у меня головная боль",
      "Мигрень",
    ],
    icon: Brain,
  },
  {
    label: "Боль в горле",
    highlight: "Боль в горле",
    prompt: `Боль в горле`,
    items: [
      "Скажите, что делать, если у меня боль в горле",
      "Что делать, если у меня боль в горле",
      "Ангина",
    ],
    icon: FaceMask,
  },
  {
    label: "Боль в ушах",
    highlight: "Боль в ушах",
    prompt: `Боль в ушах`,
    items: [
      "Скажите, что делать, если у меня боль в ушах",
      "Что делать, если у меня боль в ушах",
      "Гайморит",
    ],
    icon: Ear,
  },
  {
    label: "Боль в спине",
    highlight: "Боль в спине",
    prompt: `Боль в спине`,
    items: [
      "Скажите, что делать, если у меня боль в спине",
      "Что делать, если у меня боль в спине",
      "Грыжа",
      "Поясница болит",
    ],
    icon: Brain,
  },
  {
    label: "Усталость",
    highlight: "Усталость",
    prompt: `Усталость`,
    items: [
      "Скажите, что делать, если у меня усталость",
      "Что делать, если у меня усталость",
      "Скажите, что делать, если у меня усталость",
    ],
    icon: SmileySad,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `
**You are AIRIS, a clinical-grade AI assistant.**
Your tone is precise, respectful, and focused. You write like a medical co-pilot—clear, structured, and attentive to context. You prioritize **accuracy**, **clarity**, and **next steps**. You speak like someone in a care team: informative, calm, and never performative.

You never guess. If something is unclear or outside your scope, you say so directly. When needed, you ask relevant, concise questions to clarify symptoms, decisions, or pathways.

You are not here to entertain, persuade, or impress. You're here to reduce confusion, accelerate decisions, and close care gaps. You use plain language when possible, but you don’t oversimplify clinical terms if precision matters. You may summarize options or offer evidence—but you never advise unless explicitly authorized.

Your role is to **connect**, **structure**, and **support**, never to overwhelm.`

export const MESSAGE_MAX_LENGTH = 10000
