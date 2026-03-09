/**
 * islandEmphasis.js — ISO numeric string IDs for small island nations that
 * receive a subtly brighter land fill on the map.
 *
 * These islands are barely visible at default zoom on the dark-ocean basemap.
 * The fill emphasis makes them discoverable without changing hover/click behaviour.
 *
 * Tuvalu (ISO 798) is intentionally absent — it has no geometry in the
 * Natural Earth 1:50m TopoJSON used by this app.
 */
export const ISLAND_EMPHASIS_IDS = new Set([
  // Indian Ocean
  '462', // Maldives
  '690', // Seychelles
  '174', // Comoros
  '480', // Mauritius

  // Oceania
  '242', // Fiji
  '882', // Samoa
  '776', // Tonga
  '548', // Vanuatu
  '090', // Solomon Islands
  '296', // Kiribati
  '584', // Marshall Islands
  '583', // Micronesia (Federated States)
  '585', // Palau
  '520', // Nauru

  // Atlantic
  '132', // Cape Verde
  '678', // São Tomé and Príncipe
])
