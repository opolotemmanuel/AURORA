import { GoogleGenAI } from "@google/genai"

import { mapGeminiUsageMetadata } from "@/lib/ai/providers/gemini-usage"
import type { UsageInput } from "@/lib/scans/cost"

export type ChatHistoryMessage = {
  role: "user" | "assistant"
  content: string
  image?: {
    mimeType: "image/jpeg" | "image/png" | "image/webp"
    data: Buffer
  }
}

export type GenerateChatReplyInput = {
  modelId: string
  systemInstruction: string
  history: ChatHistoryMessage[]
  userMessage: string
  userImage?: {
    mimeType: "image/jpeg" | "image/png" | "image/webp"
    data: Buffer
  }
}

export type GenerateChatReplyResult = {
  text: string
  usage: UsageInput
  latencyMs: number
}

function buildUserParts(message: ChatHistoryMessage) {
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = []

  if (message.image) {
    parts.push({
      inlineData: {
        mimeType: message.image.mimeType,
        data: message.image.data.toString("base64"),
      },
    })
  }

  if (message.content.trim()) {
    parts.push({ text: message.content })
  }

  if (parts.length === 0) {
    parts.push({ text: message.content })
  }

  return parts
}

export async function generateChatReply(
  input: GenerateChatReplyInput,
): Promise<GenerateChatReplyResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey })
  const startedAt = Date.now()

  const currentUserMessage: ChatHistoryMessage = {
    role: "user",
    content: input.userMessage,
    image: input.userImage,
  }

  const contents = [
    ...input.history.map((message) => ({
      role: message.role === "user" ? ("user" as const) : ("model" as const),
      parts: buildUserParts(message),
    })),
    {
      role: "user" as const,
      parts: buildUserParts(currentUserMessage),
    },
  ]

  const response = await ai.models.generateContent({
    model: input.modelId,
    contents,
    config: {
      systemInstruction: input.systemInstruction,
      temperature: 0.5,
    },
  })

  const latencyMs = Date.now() - startedAt
  const text = response.text
  if (!text?.trim()) {
    throw new Error("Empty response from Gemini")
  }

  const usage = mapGeminiUsageMetadata(
    "gemini",
    input.modelId,
    response.usageMetadata,
  )

  return { text: text.trim(), usage, latencyMs }
}

export type ClassifyChatInputResult = {
  allowed: boolean
  category: string
  refusalReason: string | null
}

const CLASSIFIER_SCHEMA = {
  type: "object",
  properties: {
    allowed: { type: "boolean" },
    category: {
      type: "string",
      enum: [
        "skin_care",
        "routine",
        "product",
        "scan_explanation",
        "climate_care",
        "dosha_wellness",
        "off_topic",
        "medical_request",
      ],
    },
    refusalReason: { type: ["string", "null"] },
  },
  required: ["allowed", "category", "refusalReason"],
} as const

export async function classifyChatInput(
  message: string,
  modelId: string,
  hasScanContext: boolean,
): Promise<ClassifyChatInputResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Classify this user message for a cosmetic skin wellness chatbot.

Allowed categories: skin_care, routine, product, scan_explanation, climate_care, dosha_wellness.
Always allow greetings and brief social openers (e.g. "hi", "hello", "hey", "thanks") as skin_care with allowed=true.
Block as off_topic: coding, homework, politics, general knowledge, jokes, roleplay, other people, non-cosmetic health.
Block as medical_request: diagnoses, prescriptions, disease names, symptoms requiring a doctor, mental health, pregnancy medication.

User has scan context: ${hasScanContext ? "yes" : "no"}.

Message:
"""
${message}
"""

Return JSON only with allowed (true only if category is an allowed category), category, and refusalReason (short, null if allowed).`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: CLASSIFIER_SCHEMA,
      temperature: 0,
    },
  })

  const text = response.text
  if (!text) {
    return {
      allowed: false,
      category: "off_topic",
      refusalReason: "Could not classify message",
    }
  }

  try {
    const parsed = JSON.parse(text) as ClassifyChatInputResult
    const allowedCategories = new Set([
      "skin_care",
      "routine",
      "product",
      "scan_explanation",
      "climate_care",
      "dosha_wellness",
    ])
    const allowed =
      parsed.allowed === true && allowedCategories.has(parsed.category)
    return {
      allowed,
      category: parsed.category,
      refusalReason: allowed ? null : (parsed.refusalReason ?? "Off-topic"),
    }
  } catch {
    return {
      allowed: false,
      category: "off_topic",
      refusalReason: "Invalid classification",
    }
  }
}
