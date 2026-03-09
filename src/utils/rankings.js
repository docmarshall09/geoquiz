/**
 * rankings.js — precomputes global rank maps for numeric country stats.
 *
 * Rankings are computed once at module load across sovereign nations only (195 countries).
 * Rank 1 = highest value for all fields (largest population, largest area, highest GDP).
 * Territories and null values are excluded from ranking.
 *
 * Usage:
 *   import { getRank } from './rankings'
 *   getRank('population', country.name)  // → 3  (or null if territory/no data)
 */

import countriesRaw from './countryData'

/**
 * Build a rank map for one field across sovereign nations.
 * Returns a Map of country name → rank (1-based, 1 = highest).
 */
function buildRankMap(field) {
  const sovereigns = countriesRaw.filter((c) => !c.is_territory && c[field] != null)
  sovereigns.sort((a, b) => b[field] - a[field])
  const map = new Map()
  sovereigns.forEach((c, i) => map.set(c.name, i + 1))
  return map
}

const rankMaps = {
  population: buildRankMap('population'),
  area_km2: buildRankMap('area_km2'),
  gdp_ppp_per_capita: buildRankMap('gdp_ppp_per_capita'),
}

/**
 * Return ordinal suffix for a number (1→"st", 2→"nd", 3→"rd", 4+→"th").
 * Handles 11th, 12th, 13th correctly.
 */
export function ordinal(n) {
  const abs = Math.abs(n)
  const mod100 = abs % 100
  const mod10 = abs % 10
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}

/**
 * Look up the global rank for a country on a given field.
 *
 * @param {'population'|'area_km2'|'gdp_ppp_per_capita'} field
 * @param {string} countryName - the country's name field
 * @returns {number|null} rank (1-based) or null if not ranked
 */
export function getRank(field, countryName) {
  return rankMaps[field]?.get(countryName) ?? null
}
