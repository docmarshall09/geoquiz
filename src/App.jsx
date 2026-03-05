import { useState } from 'react'
import Map from './components/Map/Map'
import Scorecard from './components/Scorecard/Scorecard'
import { getCountryByIsoNumeric } from './utils/countryData'

const MODES = ['Learn', 'Quiz', 'Quick Quiz']

export default function App() {
  const [mode, setMode] = useState('Learn')
  const [selectedCountryId, setSelectedCountryId] = useState(null)

  const selectedCountry = selectedCountryId
    ? getCountryByIsoNumeric(selectedCountryId)
    : null

  const handleCountryClick = (isoNumeric) => {
    if (mode !== 'Learn') return
    setSelectedCountryId(isoNumeric === selectedCountryId ? null : isoNumeric)
  }

  const handleMapBackground = () => {
    if (mode !== 'Learn') return
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
              onClick={() => {
                setMode(m)
                setSelectedCountryId(null)
              }}
              className={[
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                m !== 'Learn' ? 'opacity-40 cursor-not-allowed' : '',
              ].join(' ')}
              disabled={m !== 'Learn'}
            >
              {m}
            </button>
          ))}
        </nav>
      </div>

      {/* Map + Scorecard layer */}
      <div className="relative" style={{ height: 'calc(100vh - 60px)' }}>
        <Map
          mode={mode}
          selectedCountryId={selectedCountryId}
          onCountryClick={handleCountryClick}
          onBackgroundClick={handleMapBackground}
        />
        {selectedCountry && (
          <Scorecard
            country={selectedCountry}
            onClose={() => setSelectedCountryId(null)}
          />
        )}
      </div>
    </div>
  )
}
