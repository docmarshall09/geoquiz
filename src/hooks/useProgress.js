// localStorage progress tracking — per-country stats for spaced repetition

const STORAGE_KEY = 'geoquiz_progress'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function useProgress() {
  /** Record a quiz attempt for a country. */
  function recordAttempt(isoNumeric, isCorrect) {
    const progress = load()
    const entry = progress[isoNumeric] ?? {
      seen: 0,
      correct: 0,
      incorrect: 0,
      streak: 0,
      lastSeen: null,
    }
    entry.seen++
    entry.lastSeen = Date.now()
    if (isCorrect) {
      entry.correct++
      entry.streak = (entry.streak ?? 0) + 1
    } else {
      entry.incorrect++
      entry.streak = 0
    }
    progress[isoNumeric] = entry
    save(progress)
  }

  /** Return the full progress map. */
  function getProgress() {
    return load()
  }

  /** Return progress for one country, or null if never seen. */
  function getCountryProgress(isoNumeric) {
    return load()[isoNumeric] ?? null
  }

  return { recordAttempt, getProgress, getCountryProgress }
}
