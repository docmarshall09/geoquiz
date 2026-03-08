// Country metadata scorecard — shown in Learn Mode as a map callout near the click point

import { useState, useEffect, useLayoutEffect, useRef } from 'react'

const KM2_TO_MI2 = 0.386102
const CARD_W = 340  // card pixel width
const GAP = 28      // gap between click point and nearest card edge
const EDGE = 10     // minimum margin from container edge
const NAV_H = 60    // nav bar height — map container starts below this in the viewport

function fmtCurrency(n) { return n ? '$' + n.toLocaleString() : '—' }
function fmtArea(km2) {
  if (!km2 && km2 !== 0) return '—'
  return `${km2.toLocaleString()} km² / ${Math.round(km2 * KM2_TO_MI2).toLocaleString()} mi²`
}
function fmtPop(n) { return (!n && n !== 0) ? '—' : n.toLocaleString() }

/**
 * Compute card position in map-container coordinates.
 * cx/cy are already container-relative (viewport coords minus NAV_H offset for y).
 * Prefers placing the card to the right of the click; falls back to left.
 * Centers vertically on click, clamped to container bounds.
 */
function computePos(cx, cy, cardH) {
  const vw = window.innerWidth
  const containerH = window.innerHeight - NAV_H

  const placeRight = cx + GAP + CARD_W <= vw - EDGE
  const left = placeRight ? cx + GAP : cx - GAP - CARD_W
  const rawTop = cy - cardH / 2
  const top = Math.max(EDGE, Math.min(containerH - EDGE - cardH, rawTop))

  return { left, top }
}

export default function Scorecard({ country, clickCoords, onClose }) {
  const cardRef = useRef(null)
  const [pos, setPos] = useState(null)     // { left, top, cardH } in container coords
  const [visible, setVisible] = useState(false)

  // Convert viewport click coords to map-container coords.
  // The SVG is absolute inset-0 inside the container (which starts at y=NAV_H in viewport).
  const cx = clickCoords?.x ?? 0
  const cy = (clickCoords?.y ?? 0) - NAV_H

  useLayoutEffect(() => {
    if (!country || !clickCoords || !cardRef.current) return

    const cardH = cardRef.current.offsetHeight
    const { left, top } = computePos(cx, cy, cardH)

    if (!pos) {
      // First appear: snap to position, then fade/scale in
      setPos({ left, top, cardH })
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      // Country changed: animate to new position
      setPos({ left, top, cardH })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.iso_numeric, clickCoords?.x, clickCoords?.y])

  useEffect(() => {
    if (!country) {
      setVisible(false)
      const t = setTimeout(() => setPos(null), 220)
      return () => clearTimeout(t)
    }
  }, [country])

  if (!country) return null

  // All four card corners for the fan lines (in container coords)
  const corners = pos ? [
    { x: pos.left,          y: pos.top             },
    { x: pos.left + CARD_W, y: pos.top             },
    { x: pos.left,          y: pos.top + pos.cardH },
    { x: pos.left + CARD_W, y: pos.top + pos.cardH },
  ] : []

  // Nearest corner drives the scale-animation origin
  let txOrigin = 'center center'
  if (pos) {
    const oxWord = cx <= pos.left + CARD_W / 2 ? 'left' : 'right'
    const oyWord = cy <= pos.top  + pos.cardH / 2 ? 'top' : 'bottom'
    txOrigin = `${oxWord} ${oyWord}`
  }

  const cardStyle = {
    position: 'absolute',
    width: CARD_W,
    top: pos ? pos.top : -9999,
    left: pos ? pos.left : -9999,
    transition: visible
      ? 'left 0.22s cubic-bezier(.4,0,.2,1), top 0.22s cubic-bezier(.4,0,.2,1), opacity 0.2s ease, transform 0.2s ease'
      : 'opacity 0.2s ease, transform 0.2s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.94)',
    transformOrigin: txOrigin,
    background: 'rgba(9, 15, 28, 0.97)',
    border: '1px solid rgba(255,255,255,0.10)',
    backdropFilter: 'blur(20px)',
    boxShadow: [
      '0 12px 48px rgba(0,0,0,0.65)',
      '0 2px 10px rgba(0,0,0,0.45)',
      '0 0 0 1px rgba(77,128,208,0.12)',
    ].join(', '),
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 10,
  }

  return (
    <>
      {/* SVG fan lines + origin dot — above map, below card */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 9, overflow: 'visible' }}
      >
        {corners.map((c, i) => (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={c.x} y2={c.y}
            stroke="rgba(130,175,245,0.2)"
            strokeWidth={1}
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
          />
        ))}
        <circle
          cx={cx} cy={cy} r={4.5}
          fill="rgba(100,155,230,0.85)"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.2s ease' }}
        />
      </svg>

      {/* Card */}
      <div ref={cardRef} style={cardStyle}>
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
          <Row label="Capital"       value={country.capital || '—'} />
          <Row label="Region"        value={country.region} />
          <Row label="Population"    value={country.population ? fmtPop(country.population) : '—'} />
          <Row label="Area"          value={fmtArea(country.area_km2)} />
          <Row label="GDP per capita" value={fmtCurrency(country.gdp_ppp_per_capita)} />
          {country.is_territory && (
            <p className="text-xs text-amber-400/70 pt-0.5">Territory / dependency</p>
          )}
        </div>
      </div>
    </>
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
