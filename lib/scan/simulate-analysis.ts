import type {
  AnalysisToolCall,
  SkinAssessment,
} from "@/lib/scan/types"
import { SKIN_DISCLAIMER } from "@/lib/scan/constants"
import { DEFAULT_MOCK_USAGE } from "@/lib/tokens/constants"

export { DEFAULT_MOCK_USAGE }

const TOOL_STEPS: Array<Pick<AnalysisToolCall, "id" | "name" | "label">> = [
  { id: "locate_face", name: "locate_face", label: "Locating facial regions" },
  {
    id: "assess_texture",
    name: "assess_texture_bands",
    label: "Assessing texture bands",
  },
  {
    id: "match_products",
    name: "match_products",
    label: "Matching Aurora recommendations",
  },
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_ASSESSMENT: SkinAssessment = {
  overallBand: "mild",
  dimensions: [
    {
      id: "hydration",
      label: "Hydration",
      band: "mild",
      note: "Skin appears slightly dry in cheek areas.",
    },
    {
      id: "tone_evenness",
      label: "Tone evenness",
      band: "minimal",
      note: "Overall tone looks fairly balanced.",
    },
    {
      id: "texture",
      label: "Texture",
      band: "moderate",
      note: "Some visible texture around the T-zone.",
    },
    {
      id: "radiance",
      label: "Radiance",
      band: "mild",
      note: "A gentle boost could help restore glow.",
    },
  ],
  summary:
    "Your scan suggests generally balanced skin with mild dryness and moderate texture in select areas. This is cosmetic guidance only — not a medical diagnosis.",
  recommendations: [
    {
      id: "aurora-hydra-serum",
      name: "Aurora Hydra Glow Serum",
      reason: "Supports hydration for mildly dry cheek areas.",
    },
    {
      id: "aurora-balance-toner",
      name: "Aurora Balance Toner",
      reason: "Helps refine texture appearance in the T-zone.",
    },
    {
      id: "aurora-daily-spf",
      name: "Aurora Daily Shield SPF",
      reason: "Protects tone evenness and supports radiance.",
    },
  ],
  disclaimer: SKIN_DISCLAIMER,
}

export async function simulateSkinAnalysis(
  _image: Blob,
  onToolCall?: (call: AnalysisToolCall) => void,
): Promise<SkinAssessment> {
  for (const step of TOOL_STEPS) {
    onToolCall?.({
      ...step,
      status: "running",
    })
    await delay(700 + Math.random() * 500)
    onToolCall?.({
      ...step,
      status: "done",
      detail: "Complete",
    })
  }

  await delay(400)
  return MOCK_ASSESSMENT
}

export function createInitialToolCalls(): AnalysisToolCall[] {
  return TOOL_STEPS.map((step) => ({
    ...step,
    status: "pending" as const,
  }))
}
