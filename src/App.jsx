import { useState } from 'react'
import Map from './components/Map/Map'
import Scorecard from './components/Scorecard/Scorecard'
import QuizOverlay from './components/Quiz/QuizOverlay'
import { getCountryByIsoNumeric } from './utils/countryData'
import { useQuiz } from './hooks/useQuiz'

const MODES = ['Learn', 'Quiz', 'Quick Quiz']

export default function App() {
  const [mode, setMode] = useState('Learn')
  const [selectedCountryId, setSelectedCountryId] = useState(null)

  const quiz = useQuiz(mode === 'Quiz')

  const selectedCountry =
    mode === 'Learn' && selectedCountryId
      ? getCountryByIsoNumeric(selectedCountryId)
      : null

  const handleCountryClick = (isoNumeric) => {
    if (mode === 'Learn') {
      setSelectedCountryId(isoNumeric === selectedCountryId ? null : isoNumeric)
    } else if (mode === 'Quiz') {
      quiz.handleCountryClick(isoNumeric)
    }
  }

  const handleMapBackground = () => {
    if (mode === 'Learn') setSelectedCountryId(null)
    // Quiz: ocean clicks do nothing
  }

  const handleModeChange = (m) => {
    setMode(m)
    setSelectedCountryId(null)
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0f1a]">
      {/* Nav */}
      <div className="h-[60px] flex items-center px-6 border-b border-white/5 gap-8">
        <span className="text-white font-bold tracking-tight text-lg shrink-0">GeoQuiz</span>

        {/* Mode switcher */}
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
          quizHighlights={mode === 'Quiz' ? quiz.highlights : null}
        />

        {/* Learn Mode: scorecard panel */}
        {mode === 'Learn' && selectedCountry && (
          <Scorecard
            country={selectedCountry}
            onClose={() => setSelectedCountryId(null)}
          />
        )}

        {/* Quiz Mode: question prompt + feedback overlay */}
        {mode === 'Quiz' && (
          <QuizOverlay
            currentCountry={quiz.currentCountry}
            phase={quiz.phase}
            score={quiz.score}
            position={quiz.position}
            clickedCountry={quiz.clickedCountry}
            wrongList={quiz.wrongList}
            onNext={quiz.handleNext}
            onRestart={quiz.handleRestart}
          />
        )}
      </div>
    </div>
  )
}
