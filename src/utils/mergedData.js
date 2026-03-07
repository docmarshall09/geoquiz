/**
 * mergedData.js — merges countries.json with geoquiz_supplemental_data.json.
 *
 * Uses the same top-level-await pattern as countryData.js so callers get
 * synchronous-style access once the module resolves.
 *
 * Each country object gains these extra fields (null when not found):
 *   hdi, hdi_rank, travel_advisory, independence_year, independence_from,
 *   sovereignty_type, territory_of
 */

import countriesRaw from './countryData' // default export = raw array (top-level await)

const suppRaw = await fetch('/data/geoquiz_supplemental_data.json').then((r) => r.json())

/** Full _metadata object from the supplemental file (tooltip_text lives here). */
export const supplementalMeta = suppRaw._metadata

const suppMap = suppRaw.countries // { "Afghanistan": { hdi, ... }, ... }

/**
 * Full country list with supplemental fields merged in, keyed by country name.
 * All 234 entries (195 nations + 39 territories).
 */
export const mergedCountries = countriesRaw.map((c) => {
  const s = suppMap[c.name] ?? {}
  return {
    ...c,
    hdi: s.hdi ?? null,
    hdi_rank: s.hdi_rank ?? null,
    travel_advisory: s.travel_advisory ?? null,
    independence_year: s.independence_year !== undefined ? s.independence_year : null,
    independence_from: s.independence_from !== undefined ? s.independence_from : null,
    sovereignty_type: s.sovereignty_type ?? null,
    territory_of: s.territory_of !== undefined ? s.territory_of : null,
  }
})
