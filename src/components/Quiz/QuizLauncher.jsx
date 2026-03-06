import { useState, useMemo } from 'react'
import { REGIONS, getFilteredCountries } from '../../utils/countryData'

const SCOPE_OPTIONS = [
  { value: 'nations', label: 'Nations only' },
  { value: 'both', label: 'Nations + Territories' },
  { value: 'territories', label: 'Territories only' },
]

const DIRECTIONS = [
  { value: 'name-to-map', label: 'Name → Map', hint: 'click' },
  { value: 'map-to-name', label: 'Map → Name', hint: 'type' },
]

export default function QuizLauncher({ onStart }) {
  const [selectedRegions, setSelectedRegions] = useState(new Set(REGIONS))
  const [scope, setScope] = useState('nations')
  const [direction, setDirection] = useState('name-to-map')

  const allSelected = selectedRegions.size === REGIONS.length

  const toggleAll = () => {
    setSelectedRegions(allSelected ? new Set() : new Set(REGIONS))
  }

  const toggleRegion = (region) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
  }

  const filteredCount = useMemo(
    () =>
      getFilteredCountries({
        regions: selectedRegions.size < REGIONS.length ? [...selectedRegions] : null,
        scope,
      }).length,
    [selectedRegions, scope],
  )

  const handleStart = () => {
    if (filteredCount === 0) return
    onStart({
      regions: selectedRegions.size < REGIONS.length ? [...selectedRegions] : null,
      scope,
      direction,
    })
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(10,15,26,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="rounded-2xl w-80 overflow-hidden"
        style={{
          background: 'rgba(13,24,41,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <h2 className="text-white font-bold text-xl">Quiz Setup</h2>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* ── Direction ── */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
              Direction
            </div>
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              {DIRECTIONS.map(({ value, label, hint }) => (
                <button
                  key={value}
                  onClick={() => setDirection(value)}
                  className={[
                    'flex-1 py-2.5 text-sm font-medium transition-colors',
                    direction === value
                      ? 'bg-blue-600 text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                  ].join(' ')}
                >
                  {label}
                  <span
                    className={`block text-[10px] font-normal mt-0.5 ${
                      direction === value ? 'text-blue-200/70' : 'text-white/30'
                    }`}
                  >
                    {hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Regions ── */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
              Regions
            </div>

            {/* All toggle */}
            <label className="flex items-center gap-2.5 mb-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                All Regions
              </span>
            </label>

            {/* Individual regions */}
            <div className="ml-1 space-y-1.5">
              {REGIONS.map((region) => (
                <label
                  key={region}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegions.has(region)}
                    onChange={() => toggleRegion(region)}
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-white/55 text-sm group-hover:text-white/80 transition-colors">
                    {region}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Scope ── */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
              Scope
            </div>
            <div className="space-y-1.5">
              {SCOPE_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => setScope(value)}
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span
                    className={`text-sm transition-colors ${
                      scope === value ? 'text-white' : 'text-white/55 group-hover:text-white/80'
                    }`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer: count + start button ── */}
        <div className="px-6 pb-6 pt-1">
          <div className="text-white/35 text-xs mb-4">
            {filteredCount === 0 ? (
              <span className="text-red-400/70">No countries selected</span>
            ) : (
              <>
                <span className="text-white/60 font-medium">{filteredCount}</span> countries in this round
              </>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={filteredCount === 0}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
