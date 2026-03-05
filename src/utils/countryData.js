import Fuse from 'fuse.js'

// Fetched from public/data/ — keeps the file out of the JS bundle
// Top-level await suspends module evaluation until data is ready;
// all callers get synchronous-style access after the initial load.
const countriesRaw = await fetch('/data/countries.json').then((r) => r.json())

// Build lookup map once at module load
const byIsoNumeric = new Map(countriesRaw.map((c) => [c.iso_numeric, c]))

// Fuse.js instance for fuzzy name search
const fuse = new Fuse(countriesRaw, {
  keys: ['name', 'official_name', 'aliases'],
  threshold: 0.35,
  includeScore: true,
})

/** Look up a country by its ISO 3166-1 numeric string (e.g. "840" for USA). */
export function getCountryByIsoNumeric(id) {
  return byIsoNumeric.get(id) ?? null
}

/** Return all entries for a given region string. */
export function getCountriesByRegion(region) {
  return countriesRaw.filter((c) => c.region === region)
}

/** Return only sovereign nations (excludes territories/dependencies). */
export function getSovereignNations() {
  return countriesRaw.filter((c) => !c.is_territory)
}

/** The 7 regions used throughout the app (matches countries.json region values). */
export const REGIONS = [
  'North & Central America',
  'Caribbean',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania',
]

/**
 * Return countries matching the given scope and region filters.
 *
 * @param {object} opts
 * @param {string[]} opts.regions  - array of region strings to include, or null/[] for all
 * @param {'nations'|'territories'|'both'} opts.scope - which entity types to include
 */
export function getFilteredCountries({ regions = null, scope = 'nations' } = {}) {
  let pool = countriesRaw

  if (scope === 'nations') pool = pool.filter((c) => !c.is_territory)
  else if (scope === 'territories') pool = pool.filter((c) => c.is_territory)
  // 'both' — no filter

  if (regions && regions.length > 0 && regions.length < REGIONS.length) {
    const regionSet = new Set(regions)
    pool = pool.filter((c) => regionSet.has(c.region))
  } else if (regions && regions.length === 0) {
    return []
  }

  return pool
}

/**
 * Fuzzy search across name, official_name, and aliases.
 * Returns an array of country objects sorted by relevance.
 */
export function searchCountryByName(input) {
  if (!input || !input.trim()) return []
  return fuse.search(input).map((r) => r.item)
}

export default countriesRaw
