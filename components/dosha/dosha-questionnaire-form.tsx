"use client"

// Single scrollable form (all questions on one page) rather than one
// question at a time — 12 questions is short enough that paging would just
// add clicks. Each RadioGroup carries its own `name`, so plain form
// submission collects every answer without any client-side fetch/JSON
// wiring; local `answered` state exists purely for the progress readout and
// to keep the submit button disabled until every question has a value —
// actual validation still happens server-side in the submit action.
import { useState } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { submitDoshaAssessment } from "@/app/(dashboard)/dosha-assessment/actions"
import { DOSHA_QUESTIONS, type Dosha } from "@/lib/dosha/questions"

export function DoshaQuestionnaireForm() {
  const [answers, setAnswers] = useState<Record<string, Dosha>>({})
  const answeredCount = Object.keys(answers).length
  const complete = answeredCount === DOSHA_QUESTIONS.length

  return (
    <form action={submitDoshaAssessment} className="space-y-6">
      <div className="space-y-4">
        {DOSHA_QUESTIONS.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {index + 1}. {question.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                name={question.id}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: value as Dosha }))
                }
              >
                {question.options.map((option) => {
                  const id = `${question.id}-${option.value}`
                  return (
                    <div key={option.value} className="flex items-start gap-3">
                      <RadioGroupItem value={option.value} id={id} className="mt-0.5" />
                      <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-6">
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {answeredCount} of {DOSHA_QUESTIONS.length} answered
        </p>
        <SubmitButton disabled={!complete} />
      </div>
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? <IconLoader2 className="size-4 animate-spin" /> : null}
      See my dosha result
    </Button>
  )
}
