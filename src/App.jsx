import { useState, useMemo } from 'react'
import Map from './components/Map/Map'
import Scorecard from './components/Scorecard/Scorecard'
import QuizOverlay from './components/Quiz/QuizOverlay'
import QuizLauncher from './components/Quiz/QuizLauncher'
import { getCountryByIsoNumeric, getFilteredCountries } from './utils/countryData'
import { useQuiz } from './hooks/useQuiz'

const MODES = ['Learn', 'Quiz', 'Quick Quiz']

export default function App() {
  const [mode, setMode] = useState('Learn')
  const [selectedCountryId, setSelectedCountryId] = useState(null)

  // Quiz launcher state: null = not launched, options object = launched
  const [quizOptions, setQuizOptions] = useState(null)

  // Stable country list passed to useQuiz — new reference only when launcher fires
  const quizCountries = useMemo(
    () => (quizOptions ? getFilteredCountries(quizOptions) : null),
    [quizOptions],
  )

  const quiz = useQuiz(quizCountries, quizOptions?.direction ?? 'name-to-map')

  const selectedCountry =
    mode === 'Learn' && selectedCountryId
      ? getCountryByIsoNumeric(selectedCountryId)
      : null

  const handleCountryClick = (isoNumeric) => {
    if (mode === 'Learn') {
      setSelectedCountryId(isoNumeric === selectedCountryId ? null : isoNumeric)
    } else if (mode === 'Quiz' && quizOptions && quizOptions.direction !== 'map-to-name') {
      quiz.handleCountryClick(isoNumeric)
    }
  }

  const handleMapBackground = () => {
    if (mode === 'Learn') setSelectedCountryId(null)
  }

  const handleModeChange = (m) => {
    setMode(m)
    setSelectedCountryId(null)
    setQuizOptions(null) // reset launcher when switching away
  }

  const handleStartQuiz = (options) => {
    // Setting new options triggers useMemo → new array reference → useQuiz restarts
    setQuizOptions({ ...options })
  }

  const handleRestartQuiz = () => {
    // Force a new array reference so useQuiz re-shuffles
    setQuizOptions((prev) => ({ ...prev }))
  }

  const quizLaunched = mode === 'Quiz' && quizOptions !== null

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
                m === 'Quick Quiz' ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
              disabled={m === 'Quick Quiz'}
            >
              {m}
            </button>
          ))}
        </nav>
      </div>

      {/* Map + overlay layer */}
      <div className="relative" style={{ height: 'calc(100vh - 60px)' }}>
        <Map
          mode={mode}
          selectedCountryId={selectedCountryId}
          onCountryClick={handleCountryClick}
          onBackgroundClick={handleMapBackground}
          quizHighlights={quizLaunched ? quiz.highlights : null}
        />

        {/* Learn Mode: scorecard panel */}
        {mode === 'Learn' && selectedCountry && (
          <Scorecard
            country={selectedCountry}
            onClose={() => setSelectedCountryId(null)}
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
      </div>
    </div>
  )
}
