import { useState, useEffect, useMemo, useCallback } from 'react'
import { getCountryByIsoNumeric } from '../utils/countryData'
import { useProgress } from './useProgress'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Quiz state machine for Name→Map mode.
 *
 * Phases:
 *   'asking'    — waiting for the user to click a country
 *   'correct'   — correct click; auto-advances after 1.5 s
 *   'incorrect' — wrong click; user must click Next manually
 *   'complete'  — all countries exhausted; show round summary
 *
 * @param {Array|null} countries — the filtered country list to quiz on.
 *   null means the quiz is inactive. Pass a new array reference to start/restart.
 */
export function useQuiz(countries) {
  const { recordAttempt } = useProgress()

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('asking')
  const [clickedId, setClickedId] = useState(null)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [wrongList, setWrongList] = useState([])

  // ── Start a new round whenever the countries list changes (new launch) ───
  useEffect(() => {
    if (!countries) return
    setQueue(shuffle(countries))
    setIndex(0)
    setPhase('asking')
    setClickedId(null)
    setScore({ correct: 0, incorrect: 0 })
    setWrongList([])
  }, [countries]) // reference changes only when launcher fires "Start Quiz"

  // ── Auto-advance after correct ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'correct') return
    const timer = setTimeout(() => {
      setIndex((prev) => {
        const next = prev + 1
        if (next >= queue.length) {
          setPhase('complete')
          return prev
        }
        setPhase('asking')
        setClickedId(null)
        return next
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, queue.length])

  const currentCountry = queue[index] ?? null

  // ── Click handler (called by App when a map country is clicked) ──────────
  const handleCountryClick = useCallback(
    (isoNumeric) => {
      if (phase !== 'asking' || !currentCountry) return

      const isCorrect = isoNumeric === currentCountry.iso_numeric
      recordAttempt(currentCountry.iso_numeric, isCorrect)

      setClickedId(isoNumeric)
      if (isCorrect) {
        setPhase('correct')
        setScore((s) => ({ ...s, correct: s.correct + 1 }))
      } else {
        setPhase('incorrect')
        setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }))
        setWrongList((wl) => [...wl, currentCountry])
      }
    },
    [phase, currentCountry, recordAttempt],
  )

  // ── Manual advance (after incorrect) ────────────────────────────────────
  const handleNext = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1
      if (next >= queue.length) {
        setPhase('complete')
        return prev
      }
      setPhase('asking')
      setClickedId(null)
      return next
    })
  }, [queue.length])

  // ── Map highlights: { [isoNumeric]: 'correct' | 'wrong' | 'correct-reveal' } ──
  const highlights = useMemo(() => {
    const h = {}
    if (phase === 'correct' && currentCountry) {
      h[currentCountry.iso_numeric] = 'correct'
    } else if (phase === 'incorrect') {
      if (clickedId) h[clickedId] = 'wrong'
      if (currentCountry) h[currentCountry.iso_numeric] = 'correct-reveal'
    }
    return h
  }, [phase, clickedId, currentCountry])

  return {
    currentCountry,
    phase,
    score,
    position: { current: index + 1, total: queue.length },
    highlights,
    clickedCountry: clickedId ? getCountryByIsoNumeric(clickedId) : null,
    wrongList,
    handleCountryClick,
    handleNext,
  }
}
