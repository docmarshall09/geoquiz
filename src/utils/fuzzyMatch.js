import Fuse from 'fuse.js'

/**
 * Check whether a user's typed answer matches a specific target country.
 *
 * Accepts if:
 *  1. The typed string appears as a substring of any accepted name/alias
 *     (handles "congo" → "Democratic Republic of the Congo")
 *  2. Fuse.js fuzzy match with a forgiving threshold (handles minor typos)
 *
 * @param {string} input   — raw text from the user
 * @param {object} country — country object (name, official_name, aliases)
 * @returns {boolean}
 */
export function matchesCountry(input, country) {
  if (!input?.trim()) return false

  const q = input.trim()
  const qLower = q.toLowerCase()

  const names = [
    country.name,
    country.official_name,
    ...(Array.isArray(country.aliases) ? country.aliases : []),
  ].filter(Boolean)

  // 1. Substring match — user's answer appears inside any accepted name
  for (const n of names) {
    if (n.toLowerCase().includes(qLower)) return true
  }

  // 2. Fuzzy match — tolerates typos with a forgiving threshold
  //    threshold 0.45: accepts answers ~45% different from the target
  const fuse = new Fuse(names, { threshold: 0.45 })
  return fuse.search(q).length > 0
}
