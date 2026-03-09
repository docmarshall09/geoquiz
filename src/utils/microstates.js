// Countries that get circle markers: microstates and small territories whose polygon
// is too small to reliably see or click at default world zoom.
//
// coords:     [longitude, latitude] — where the circle is drawn (display position)
// trueCoords: [longitude, latitude] — real geographic center (only set when coords is offset)
//             When present, Map.jsx draws a thin leader line from the circle back to trueCoords.
//
// id: ISO 3166-1 numeric (matches TopoJSON + countryData)
export const MICROSTATES = [
  // ── Microstates ────────────────────────────────────────────────────────────
  { id: '336', name: 'Vatican City',         coords: [ 12.4534,  41.9029] }, // inside Italy
  { id: '674', name: 'San Marino',           coords: [ 12.4578,  43.9424] }, // inside Italy
  { id: '492', name: 'Monaco',               coords: [  7.4128,  43.7384] }, // French Riviera
  { id: '438', name: 'Liechtenstein',        coords: [  9.5554,  47.1411] }, // Switzerland/Austria border
  { id: '020', name: 'Andorra',              coords: [  1.5218,  42.5063] }, // France/Spain border
  { id: '702', name: 'Singapore',            coords: [103.8198,   1.3521] }, // tip of Malaysia
  { id: '048', name: 'Bahrain',              coords: [ 50.5577,  26.0275] }, // off Saudi coast

  // ── Small territories ──────────────────────────────────────────────────────
  // Leeward Islands cluster — circles offset so they don't overlap at default zoom.
  // trueCoords = real island position; leader line connects the dot to the island.
  { id: '660', name: 'Anguilla',         coords: [-63.50, 18.60], trueCoords: [-63.07, 18.22] },
  { id: '663', name: 'Saint Martin',     coords: [-62.50, 18.50], trueCoords: [-63.05, 18.08] },
  { id: '534', name: 'Sint Maarten',     coords: [-62.50, 17.60], trueCoords: [-63.05, 18.03] },
  { id: '652', name: 'Saint Barthélemy', coords: [-63.40, 17.50], trueCoords: [-62.83, 17.90] },

  // Non-overlapping territories — coords = true position, no leader line needed
  { id: '446', name: 'Macau',                    coords: [113.5500,  22.1700] }, // Pearl River Delta
  { id: '060', name: 'Bermuda',                  coords: [-64.7500,  32.3200] }, // North Atlantic
  { id: '500', name: 'Montserrat',               coords: [-62.1900,  16.7400] }, // eastern Caribbean
  { id: '092', name: 'Virgin Islands (British)', coords: [-64.6300,  18.4300] }, // eastern Caribbean
]
