"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
  type BrowserSpeechRecognition,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionResultEvent,
} from "@/lib/speech/speech-recognition"

type UseVoiceDictationOptions = {
  lang?: string
  onTranscript: (text: string) => void
  onError?: (message: string) => void
}

function speechErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied. Allow microphone use in your browser settings."
    case "no-speech":
      return "No speech detected. Try again."
    case "audio-capture":
      return "No microphone found."
    case "network":
      return "Voice input needs an internet connection."
    case "aborted":
      return ""
    default:
      return "Voice input is unavailable right now."
  }
}

export function useVoiceDictation({
  lang = "en-US",
  onTranscript,
  onError,
}: UseVoiceDictationOptions) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  const shouldListenRef = useRef(false)
  const committedRef = useRef("")

  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported())
  }, [])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const startListening = useCallback(
    (baseText: string) => {
      const Recognition = getSpeechRecognitionConstructor()
      if (!Recognition) {
        onErrorRef.current?.(
          "Voice input is not supported in this browser. Try Chrome or Safari.",
        )
        return
      }

      recognitionRef.current?.abort()

      const recognition = new Recognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = lang

      committedRef.current = baseText.trimEnd()
      shouldListenRef.current = true

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let interim = ""

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i]
          const transcript = result[0]?.transcript ?? ""
          if (!transcript) continue

          if (result.isFinal) {
            const prefix = committedRef.current
            committedRef.current = prefix
              ? `${prefix} ${transcript.trim()}`
              : transcript.trim()
          } else {
            interim += transcript
          }
        }

        const next = interim
          ? committedRef.current
            ? `${committedRef.current} ${interim.trim()}`
            : interim.trim()
          : committedRef.current

        onTranscriptRef.current(next)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const message = speechErrorMessage(event.error)
        if (message) {
          onErrorRef.current?.(message)
        }
        shouldListenRef.current = false
        setListening(false)
      }

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start()
            return
          } catch {
            shouldListenRef.current = false
          }
        }
        setListening(false)
      }

      recognitionRef.current = recognition

      try {
        recognition.start()
        setListening(true)
      } catch {
        shouldListenRef.current = false
        setListening(false)
        onErrorRef.current?.("Could not start voice input.")
      }
    },
    [lang],
  )

  const toggleListening = useCallback(
    (baseText: string) => {
      if (listening) {
        stopListening()
        return
      }
      startListening(baseText)
    },
    [listening, startListening, stopListening],
  )

  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  return {
    supported,
    listening,
    startListening,
    stopListening,
    toggleListening,
  }
}
