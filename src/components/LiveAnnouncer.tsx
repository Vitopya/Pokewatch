import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface AnnouncerContext {
  announce: (message: string, options?: { politeness?: 'polite' | 'assertive' }) => void
}

const Ctx = createContext<AnnouncerContext | null>(null)

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState('')
  const [assertiveMsg, setAssertiveMsg] = useState('')
  const timeoutRef = useRef<number | null>(null)

  const announce = useCallback<AnnouncerContext['announce']>((message, options) => {
    const politeness = options?.politeness ?? 'polite'
    const setter = politeness === 'assertive' ? setAssertiveMsg : setPoliteMsg
    // Clear then set so the same string twice still triggers a re-announce.
    setter('')
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setter(message)
    }, 30)
  }, [])

  return (
    <Ctx.Provider value={{ announce }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMsg}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMsg}
      </div>
    </Ctx.Provider>
  )
}

export function useAnnouncer(): AnnouncerContext {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Fallback no-op so component code stays simple.
    return { announce: () => {} }
  }
  return ctx
}
