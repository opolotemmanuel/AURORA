import {
  CHAT_REFUSAL_MESSAGE,
} from "@/lib/ai/prompts/chat"
import {
  classifyChatInput,
} from "@/lib/ai/providers/gemini-chat"
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/scans/constants"

export type GuardrailResult =
  | { allowed: true }
  | { allowed: false; reason: string }

const BLOCKLIST_PATTERNS: RegExp[] = [
  /\b(write|generate|debug|fix)\s+(me\s+)?(code|script|program|sql|python|javascript)\b/i,
  /\b(homework|essay|assignment|thesis)\b/i,
  /\b(president|election|politics|war|religion)\b/i,
  /\b(bitcoin|crypto|stock|invest)\b/i,
  /\b(pretend|roleplay|ignore previous|jailbreak|dan mode)\b/i,
  /\b(diagnos(e|is|tic)|prescri(be|ption)|antibiotic|steroid cream for)\b/i,
  /\b(cancer|melanoma|eczema diagnosis|psoriasis treatment|rosacea cure)\b/i,
  /\b(suicid|self.?harm|depression medication)\b/i,
  /\b(pregnant|pregnancy safe drug)\b/i,
]

const MEDICAL_OUTPUT_PATTERNS: RegExp[] = [
  /\b(you have|you likely have|this is|diagnosed with)\s+[a-z]+ (disease|disorder|condition)\b/i,
  /\b(prescri(be|ption)|take this medication|antibiotic|steroid)\b/i,
  /\b(melanoma|carcinoma|basal cell)\b/i,
]

export function checkInputGuardrails(
  message: string,
  options?: { hasImage?: boolean },
): GuardrailResult {
  const trimmed = message.trim()
  if (!trimmed && !options?.hasImage) {
    return { allowed: false, reason: "Message cannot be empty." }
  }
  if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: `Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer.`,
    }
  }

  for (const pattern of BLOCKLIST_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason: "Off-topic or restricted request." }
    }
  }

  return { allowed: true }
}

export function sanitizeAssistantOutput(text: string): string {
  for (const pattern of MEDICAL_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      return CHAT_REFUSAL_MESSAGE
    }
  }
  return text
}

export async function runFullInputGuardrails(
  message: string,
  modelId: string,
  hasScanContext: boolean,
  options?: { hasImage?: boolean },
): Promise<GuardrailResult> {
  const local = checkInputGuardrails(message, options)
  if (!local.allowed) {
    return local
  }

  const messageForClassifier =
    message.trim() ||
    (options?.hasImage
      ? "User shared a cosmetic skin photo for advice."
      : "")

  const classification = await classifyChatInput(
    messageForClassifier,
    modelId,
    hasScanContext,
  )
  if (!classification.allowed) {
    return {
      allowed: false,
      reason: classification.refusalReason ?? "Off-topic request.",
    }
  }

  return { allowed: true }
}
