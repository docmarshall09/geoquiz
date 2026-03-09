/**
 * travelScore.js — computes a composite "Travel Score" (1–10) for sovereign nations.
 *
 * Three components, each normalized to a 1–10 scale:
 *   1. Safety Score   (35%) — from travel_advisory (1-4), stepped mapping
 *   2. Arrivals Score (35%) — log-scaled tourist arrivals
 *   3. Dollar Stretch (30%) — how far USD goes, log-scaled PPP ratio vs US
 *
 * Scores are precomputed at module load. Territories always return null.
 * Countries missing any component return null (no score shown).
 *
 * Special case: null travel_advisory is treated as Level 1 (safest) because
 * the US State Dept doesn't issue advisories for domestic travel.
 */

import countriesRaw from './countryData'

// Fetch supplemental (travel advisory) and tourist arrivals in parallel
const [suppRaw, arrivalsRaw] = await Promise.all([
  fetch('/data/geoquiz_supplemental_data.json').then((r) => r.json()),
  fetch('/data/tourist_arrivals.json').then((r) => r.json()),
])

const suppMap = suppRaw.countries    // { "France": { travel_advisory, ... }, ... }
const arrivalsMap = arrivalsRaw      // { "France": { arrivals, data_year }, ... }

// ── Component helpers ────────────────────────────────────────────────────────

const SAFETY_SCORES = { 1: 10, 2: 8, 3: 4, 4: 1 }

function safetyScore(countryName) {
  const supp = suppMap[countryName]
  const advisory = supp?.travel_advisory ?? null
  if (advisory === null) return 10  // no advisory issued → assume safest (e.g. United States)
  return SAFETY_SCORES[advisory] ?? null
}

// Log-scale arrivals normalization across sovereign nations with data
const sovereignArrivals = countriesRaw
  .filter((c) => !c.is_territory)
  .map((c) => arrivalsMap[c.name]?.arrivals)
  .filter((n) => n != null && n > 0)

const LN_MIN = Math.log(Math.min(...sovereignArrivals))
const LN_MAX = Math.log(Math.max(...sovereignArrivals))

function arrivalsScore(countryName) {
  const n = arrivalsMap[countryName]?.arrivals
  if (n == null || n <= 0) return null
  return 1 + 9 * (Math.log(n) - LN_MIN) / (LN_MAX - LN_MIN)
}

// Dollar stretch: centered on US GDP PPP, log-scaled PPP ratio
const US = countriesRaw.find((c) => c.name === 'United States')
const US_GDP = US?.gdp_ppp_per_capita ?? 65000

function dollarStretchScore(gdpPpp) {
  if (!gdpPpp) return null
  const ratio = US_GDP / gdpPpp
  const raw = 3 * Math.log(ratio) + 5
  return Math.min(10, Math.max(1, raw))
}

// ── Precompute scores ────────────────────────────────────────────────────────

/**
 * @typedef {{ score: number, safety: number, arrivals: number, dollarStretch: number }} TravelScore
 */

/** Map of country name → TravelScore (only sovereign nations with all three components) */
const scoreMap = new Map()

for (const country of countriesRaw) {
  if (country.is_territory) continue

  const safety = safetyScore(country.name)
  const arrivals = arrivalsScore(country.name)
  const dollarStretch = dollarStretchScore(country.gdp_ppp_per_capita)

  if (safety === null || arrivals === null || dollarStretch === null) continue

  const composite = 0.35 * safety + 0.35 * arrivals + 0.30 * dollarStretch
  scoreMap.set(country.name, {
    score: Math.round(composite * 10) / 10,
    safety,
    arrivals,
    dollarStretch,
  })
}

/**
 * Get the precomputed travel score for a sovereign nation.
 * Returns null for territories or countries missing data.
 *
 * @param {string} countryName
 * @returns {TravelScore|null}
 */
export function getTravelScore(countryName) {
  return scoreMap.get(countryName) ?? null
}
