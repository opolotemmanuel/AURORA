"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import {
  OnboardingStepItem,
  OnboardingStepPanel,
} from "@/components/onboarding/onboarding-step-panel"
import { useOnboardingStepUrl } from "@/components/onboarding/use-onboarding-step-url"
import { DateOfBirthField } from "@/components/onboarding/date-of-birth-field"
import { OnboardingStepActions } from "@/components/onboarding/onboarding-step-actions"
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper"
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
import { DEFAULT_POST_ONBOARDING_PATH } from "@/lib/auth/callback-url"
import {
  FITZPATRICK_OPTIONS,
  ONBOARDING_STEPS,
  formatSkinOptionLabel,
  type OnboardingStep,
} from "@/lib/onboarding/constants"
import {
  completeOnboardingAction,
  resolveBrowserLocationAction,
  saveBasicsAction,
  saveConsentAction,
  saveLifestyleAction,
  saveLocationAction,
  savePasswordAction,
  saveRoutineAction,
  saveSkinAction,
  setWelcomeStepAction,
  skipPasswordAction,
  skipToOnboardingStepAction,
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
  callbackUrl?: string
}

export function OnboardingWizard({
  initialStep,
  userName,
  callbackUrl = DEFAULT_POST_ONBOARDING_PATH,
}: OnboardingWizardProps) {
  const router = useRouter()
  const { step, goToStep } = useOnboardingStepUrl(initialStep, callbackUrl)
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
    locationSource: "manual" as "manual" | "geocode" | "browser",
  })
  const [password, setPassword] = useState({ password: "", confirmPassword: "" })
  const [locationDetecting, setLocationDetecting] = useState(false)
  const [locationHint, setLocationHint] = useState<string | null>(null)

  const stepIndex = ONBOARDING_STEPS.indexOf(step)
  const canGoBack = stepIndex > 1

  function toggleItem(list: string[], item: string) {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
  }

  function goBack() {
    if (!canGoBack) return
    setError(null)
    goToStep(ONBOARDING_STEPS[stepIndex - 1]!)
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.")
      return
    }

    setLocationDetecting(true)
    setLocationHint(null)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTransition(async () => {
          try {
            const result = await resolveBrowserLocationAction(
              pos.coords.latitude,
              pos.coords.longitude,
            )
            if (!result.ok) {
              setError(result.error)
              return
            }
            const resolved = result.data
            setLocation({
              city: resolved.city,
              region: resolved.region,
              country: resolved.country,
              postalCode: "",
              latitude: resolved.latitude,
              longitude: resolved.longitude,
              locationSource: resolved.locationSource,
            })
            const label = [resolved.city, resolved.country]
              .filter(Boolean)
              .join(", ")
            setLocationHint(
              label ? `Detected: ${label}` : "Location detected.",
            )
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not get your location. Enter it manually.",
            )
          } finally {
            setLocationDetecting(false)
          }
        })
      },
      () => {
        setLocationDetecting(false)
        setError("Could not get your location. Enter it manually.")
      },
    )
  }

  function skipStep(next: OnboardingStep) {
    startTransition(async () => {
      try {
        await skipToOnboardingStepAction(next)
        goToStep(next)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not skip this step")
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <OnboardingStepper currentStep={step} />

      <OnboardingStepPanel stepKey={step}>
          {step === "welcome" && (
            <section className="space-y-8">
              <OnboardingStepItem className="space-y-3">
                <h1 className="font-heading text-2xl font-medium">Welcome to Aura</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A few quick questions about your skin, routine, and where you live
                  help us tailor scan results and product picks to you.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Takes about three minutes. You can update your answers anytime.
                </p>
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Get started"
                showBack={false}
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onContinue={() =>
                  startTransition(async () => {
                    await setWelcomeStepAction()
                    goToStep("consent")
                  })
                }
              />
            </section>
          )}

          {step === "consent" && (
            <section className="space-y-4">
              <OnboardingStepItem>
                <h1 className="font-heading text-2xl font-medium">Consent</h1>
                <p className="text-sm text-muted-foreground">
                  Please review and accept before we store your profile and process
                  scans.
                </p>
              </OnboardingStepItem>
              <OnboardingStepItem>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={consent.photoProcessingConsent}
                    onCheckedChange={(v) =>
                      setConsent({ ...consent, photoProcessingConsent: v === true })
                    }
                  />
                  <span>
                    I consent to cosmetic photo processing for personalized
                    recommendations. I understand this is not a medical diagnosis.
                  </span>
                </label>
              </OnboardingStepItem>
              <OnboardingStepItem>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={consent.marketingConsent}
                    onCheckedChange={(v) =>
                      setConsent({ ...consent, marketingConsent: v === true })
                    }
                  />
                  <span>Email me Aurora product updates (optional).</span>
                </label>
              </OnboardingStepItem>
              {error ? (
                <OnboardingStepItem>
                  <p className="text-sm text-destructive">{error}</p>
                </OnboardingStepItem>
              ) : null}
              <OnboardingStepActions
                label="I agree"
                showBack={false}
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      await saveConsentAction(consent)
                      goToStep("basics")
                      setError(null)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Consent required")
                    }
                  })
                }
              />
            </section>
          )}

          {step === "basics" && (
            <section className="space-y-4">
              <OnboardingStepItem>
                <h1 className="font-heading text-2xl font-medium">About you</h1>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={basics.name}
                  onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <DateOfBirthField
                  id="dob"
                  value={basics.dateOfBirth}
                  onChange={(dateOfBirth) =>
                    setBasics({ ...basics, dateOfBirth })
                  }
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
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
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Continue"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      await saveBasicsAction({
                        ...basics,
                        biologicalSex: basics.biologicalSex || undefined,
                      })
                      goToStep("skin")
                      setError(null)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Invalid basics")
                    }
                  })
                }
              />
            </section>
          )}

          {step === "skin" && (
            <section className="space-y-4">
              <OnboardingStepItem className="space-y-2">
                <h1 className="font-heading text-2xl font-medium">Skin profile</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Answer what you can — skip anything you&apos;re unsure about and
                  update it later in settings.
                </p>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
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
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <div className="space-y-1">
                  <Label>Sun sensitivity (optional)</Label>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Helps us tailor UV guidance. Pick the closest match, or skip if
                    you&apos;re not sure.
                  </p>
                </div>
                <Select
                  value={skin.fitzpatrickBand || "unsure"}
                  onValueChange={(v) =>
                    setSkin({
                      ...skin,
                      fitzpatrickBand: v === "unsure" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose one or skip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unsure">I&apos;m not sure — skip</SelectItem>
                    {FITZPATRICK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} — {option.hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
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
                      {formatSkinOptionLabel(c)}
                    </Button>
                  ))}
                </div>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
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
                      {formatSkinOptionLabel(g)}
                    </Button>
                  ))}
                </div>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="allergies">Allergies or sensitivities</Label>
                <Textarea
                  id="allergies"
                  value={skin.allergies}
                  onChange={(e) => setSkin({ ...skin, allergies: e.target.value })}
                />
              </OnboardingStepItem>
              <OnboardingStepItem>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={skin.expertReviewRequested}
                    onCheckedChange={(v) =>
                      setSkin({ ...skin, expertReviewRequested: v === true })
                    }
                  />
                  Request expert review when available
                </label>
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Continue"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onSkip={() => skipStep("routine")}
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      await saveSkinAction(skin)
                      goToStep("routine")
                      setError(null)
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Could not save skin profile",
                      )
                    }
                  })
                }
              />
            </section>
          )}

          {step === "routine" && (
            <section className="space-y-4">
              <OnboardingStepItem className="space-y-2">
                <h1 className="font-heading text-2xl font-medium">
                  Routine & medications
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Optional — share only what you use today.
                </p>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="am">Morning routine</Label>
                <Textarea
                  id="am"
                  value={routine.am}
                  onChange={(e) => setRoutine({ ...routine, am: e.target.value })}
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="pm">Evening routine</Label>
                <Textarea
                  id="pm"
                  value={routine.pm}
                  onChange={(e) => setRoutine({ ...routine, pm: e.target.value })}
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="rx">
                  Previous prescriptions (one per line: name | active yes/no)
                </Label>
                <Textarea
                  id="rx"
                  value={prescriptions}
                  onChange={(e) => setPrescriptions(e.target.value)}
                  placeholder="tretinoin | yes | nightly retinoid"
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="meds">Medications (one per line)</Label>
                <Textarea
                  id="meds"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Continue"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onSkip={() => skipStep("lifestyle")}
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      const parsedRx = prescriptions
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const [name, active, ...notes] = line
                            .split("|")
                            .map((s) => s.trim())
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
                      goToStep("lifestyle")
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Invalid routine")
                    }
                  })
                }
              />
            </section>
          )}

          {step === "lifestyle" && (
            <section className="space-y-4">
              <OnboardingStepItem className="space-y-2">
                <h1 className="font-heading text-2xl font-medium">Lifestyle</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Optional — defaults are fine if you want to skip.
                </p>
              </OnboardingStepItem>
              {(["sunExposure", "smoking", "sleepHours", "waterIntake"] as const).map(
                (field) => (
                  <OnboardingStepItem key={field} className="space-y-2">
                    <Label className="capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                    </Label>
                    <Select
                      value={lifestyle[field]}
                      onValueChange={(v) =>
                        setLifestyle({ ...lifestyle, [field]: v })
                      }
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
                  </OnboardingStepItem>
                ),
              )}
              <OnboardingStepActions
                label="Continue"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onSkip={() => skipStep("location")}
                onContinue={() =>
                  startTransition(async () => {
                    await saveLifestyleAction({ lifestyleFactors: lifestyle })
                    goToStep("location")
                  })
                }
              />
            </section>
          )}

          {step === "location" && (
            <section className="space-y-4">
              <OnboardingStepItem className="space-y-2">
                <h1 className="font-heading text-2xl font-medium">Location & climate</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Optional — helps tailor UV and climate guidance. You can add this
                  later in settings.
                </p>
              </OnboardingStepItem>
              <OnboardingStepItem className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={location.city}
                    onChange={(e) =>
                      setLocation({ ...location, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region / state (optional)</Label>
                  <Input
                    id="region"
                    value={location.region}
                    onChange={(e) =>
                      setLocation({ ...location, region: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={location.country}
                    onChange={(e) =>
                      setLocation({ ...location, country: e.target.value })
                    }
                  />
                </div>
              </OnboardingStepItem>
              <OnboardingStepItem>
                <Button
                  type="button"
                  variant="outline"
                  disabled={locationDetecting || pending}
                  onClick={useBrowserLocation}
                >
                  {locationDetecting ? "Detecting location…" : "Use my location"}
                </Button>
                {locationHint ? (
                  <p className="mt-2 text-sm text-muted-foreground">{locationHint}</p>
                ) : null}
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Continue"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onSkip={() => skipStep("password")}
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      await saveLocationAction(location)
                      goToStep("password")
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Enter location")
                    }
                  })
                }
              />
            </section>
          )}

          {step === "password" && (
            <section className="space-y-4">
              <OnboardingStepItem>
                <h1 className="font-heading text-2xl font-medium">Password (optional)</h1>
                <p className="text-sm text-muted-foreground">
                  Set a password for account recovery. You can always sign in with email
                  codes.
                </p>
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password.password}
                  onChange={(e) =>
                    setPassword({ ...password, password: e.target.value })
                  }
                />
              </OnboardingStepItem>
              <OnboardingStepItem className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={password.confirmPassword}
                  onChange={(e) =>
                    setPassword({ ...password, confirmPassword: e.target.value })
                  }
                />
              </OnboardingStepItem>
              <OnboardingStepActions
                label={password.password ? "Save & continue" : "Continue"}
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onSkip={() =>
                  startTransition(async () => {
                    try {
                      await skipPasswordAction()
                      goToStep("complete")
                      setError(null)
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not skip")
                    }
                  })
                }
                onContinue={() =>
                  startTransition(async () => {
                    try {
                      if (password.password) {
                        await savePasswordAction(password)
                      } else {
                        await skipPasswordAction()
                      }
                      goToStep("complete")
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Invalid password")
                    }
                  })
                }
              />
            </section>
          )}

          {step === "complete" && (
            <section className="space-y-4">
              <OnboardingStepItem>
                <h1 className="font-heading text-2xl font-medium">You&apos;re all set</h1>
                <p className="text-sm text-muted-foreground">
                  Your profile is saved. Free starter tokens have been added to your
                  wallet.
                </p>
              </OnboardingStepItem>
              <OnboardingStepActions
                label="Start your scan"
                pending={pending}
                canGoBack={canGoBack}
                onBack={goBack}
                onContinue={() =>
                  startTransition(async () => {
                    await completeOnboardingAction()
                    router.replace(callbackUrl)
                  })
                }
              />
            </section>
          )}

          {error && step !== "consent" ? (
            <OnboardingStepItem>
              <p className="text-sm text-destructive">{error}</p>
            </OnboardingStepItem>
          ) : null}
        </OnboardingStepPanel>
    </div>
  )
}
