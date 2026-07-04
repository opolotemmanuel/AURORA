"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { OnboardingStep } from "@/lib/onboarding/constants"
import {
  completeOnboardingAction,
  saveBasicsAction,
  saveConsentAction,
  saveLifestyleAction,
  saveLocationAction,
  savePasswordAction,
  saveRoutineAction,
  saveSkinAction,
  setWelcomeStepAction,
  skipPasswordAction,
} from "@/lib/onboarding/actions"

const CONCERN_OPTIONS = [
  "acne",
  "aging",
  "dryness",
  "redness",
  "hyperpigmentation",
  "sensitivity",
  "texture",
  "oiliness",
]

const GOAL_OPTIONS = [
  "hydration",
  "even_tone",
  "clear_skin",
  "barrier_support",
  "sun_protection",
  "gentle_routine",
]

type OnboardingWizardProps = {
  initialStep: OnboardingStep
  userName: string
}

export function OnboardingWizard({ initialStep, userName }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>(initialStep)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [consent, setConsent] = useState({
    photoProcessingConsent: false,
    marketingConsent: false,
  })

  const [basics, setBasics] = useState({
    name: userName,
    dateOfBirth: "",
    biologicalSex: "",
  })
  const [skin, setSkin] = useState({
    skinType: "",
    fitzpatrickBand: "",
    primaryConcerns: [] as string[],
    skinGoals: [] as string[],
    allergies: "",
    expertReviewRequested: false,
  })
  const [routine, setRoutine] = useState({ am: "", pm: "" })
  const [prescriptions, setPrescriptions] = useState("")
  const [medications, setMedications] = useState("")
  const [lifestyle, setLifestyle] = useState({
    sunExposure: "moderate",
    smoking: "never",
    sleepHours: "7_to_8",
    waterIntake: "moderate",
  })
  const [location, setLocation] = useState({
    city: "",
    region: "",
    country: "",
    postalCode: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    locationSource: "manual" as "manual" | "browser",
  })
  const [password, setPassword] = useState({ password: "", confirmPassword: "" })

  function toggleItem(list: string[], item: string) {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationSource: "browser",
        }))
        setError(null)
      },
      () => setError("Could not get your location. Enter it manually.")
    )
  }

  const stepIndex = [
    "welcome",
    "consent",
    "basics",
    "skin",
    "routine",
    "lifestyle",
    "location",
    "password",
    "complete",
  ].indexOf(step)

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          Step {Math.max(stepIndex, 0) + 1} of 9
        </Badge>
        <span className="text-sm text-muted-foreground capitalize">{step}</span>
      </div>

      {step === "welcome" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Welcome to Aura</h1>
          <p className="text-sm text-muted-foreground">
            Aura provides cosmetic skin intelligence and product guidance — not medical
            diagnosis or treatment. A short profile helps personalize recommendations.
          </p>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setWelcomeStepAction()
                setStep("consent")
              })
            }
          >
            Get started
          </Button>
        </section>
      )}

      {step === "consent" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Consent</h1>
          <p className="text-sm text-muted-foreground">
            Please review and accept before we store your profile and process scans.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={consent.photoProcessingConsent}
              onCheckedChange={(v) =>
                setConsent({ ...consent, photoProcessingConsent: v === true })
              }
            />
            <span>
              I consent to cosmetic photo processing for personalized recommendations. I
              understand this is not a medical diagnosis.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={consent.marketingConsent}
              onCheckedChange={(v) =>
                setConsent({ ...consent, marketingConsent: v === true })
              }
            />
            <span>Email me Aurora product updates (optional).</span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveConsentAction(consent)
                  setStep("basics")
                  setError(null)
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Consent required")
                }
              })
            }
          >
            I agree
          </Button>
        </section>
      )}

      {step === "basics" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">About you</h1>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={basics.name}
              onChange={(e) => setBasics({ ...basics, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={basics.dateOfBirth}
              onChange={(e) => setBasics({ ...basics, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Biological sex (optional)</Label>
            <Select
              value={basics.biologicalSex}
              onValueChange={(v) => setBasics({ ...basics, biologicalSex: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prefer not to say" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="intersex">Intersex</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveBasicsAction({
                    ...basics,
                    biologicalSex: basics.biologicalSex || undefined,
                  })
                  setStep("skin")
                  setError(null)
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Invalid basics")
                }
              })
            }
          >
            Continue
          </Button>
        </section>
      )}

      {step === "skin" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Skin profile</h1>
          <div className="space-y-2">
            <Label>Skin type</Label>
            <Select
              value={skin.skinType}
              onValueChange={(v) => setSkin({ ...skin, skinType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {["oily", "dry", "combination", "sensitive", "normal"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fitzpatrick self-report (I–VI)</Label>
            <Select
              value={skin.fitzpatrickBand}
              onValueChange={(v) => setSkin({ ...skin, fitzpatrickBand: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select band" />
              </SelectTrigger>
              <SelectContent>
                {["I", "II", "III", "IV", "V", "VI"].map((b) => (
                  <SelectItem key={b} value={b}>
                    Type {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary concerns</Label>
            <div className="flex flex-wrap gap-2">
              {CONCERN_OPTIONS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={skin.primaryConcerns.includes(c) ? "default" : "outline"}
                  onClick={() =>
                    setSkin({
                      ...skin,
                      primaryConcerns: toggleItem(skin.primaryConcerns, c),
                    })
                  }
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Skin goals</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((g) => (
                <Button
                  key={g}
                  type="button"
                  size="sm"
                  variant={skin.skinGoals.includes(g) ? "default" : "outline"}
                  onClick={() =>
                    setSkin({ ...skin, skinGoals: toggleItem(skin.skinGoals, g) })
                  }
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies or sensitivities</Label>
            <Textarea
              id="allergies"
              value={skin.allergies}
              onChange={(e) => setSkin({ ...skin, allergies: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={skin.expertReviewRequested}
              onCheckedChange={(v) =>
                setSkin({ ...skin, expertReviewRequested: v === true })
              }
            />
            Request expert review when available
          </label>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveSkinAction(skin)
                  setStep("routine")
                  setError(null)
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Complete skin profile")
                }
              })
            }
          >
            Continue
          </Button>
        </section>
      )}

      {step === "routine" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Routine & medications</h1>
          <div className="space-y-2">
            <Label htmlFor="am">Morning routine</Label>
            <Textarea id="am" value={routine.am} onChange={(e) => setRoutine({ ...routine, am: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pm">Evening routine</Label>
            <Textarea id="pm" value={routine.pm} onChange={(e) => setRoutine({ ...routine, pm: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rx">Previous prescriptions (one per line: name | active yes/no)</Label>
            <Textarea
              id="rx"
              value={prescriptions}
              onChange={(e) => setPrescriptions(e.target.value)}
              placeholder="tretinoin | yes | nightly retinoid"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meds">Medications (one per line)</Label>
            <Textarea id="meds" value={medications} onChange={(e) => setMedications(e.target.value)} />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  const parsedRx = prescriptions
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [name, active, ...notes] = line.split("|").map((s) => s.trim())
                      return {
                        name: name ?? line,
                        active: active?.toLowerCase() === "yes",
                        notes: notes.join(" ") || undefined,
                      }
                    })
                  const parsedMeds = medications
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((name) => ({ name }))
                  await saveRoutineAction({
                    currentRoutine: routine,
                    previousPrescriptions: parsedRx,
                    medications: parsedMeds,
                  })
                  setStep("lifestyle")
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Invalid routine")
                }
              })
            }
          >
            Continue
          </Button>
        </section>
      )}

      {step === "lifestyle" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Lifestyle</h1>
          {(["sunExposure", "smoking", "sleepHours", "waterIntake"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
              <Select
                value={lifestyle[field]}
                onValueChange={(v) => setLifestyle({ ...lifestyle, [field]: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field === "smoking" ? (
                    <>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </>
                  ) : field === "sleepHours" ? (
                    <>
                      <SelectItem value="under_6">Under 6h</SelectItem>
                      <SelectItem value="6_to_7">6–7h</SelectItem>
                      <SelectItem value="7_to_8">7–8h</SelectItem>
                      <SelectItem value="over_8">Over 8h</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveLifestyleAction({ lifestyleFactors: lifestyle })
                setStep("location")
              })
            }
          >
            Continue
          </Button>
        </section>
      )}

      {step === "location" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Location & climate</h1>
          <p className="text-sm text-muted-foreground">
            Climate bands (UV, humidity, temperature) help tailor skincare — not weather
            forecasts.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={location.city} onChange={(e) => setLocation({ ...location, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region / state</Label>
              <Input id="region" value={location.region} onChange={(e) => setLocation({ ...location, region: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={location.country} onChange={(e) => setLocation({ ...location, country: e.target.value })} />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={useBrowserLocation}>
            Use my location
          </Button>
          {location.latitude != null ? (
            <p className="text-xs text-muted-foreground">
              Coordinates: {location.latitude.toFixed(2)}, {location.longitude?.toFixed(2)}
            </p>
          ) : null}
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await saveLocationAction(location)
                  setStep("password")
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Enter location")
                }
              })
            }
          >
            Continue
          </Button>
        </section>
      )}

      {step === "password" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">Password (optional)</h1>
          <p className="text-sm text-muted-foreground">
            Set a password for account recovery. You can always sign in with email codes.
          </p>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password.password}
              onChange={(e) => setPassword({ ...password, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={password.confirmPassword}
              onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    if (password.password) {
                      await savePasswordAction(password)
                    } else {
                      await skipPasswordAction()
                    }
                    setStep("complete")
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Invalid password")
                  }
                })
              }
            >
              {password.password ? "Save & continue" : "Skip"}
            </Button>
            {!password.password ? (
              <Button variant="ghost" disabled={pending} onClick={() => startTransition(() => skipPasswordAction().then(() => setStep("complete")))}>
                Skip for now
              </Button>
            ) : null}
          </div>
        </section>
      )}

      {step === "complete" && (
        <section className="space-y-4">
          <h1 className="font-heading text-2xl font-medium">You&apos;re all set</h1>
          <p className="text-sm text-muted-foreground">
            Your profile is saved. Free starter tokens have been added to your wallet.
          </p>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await completeOnboardingAction()
                router.push("/dashboard")
                router.refresh()
              })
            }
          >
            Go to dashboard
          </Button>
        </section>
      )}

      {error && step !== "consent" ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
