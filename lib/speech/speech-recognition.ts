export type SpeechRecognitionResultEvent = Event & {
  resultIndex: number
  results: SpeechRecognitionResultList
}

export type SpeechRecognitionErrorEvent = Event & {
  error: string
  message?: string
}

export type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function getSpeechRecognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() != null
}
