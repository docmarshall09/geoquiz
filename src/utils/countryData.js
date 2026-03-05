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

/**
 * Fuzzy search across name, official_name, and aliases.
 * Returns an array of country objects sorted by relevance.
 */
export function searchCountryByName(input) {
  if (!input || !input.trim()) return []
  return fuse.search(input).map((r) => r.item)
}

export default countriesRaw
