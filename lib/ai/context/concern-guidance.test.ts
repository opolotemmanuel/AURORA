import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildProfileConcernPromptBlock,
  collectProfileWellnessPriorities,
} from "@/lib/ai/context/concern-guidance"

describe("buildProfileConcernPromptBlock", () => {
  it("includes photo-first guidance when profile is null", () => {
    const block = buildProfileConcernPromptBlock(null)
    assert.match(block, /Photo-first analysis/)
    assert.match(block, /not in the user's profile/)
    assert.match(block, /Recommendation rules/)
    assert.match(block, /naturalRecommendations and catalog products/)
  })

  it("includes acne concern mapping and summary requirement", () => {
    const block = buildProfileConcernPromptBlock({
      ageBand: "25_34",
      skinType: "oily",
      fitzpatrickBand: "iv",
      skinDosha: "pitta",
      primaryConcerns: ["acne", "oiliness"],
      skinGoals: ["clear_skin"],
      allergies: null,
      currentRoutine: null,
      lifestyleFactors: [],
    })

    assert.match(block, /blemishes, breakout-prone areas, congestion/)
    assert.match(block, /excess sebum, shine, oil balance/)
    assert.match(block, /blemish and congestion patterns/)
    assert.match(
      block,
      /acknowledge each listed primary concern \(acne, oiliness\)/,
    )
  })
})

describe("collectProfileWellnessPriorities", () => {
  it("merges concerns and goals without duplicates", () => {
    assert.deepEqual(
      collectProfileWellnessPriorities({
        ageBand: null,
        skinType: null,
        fitzpatrickBand: null,
        skinDosha: null,
        primaryConcerns: ["acne", "redness"],
        skinGoals: ["clear_skin", "hydration"],
        allergies: null,
        currentRoutine: null,
        lifestyleFactors: [],
      }),
      ["acne", "redness", "clear_skin", "hydration"],
    )
  })
})
