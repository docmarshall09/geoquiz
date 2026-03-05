// Country metadata scorecard panel — shown in Learn Mode on country click

const KM2_TO_MI2 = 0.386102

function fmt(n) {
  return n.toLocaleString()
}

function fmtCurrency(n) {
  if (!n) return '—'
  return '$' + n.toLocaleString()
}

function fmtArea(km2) {
  if (!km2 && km2 !== 0) return '—'
  const mi2 = Math.round(km2 * KM2_TO_MI2)
  return `${km2.toLocaleString()} km² / ${mi2.toLocaleString()} mi²`
}

function fmtPop(n) {
  if (!n && n !== 0) return '—'
  return n.toLocaleString()
}

export default function Scorecard({ country, onClose }) {
  if (!country) return null

  return (
    <div
      className="absolute bottom-5 left-5 w-72 rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(13, 24, 41, 0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-4xl leading-none shrink-0">{country.flag_emoji}</span>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">
              {country.name}
            </h2>
            {country.official_name !== country.name && (
              <p className="text-white/40 text-xs leading-tight mt-0.5 truncate">
                {country.official_name}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none ml-2 shrink-0 mt-0.5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-2.5">
        <Row label="Capital" value={country.capital || '—'} />
        <Row label="Region" value={country.region} />
        <Row label="Population" value={country.population ? fmtPop(country.population) : '—'} />
        <Row label="Area" value={fmtArea(country.area_km2)} />
        <Row label="GDP per capita" value={fmtCurrency(country.gdp_ppp_per_capita)} />
        {country.is_territory && (
          <p className="text-xs text-amber-400/70 pt-0.5">Territory / dependency</p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className="text-white/85 text-sm text-right leading-snug">{value}</span>
    </div>
  )
}
