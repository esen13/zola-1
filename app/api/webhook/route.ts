import {
  incrementMessageCount,
  logUserMessage,
  validateAndTrackUsage,
} from "@/app/api/chat/api"

type WebhookRequest = {
  chatId: string
  userId: string
  text: string
  model: string
  isAuthenticated: boolean
  systemPrompt?: string
  enableSearch?: boolean
  experimental_attachments?: Array<{ url?: string }>
  message_group_id?: string
}

export async function POST(req: Request) {
  try {
    const {
      chatId,
      userId,
      text,
      model,
      isAuthenticated,
      experimental_attachments,
      message_group_id,
    } = (await req.json()) as WebhookRequest

    if (!chatId || !userId || !text) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })
    if (supabase) {
      await incrementMessageCount({ supabase, userId })
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content: text,
        attachments: experimental_attachments as any,
        model,
        isAuthenticated,
        message_group_id,
      })
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "Webhook URL not configured" }),
        { status: 500 }
      )
    }

    const payload = {
      message: {
        message_id: crypto.randomUUID(),
        chat: {
          id: chatId,
          is_bot: false,
          first_name: "Web",
          username: userId,
          type: "private",
          language_code: "en",
        },
        date: Math.floor(Date.now() / 1000),
        text,
      },
      is_site: true,
    }

    const rsp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    // Read as text first to support non-JSON responses
    const rawBody = await rsp.text()
    console.log("rsp", rsp)
    console.log("rawBody", rawBody)
    let data: unknown = null
    try {
      data = rawBody ? JSON.parse(rawBody) : null
    } catch (e) {
      console.error("Error parsing webhook response:", e)
      data = null
    }
    if (!rsp.ok) {
      const anyData = data as { error?: string; message?: string } | null
      const message =
        (anyData && (anyData.error || anyData.message)) ||
        rawBody ||
        `Webhook failed: ${rsp.status}`
      return new Response(JSON.stringify({ error: message }), {
        status: rsp.status,
      })
    }

    // Normalize common webhook response shapes (support array payloads and plain text)
    const pickText = (obj: any) =>
      (typeof obj === "string" && obj) ||
      obj?.reply ||
      obj?.output ||
      obj?.text ||
      obj?.message?.text ||
      (typeof obj?.data === "string" ? obj.data : "")

    let replyText = ""
    if (Array.isArray(data)) {
      const parts = (data as any[])
        .map((item) => pickText(item))
        .filter((s): s is string => Boolean(s && typeof s === "string"))
      replyText = parts.join("\n\n")
    } else if (data && typeof data === "object") {
      replyText = pickText(data) || ""
    } else {
      // Plain text fallback
      replyText = rawBody || ""
    }

    if (supabase && replyText) {
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "assistant",
        content: replyText,
        message_group_id,
        model,
      })
    }

    return new Response(
      JSON.stringify({
        reply: replyText,
        output: replyText,
        raw: data ?? rawBody,
      }),
      {
        status: 200,
      }
    )
  } catch (err) {
    console.error("Error in /api/webhook:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    })
  }
}
