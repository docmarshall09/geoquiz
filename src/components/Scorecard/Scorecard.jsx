// Country metadata scorecard — shown in Learn Mode as a map callout near the click point

import { useState, useEffect, useLayoutEffect, useRef } from 'react'

const KM2_TO_MI2 = 0.386102
const CARD_W = 340   // card pixel width (matches w-[340px] below)
const GAP = 28       // gap between click point and card edge
const EDGE = 10      // minimum distance from viewport edge
const NAV_H = 60     // nav bar height

function fmt(n) { return n.toLocaleString() }
function fmtCurrency(n) { return n ? '$' + n.toLocaleString() : '—' }
function fmtArea(km2) {
  if (!km2 && km2 !== 0) return '—'
  return `${km2.toLocaleString()} km² / ${Math.round(km2 * KM2_TO_MI2).toLocaleString()} mi²`
}
function fmtPop(n) { return (!n && n !== 0) ? '—' : n.toLocaleString() }

/**
 * Compute card {left, top} so the card appears near the click point.
 * Prefers placing the card to the right; falls back to left.
 * Centers the card vertically on the click point, clamped to safe bounds.
 */
function computePos(cx, cy, cardH) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const rightEdge = cx + GAP + CARD_W
  const placeRight = rightEdge <= vw - EDGE

  const left = placeRight ? cx + GAP : cx - GAP - CARD_W
  const rawTop = cy - cardH / 2
  const minTop = NAV_H + EDGE
  const maxTop = vh - EDGE - cardH
  const top = Math.max(minTop, Math.min(maxTop, rawTop))

  return { left, top }
}

/**
 * Return which corner of the card is closest to the click point.
 * Used as the leader line endpoint on the card side.
 */
function nearestCorner(cx, cy, left, top, cardH) {
  const corners = [
    { x: left,          y: top,         ox: 'left',  oy: 'top'    },
    { x: left + CARD_W, y: top,         ox: 'right', oy: 'top'    },
    { x: left,          y: top + cardH, ox: 'left',  oy: 'bottom' },
    { x: left + CARD_W, y: top + cardH, ox: 'right', oy: 'bottom' },
  ]
  let best = corners[0], bestDist = Infinity
  for (const c of corners) {
    const d = Math.hypot(c.x - cx, c.y - cy)
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best
}

export default function Scorecard({ country, clickCoords, onClose }) {
  const cardRef = useRef(null)
  const [pos, setPos] = useState(null)       // { left, top } | null
  const [corner, setCorner] = useState(null) // nearest corner to click
  const [visible, setVisible] = useState(false)

  // Re-position whenever country or click location changes
  useLayoutEffect(() => {
    if (!country || !clickCoords || !cardRef.current) return

    const cardH = cardRef.current.offsetHeight
    const { left, top } = computePos(clickCoords.x, clickCoords.y, cardH)
    const nc = nearestCorner(clickCoords.x, clickCoords.y, left, top, cardH)

    if (!pos) {
      // First appear: snap to position, then trigger transition in
      setPos({ left, top })
      setCorner(nc)
      // Double-RAF so the browser commits the initial position before we set visible
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else {
      // Country changed: animate to new position
      setPos({ left, top })
      setCorner(nc)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.iso_numeric, clickCoords?.x, clickCoords?.y])

  // Reset when country is deselected
  useEffect(() => {
    if (!country) {
      setVisible(false)
      // Delay clearing pos until fade is done
      const t = setTimeout(() => setPos(null), 200)
      return () => clearTimeout(t)
    }
  }, [country])

  if (!country) return null

  const cx = clickCoords?.x ?? 0
  const cy = clickCoords?.y ?? 0

  // During the brief pre-visible phase, park the card off-screen so it doesn't flash
  const cardStyle = {
    position: 'absolute',
    width: CARD_W,
    top: pos ? pos.top : -9999,
    left: pos ? pos.left : -9999,
    transition: visible
      ? 'left 0.22s cubic-bezier(.4,0,.2,1), top 0.22s cubic-bezier(.4,0,.2,1), opacity 0.18s ease, transform 0.18s ease'
      : 'opacity 0.18s ease, transform 0.18s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.93)',
    transformOrigin: corner ? `${corner.ox} ${corner.oy}` : 'center center',
    background: 'rgba(10, 18, 34, 0.96)',
    border: '1px solid rgba(255,255,255,0.09)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)',
    borderRadius: 14,
    overflow: 'hidden',
    zIndex: 10,
  }

  return (
    <>
      {/* SVG leader line — sits above the map, below the card */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 9, overflow: 'visible' }}
      >
        {corner && (
          <>
            <line
              x1={cx} y1={cy}
              x2={corner.x} y2={corner.y}
              stroke="rgba(77,128,208,0.55)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.18s ease' }}
            />
            <circle
              cx={cx} cy={cy} r={4}
              fill="#4d80d0"
              style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.18s ease' }}
            />
          </>
        )}
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
