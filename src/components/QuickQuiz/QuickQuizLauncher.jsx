import { useState, useMemo } from 'react'
import { REGIONS, getFilteredCountries } from '../../utils/countryData'
import { useProgress } from '../../hooks/useProgress'

const SCOPE_OPTIONS = [
  { value: 'nations', label: 'Nations only' },
  { value: 'both', label: 'Nations + Territories' },
  { value: 'territories', label: 'Territories only' },
]

const DIRECTIONS = [
  { value: 'name-to-map', label: 'Name → Map', hint: 'click' },
  { value: 'map-to-name', label: 'Map → Name', hint: 'type' },
]

const QQ_COUNT = 10

export default function QuickQuizLauncher({ onStart }) {
  const [selectedRegions, setSelectedRegions] = useState(new Set(REGIONS))
  const [scope, setScope] = useState('nations')
  const [direction, setDirection] = useState('name-to-map')
  const [weakSpots, setWeakSpots] = useState(false)

  const { getProgress } = useProgress()

  const allSelected = selectedRegions.size === REGIONS.length

  const toggleAll = () => setSelectedRegions(allSelected ? new Set() : new Set(REGIONS))

  const toggleRegion = (region) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev)
      if (next.has(region)) next.delete(region)
      else next.add(region)
      return next
    })
  }

  // Compute question count and any note for the footer.
  // getProgress reads from localStorage synchronously; intentionally omitted from
  // deps since it's a new fn reference every render — weakSpots change is the trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { questionCount, noProgressNote } = useMemo(() => {
    // Weak spots: ignore regions, use full scope pool
    const pool = weakSpots
      ? getFilteredCountries({ scope })
      : getFilteredCountries({
          regions: selectedRegions.size < REGIONS.length ? [...selectedRegions] : null,
          scope,
        })

    const qCount = Math.min(QQ_COUNT, pool.length)

    let note = null
    if (weakSpots) {
      const progress = getProgress()
      if (Object.keys(progress).length === 0) {
        note = 'Play more to unlock Weak Spots targeting'
      }
    }

    return { questionCount: qCount, noProgressNote: note }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weakSpots, selectedRegions, scope])

  const handleStart = () => {
    if (questionCount === 0) return
    onStart({
      // When weakSpots is on, ignore regions (App handles the selection logic)
      regions: !weakSpots && selectedRegions.size < REGIONS.length ? [...selectedRegions] : null,
      scope,
      direction,
      weakSpots,
    })
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(10,15,26,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="rounded-2xl w-80 flex flex-col"
        style={{
          maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(13,24,41,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
          <h2 className="text-white font-bold text-xl">Quick Quiz</h2>
          <p className="text-white/35 text-xs mt-0.5">10 questions · fast practice</p>
        </div>

        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
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

          {/* ── Weak Spots toggle ── */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
              Mode
            </div>
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="min-w-0 pr-4">
                <div className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                  Weak Spots
                </div>
                <div className="text-white/35 text-[11px] mt-0.5 leading-tight">
                  Target your lowest-accuracy countries
                </div>
              </div>
              {/* Toggle pill */}
              <div
                onClick={() => setWeakSpots((w) => !w)}
                className={[
                  'relative w-10 h-5 rounded-full transition-colors shrink-0',
                  weakSpots ? 'bg-blue-600' : 'bg-white/15',
                ].join(' ')}
              >
                <div
                  className={[
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                    weakSpots ? 'left-5' : 'left-0.5',
                  ].join(' ')}
                />
              </div>
            </label>
            {noProgressNote && (
              <p className="text-white/30 text-[11px] mt-2 italic leading-tight">
                {noProgressNote}
              </p>
            )}
          </div>

          {/* ── Regions (hidden in weak spots mode — regions are ignored there) ── */}
          {!weakSpots && (
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
                Regions
              </div>
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
              <div className="ml-1 space-y-1.5">
                {REGIONS.map((region) => (
                  <label key={region} className="flex items-center gap-2.5 cursor-pointer group">
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
          )}

          {/* ── Scope ── */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
              Scope
            </div>
            <div className="space-y-1.5">
              {SCOPE_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="qq-scope"
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

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 shrink-0 border-t border-white/5">
          <div className="text-white/35 text-xs mb-4">
            {questionCount === 0 ? (
              <span className="text-red-400/70">No countries available</span>
            ) : questionCount < QQ_COUNT ? (
              <>
                <span className="text-white/60 font-medium">{questionCount}</span>
                {' '}questions{' '}
                <span className="text-white/25">(pool smaller than 10)</span>
              </>
            ) : (
              <>
                <span className="text-white/60 font-medium">{questionCount}</span> questions
              </>
            )}
          </div>
          <button
            onClick={handleStart}
            disabled={questionCount === 0}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            Start Quick Quiz
          </button>
        </div>
      </div>
    </div>
  )
}
