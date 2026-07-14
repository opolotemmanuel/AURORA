// A short Ayurvedic dosha-typing questionnaire. Questions cover the classic
// body-frame/skin/hair/temperament/lifestyle categories used across widely
// published traditional dosha quizzes (body frame, skin, hair, appetite,
// sleep, energy, stress response, weather preference, decision style,
// memory, speech pace, routine preference) — this is traditional
// public-domain Ayurvedic knowledge, paraphrased in this app's own wording
// rather than copied from any single source.
//
// Wellness framing only (see AGENTS.md's cosmetic-framing rule, applied
// here to the traditional-wellness equivalent): nothing below is phrased as
// a medical fact, diagnosis, or health claim.
export type Dosha = "vata" | "pitta" | "kapha"

export type DoshaQuestionOption = {
  value: Dosha
  label: string
}

export type DoshaQuestion = {
  id: string
  prompt: string
  options: DoshaQuestionOption[]
}

export const DOSHA_QUESTIONS: DoshaQuestion[] = [
  {
    id: "body-frame",
    prompt: "Which best describes your natural body frame?",
    options: [
      { value: "vata", label: "Thin and light, with prominent joints — I find it hard to gain weight." },
      { value: "pitta", label: "Medium build with moderate muscle — my weight stays fairly steady." },
      { value: "kapha", label: "Solid or larger frame — I gain weight easily and lose it slowly." },
    ],
  },
  {
    id: "skin-type",
    prompt: "How would you describe your skin most of the time?",
    options: [
      { value: "vata", label: "Dry, thin, and cool to the touch, sometimes rough." },
      { value: "pitta", label: "Warm and sensitive, prone to redness or flushing." },
      { value: "kapha", label: "Thick, smooth, and moist, cool to the touch." },
    ],
  },
  {
    id: "hair-type",
    prompt: "Which sounds most like your hair?",
    options: [
      { value: "vata", label: "Dry, thin, or a little frizzy." },
      { value: "pitta", label: "Fine, with early thinning or graying, oilier at the scalp." },
      { value: "kapha", label: "Thick, wavy, and glossy." },
    ],
  },
  {
    id: "appetite",
    prompt: "How would you describe your appetite and digestion?",
    options: [
      { value: "vata", label: "Irregular — some days I'm hungry, some days I forget to eat." },
      { value: "pitta", label: "Strong and sharp — I get irritable if a meal is delayed." },
      { value: "kapha", label: "Steady but slow — I can comfortably skip a meal." },
    ],
  },
  {
    id: "sleep",
    prompt: "What's your typical sleep pattern?",
    options: [
      { value: "vata", label: "Light sleeper — I wake up easily and often." },
      { value: "pitta", label: "Moderate and fairly sound sleep." },
      { value: "kapha", label: "Deep, long sleep — I'm slow to wake up." },
    ],
  },
  {
    id: "energy",
    prompt: "How does your energy tend to move through the day?",
    options: [
      { value: "vata", label: "In bursts — quick energy followed by sudden fatigue." },
      { value: "pitta", label: "Focused and steady, with strong drive." },
      { value: "kapha", label: "Slow to start, but steady stamina once I'm going." },
    ],
  },
  {
    id: "stress-response",
    prompt: "Under stress, you're most likely to become...",
    options: [
      { value: "vata", label: "Anxious or worried." },
      { value: "pitta", label: "Irritable or impatient." },
      { value: "kapha", label: "Withdrawn or avoidant." },
    ],
  },
  {
    id: "weather",
    prompt: "Which weather do you like least?",
    options: [
      { value: "vata", label: "Cold, windy weather." },
      { value: "pitta", label: "Hot weather — I prefer things cool." },
      { value: "kapha", label: "Damp, cold, gray weather." },
    ],
  },
  {
    id: "decisions",
    prompt: "How do you typically make decisions?",
    options: [
      { value: "vata", label: "Quickly — though I often change my mind afterward." },
      { value: "pitta", label: "Decisively, after weighing things in an organized way." },
      { value: "kapha", label: "Slowly and deliberately, but I rarely revisit it once decided." },
    ],
  },
  {
    id: "memory",
    prompt: "How would you describe your memory and learning style?",
    options: [
      { value: "vata", label: "I pick things up fast, but forget just as fast." },
      { value: "pitta", label: "Sharp and clear — I remember details well." },
      { value: "kapha", label: "Slower to learn, but once it's in, it stays for a long time." },
    ],
  },
  {
    id: "pace",
    prompt: "Which best matches your natural speech and movement?",
    options: [
      { value: "vata", label: "Quick talking, quick moving, a bit fidgety." },
      { value: "pitta", label: "Precise, articulate speech and purposeful movement." },
      { value: "kapha", label: "Slow, calm, and unhurried." },
    ],
  },
  {
    id: "routine",
    prompt: "How do you feel about routine?",
    options: [
      { value: "vata", label: "I prefer variety and get bored with the same routine." },
      { value: "pitta", label: "I like a structured, goal-oriented routine." },
      { value: "kapha", label: "I'm comfortable with a steady, unchanging routine." },
    ],
  },
]
