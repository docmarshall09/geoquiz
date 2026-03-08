import { useState, useMemo, useEffect, useRef } from 'react'
import Map from './components/Map/Map'
import Scorecard from './components/Scorecard/Scorecard'
import QuizOverlay from './components/Quiz/QuizOverlay'
import QuizLauncher from './components/Quiz/QuizLauncher'
import QuickQuizLauncher from './components/QuickQuiz/QuickQuizLauncher'
import QuickQuizResults from './components/QuickQuiz/QuickQuizResults'
import DataTab from './components/DataTab/DataTab'
import { getCountryByIsoNumeric, getFilteredCountries } from './utils/countryData'
import { useQuiz } from './hooks/useQuiz'
import { useProgress } from './hooks/useProgress'

const MODES = ['Learn', 'Quiz', 'Quick Quiz', 'Data']
const QQ_COUNT = 10
const MIN_ATTEMPTS = 5

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pure function — builds the Quick Quiz country list.
 * Called at launch time so getProgress() reflects the latest localStorage state.
 */
function buildQQCountries(options, progress) {
  const pool = getFilteredCountries({ regions: options.regions, scope: options.scope })

  if (!options.weakSpots) {
    return shuffleArr(pool).slice(0, QQ_COUNT)
  }

  // Weak Spots: sort by worst accuracy among countries with enough attempts
  const withData = pool.filter((c) => {
    const p = progress[c.iso_numeric]
    return p && p.seen >= MIN_ATTEMPTS
  })

  withData.sort((a, b) => {
    const pa = progress[a.iso_numeric]
    const pb = progress[b.iso_numeric]
    const accA = pa.correct / pa.seen
    const accB = pb.correct / pb.seen
    return accA - accB // ascending: worst accuracy first
  })

  const weakIds = new Set(withData.map((c) => c.iso_numeric))
  const unseen = shuffleArr(pool.filter((c) => !weakIds.has(c.iso_numeric)))

  // Take weakest countries first, backfill with unseen
  const selected = [...withData.slice(0, QQ_COUNT), ...unseen].slice(0, QQ_COUNT)
  return shuffleArr(selected)
}

export default function App() {
  const [mode, setMode] = useState('Learn')
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [clickCoords, setClickCoords] = useState(null)

  // ── Regular Quiz ──────────────────────────────────────────────────────────
  const [quizOptions, setQuizOptions] = useState(null)

  const quizCountries = useMemo(
    () => (quizOptions ? getFilteredCountries(quizOptions) : null),
    [quizOptions],
  )

  const quiz = useQuiz(quizCountries, quizOptions?.direction ?? 'name-to-map')

  // ── Quick Quiz ────────────────────────────────────────────────────────────
  const { getProgress } = useProgress()
  const [qqOptions, setQqOptions] = useState(null)

  // qqCountries rebuilt only when qqOptions changes (new reference = fresh quiz)
  const qqCountries = useMemo(
    () => (qqOptions ? buildQQCountries(qqOptions, getProgress()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qqOptions],
  )

  const quickQuiz = useQuiz(qqCountries, qqOptions?.direction ?? 'name-to-map')

  // Timer
  const qqStartTimeRef = useRef(null)
  const [qqElapsedSeconds, setQqElapsedSeconds] = useState(0)

  // Start timer when a new QQ is launched
  useEffect(() => {
    if (qqCountries) {
      qqStartTimeRef.current = Date.now()
      setQqElapsedSeconds(0)
    }
  }, [qqCountries])

  // Capture elapsed time when QQ completes
  useEffect(() => {
    if (quickQuiz.phase === 'complete' && qqStartTimeRef.current) {
      const elapsed = Math.round((Date.now() - qqStartTimeRef.current) / 1000)
      setQqElapsedSeconds(elapsed)
      qqStartTimeRef.current = null
    }
  }, [quickQuiz.phase])

  // ── Derived state ─────────────────────────────────────────────────────────
  const selectedCountry =
    mode === 'Learn' && selectedCountryId
      ? getCountryByIsoNumeric(selectedCountryId)
      : null

  const quizLaunched = mode === 'Quiz' && quizOptions !== null
  const qqLaunched = mode === 'Quick Quiz' && qqOptions !== null

  const activeHighlights = quizLaunched
    ? quiz.highlights
    : qqLaunched
      ? quickQuiz.highlights
      : null

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCountryClick = (isoNumeric, coords) => {
    if (mode === 'Learn') {
      if (isoNumeric === selectedCountryId) {
        setSelectedCountryId(null)
        setClickCoords(null)
      } else {
        setSelectedCountryId(isoNumeric)
        setClickCoords(coords ?? null)
      }
    } else if (mode === 'Quiz' && quizOptions && quizOptions.direction !== 'map-to-name') {
      quiz.handleCountryClick(isoNumeric)
    } else if (mode === 'Quick Quiz' && qqOptions && qqOptions.direction !== 'map-to-name') {
      quickQuiz.handleCountryClick(isoNumeric)
    }
  }

  const handleMapBackground = () => {
    if (mode === 'Learn') {
      setSelectedCountryId(null)
      setClickCoords(null)
    }
  }

  const handleModeChange = (m) => {
    setMode(m)
    setSelectedCountryId(null)
    setClickCoords(null)
    setQuizOptions(null)
    setQqOptions(null)
  }

  const handleStartQuiz = (options) => {
    setQuizOptions({ ...options })
  }

  const handleRestartQuiz = () => {
    setQuizOptions((prev) => ({ ...prev }))
  }

  const handleStartQQ = (options) => {
    setQqOptions({ ...options })
  }

  const handleRestartQQ = () => {
    // Force new object ref so qqCountries useMemo re-runs with a fresh shuffle
    setQqOptions((prev) => ({ ...prev }))
  }

  const handleQQChangeSettings = () => {
    setQqOptions(null)
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0f1a]">
      {/* Nav */}
      <div className="h-[60px] flex items-center px-6 border-b border-white/5 gap-8">
        <span className="text-white font-bold tracking-tight text-lg shrink-0">GeoQuiz</span>

        <nav className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              {m}
            </button>
          ))}
        </nav>
      </div>

      {/* Data tab — full-height, no map */}
      {mode === 'Data' && (
        <div style={{ height: 'calc(100vh - 60px)' }}>
          <DataTab />
        </div>
      )}

      {/* Map + overlay layer (hidden when Data tab is active) */}
      {mode !== 'Data' && (
      <div className="relative" style={{ height: 'calc(100vh - 60px)' }}>
        <Map
          mode={mode}
          selectedCountryId={selectedCountryId}
          onCountryClick={handleCountryClick}
          onBackgroundClick={handleMapBackground}
          quizHighlights={activeHighlights}
        />

        {/* Learn Mode: scorecard callout */}
        {mode === 'Learn' && selectedCountry && (
          <Scorecard
            country={selectedCountry}
            clickCoords={clickCoords}
            onClose={() => { setSelectedCountryId(null); setClickCoords(null) }}
          />
        )}

        {/* Quiz Mode: launcher or active quiz overlay */}
        {mode === 'Quiz' && !quizLaunched && (
          <QuizLauncher onStart={handleStartQuiz} />
        )}

        {mode === 'Quiz' && quizLaunched && (
          <QuizOverlay
            direction={quizOptions.direction ?? 'name-to-map'}
            currentCountry={quiz.currentCountry}
            phase={quiz.phase}
            score={quiz.score}
            position={quiz.position}
            clickedCountry={quiz.clickedCountry}
            typedAnswer={quiz.typedAnswer}
            wrongList={quiz.wrongList}
            onNext={quiz.handleNext}
            onTextSubmit={quiz.handleTextSubmit}
            onRestart={handleRestartQuiz}
          />
        )}

        {/* Quick Quiz Mode: launcher → gameplay → results */}
        {mode === 'Quick Quiz' && !qqLaunched && (
          <QuickQuizLauncher onStart={handleStartQQ} />
        )}

        {mode === 'Quick Quiz' && qqLaunched && quickQuiz.phase !== 'complete' && (
          <QuizOverlay
            direction={qqOptions.direction ?? 'name-to-map'}
            currentCountry={quickQuiz.currentCountry}
            phase={quickQuiz.phase}
            score={quickQuiz.score}
            position={quickQuiz.position}
            clickedCountry={quickQuiz.clickedCountry}
            typedAnswer={quickQuiz.typedAnswer}
            wrongList={quickQuiz.wrongList}
            onNext={quickQuiz.handleNext}
            onTextSubmit={quickQuiz.handleTextSubmit}
            onRestart={handleQQChangeSettings}
          />
        )}

        {mode === 'Quick Quiz' && qqLaunched && quickQuiz.phase === 'complete' && (
          <QuickQuizResults
            score={quickQuiz.score}
            total={quickQuiz.position.total}
            wrongList={quickQuiz.wrongList}
            elapsedSeconds={qqElapsedSeconds}
            onPlayAgain={handleRestartQQ}
            onChangeSettings={handleQQChangeSettings}
          />
        )}
      </div>
      )}
    </div>
  )
}
