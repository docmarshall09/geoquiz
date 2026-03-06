import { useState, useEffect, useMemo, useCallback } from 'react'
import { getCountryByIsoNumeric } from '../utils/countryData'
import { matchesCountry } from '../utils/fuzzyMatch'
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
 * Quiz state machine — supports both Name→Map (click) and Map→Name (type) directions.
 *
 * Phases: 'asking' | 'correct' | 'incorrect' | 'complete'
 *
 * @param {Array|null} countries  — filtered country list; new reference = restart
 * @param {'name-to-map'|'map-to-name'} direction
 */
export function useQuiz(countries, direction = 'name-to-map') {
  const { recordAttempt } = useProgress()

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('asking')
  // Name→Map: stores isoNumeric of clicked country
  // Map→Name: stores the raw text the user typed
  const [answerId, setAnswerId] = useState(null)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [wrongList, setWrongList] = useState([])

  // ── Start/restart when countries list changes ────────────────────────────
  useEffect(() => {
    if (!countries) return
    setQueue(shuffle(countries))
    setIndex(0)
    setPhase('asking')
    setAnswerId(null)
    setScore({ correct: 0, incorrect: 0 })
    setWrongList([])
  }, [countries])

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
        setAnswerId(null)
        return next
      })
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, queue.length])

  const currentCountry = queue[index] ?? null

  // ── Shared answer resolution ─────────────────────────────────────────────
  const resolveAnswer = useCallback(
    (isCorrect) => {
      recordAttempt(currentCountry.iso_numeric, isCorrect)
      if (isCorrect) {
        setPhase('correct')
        setScore((s) => ({ ...s, correct: s.correct + 1 }))
      } else {
        setPhase('incorrect')
        setScore((s) => ({ ...s, incorrect: s.incorrect + 1 }))
        setWrongList((wl) => [...wl, currentCountry])
      }
    },
    [currentCountry, recordAttempt],
  )

  // ── Name→Map: map country click ──────────────────────────────────────────
  const handleCountryClick = useCallback(
    (isoNumeric) => {
      if (direction !== 'name-to-map' || phase !== 'asking' || !currentCountry) return
      setAnswerId(isoNumeric)
      resolveAnswer(isoNumeric === currentCountry.iso_numeric)
    },
    [direction, phase, currentCountry, resolveAnswer],
  )

  // ── Map→Name: typed answer submission ────────────────────────────────────
  const handleTextSubmit = useCallback(
    (input) => {
      if (direction !== 'map-to-name' || phase !== 'asking' || !currentCountry) return
      const trimmed = input.trim()
      if (!trimmed) return
      setAnswerId(trimmed)
      resolveAnswer(matchesCountry(trimmed, currentCountry))
    },
    [direction, phase, currentCountry, resolveAnswer],
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
      setAnswerId(null)
      return next
    })
  }, [queue.length])

  // ── Map highlights ───────────────────────────────────────────────────────
  const highlights = useMemo(() => {
    const h = {}
    if (!currentCountry) return h

    if (direction === 'name-to-map') {
      if (phase === 'correct') {
        h[currentCountry.iso_numeric] = 'correct'
      } else if (phase === 'incorrect') {
        if (answerId) h[answerId] = 'wrong'
        h[currentCountry.iso_numeric] = 'correct-reveal'
      }
    } else {
      // Map→Name: show target during asking, then result color
      if (phase === 'asking') {
        h[currentCountry.iso_numeric] = 'target'
      } else if (phase === 'correct') {
        h[currentCountry.iso_numeric] = 'correct'
      } else if (phase === 'incorrect') {
        h[currentCountry.iso_numeric] = 'wrong'
      }
    }
    return h
  }, [direction, phase, answerId, currentCountry])

  return {
    currentCountry,
    phase,
    score,
    position: { current: index + 1, total: queue.length },
    highlights,
    clickedCountry: direction === 'name-to-map' && answerId ? getCountryByIsoNumeric(answerId) : null,
    typedAnswer: direction === 'map-to-name' ? answerId : null,
    wrongList,
    handleCountryClick,
    handleTextSubmit,
    handleNext,
  }
}
