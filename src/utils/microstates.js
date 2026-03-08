// Countries/territories that get circle markers on the map.
// Used for two cases:
//   1. True microstates embedded within a larger country (Vatican City, etc.) whose polygon
//      is too tiny to click even when zoomed in on that region.
//   2. Small territories whose polygon doesn't render at default world zoom (~1 px or absent
//      from the Natural Earth 1:50m TopoJSON at world scale).
//
// Excluded: territories/islands that render clearly at default zoom and can be clicked
// without assistance (e.g. Greenland, Puerto Rico, New Caledonia, Falkland Islands,
// Faroe Islands, French Polynesia, Western Sahara, South Georgia, French Southern Territories).
//
// coords: [longitude, latitude]  |  id: ISO 3166-1 numeric (matches TopoJSON + countryData)

export const MICROSTATES = [

  // ── Microstates (sovereign nations, not territories) ─────────────────────
  { id: '336', name: 'Vatican City',         coords: [ 12.4534,  41.9029] }, // inside Italy
  { id: '674', name: 'San Marino',           coords: [ 12.4578,  43.9424] }, // inside Italy
  { id: '492', name: 'Monaco',               coords: [  7.4128,  43.7384] }, // French Riviera
  { id: '438', name: 'Liechtenstein',        coords: [  9.5554,  47.1411] }, // Switzerland/Austria border
  { id: '020', name: 'Andorra',              coords: [  1.5218,  42.5063] }, // France/Spain border
  { id: '702', name: 'Singapore',            coords: [103.8198,   1.3521] }, // tip of Malaysia
  { id: '048', name: 'Bahrain',              coords: [ 50.5577,  26.0275] }, // off Saudi coast

  // ── Europe ────────────────────────────────────────────────────────────────
  { id: '831', name: 'Guernsey',             coords: [ -2.5850,  49.4640] }, // Channel Island
  { id: '832', name: 'Jersey',               coords: [ -2.1310,  49.2200] }, // Channel Island
  { id: '833', name: 'Isle of Man',          coords: [ -4.5330,  54.2220] }, // Irish Sea
  { id: '248', name: 'Åland Islands',        coords: [ 19.9500,  60.1800] }, // Finnish archipelago, Baltic Sea

  // ── Caribbean ─────────────────────────────────────────────────────────────
  { id: '060', name: 'Bermuda',              coords: [-64.7700,  32.3200] }, // North Atlantic
  { id: '660', name: 'Anguilla',             coords: [-63.0600,  18.2200] }, // eastern Caribbean
  { id: '092', name: 'Virgin Islands (British)', coords: [-64.6300, 18.4300] },
  { id: '850', name: 'U.S. Virgin Islands',  coords: [-64.9000,  18.3400] },
  { id: '652', name: 'Saint Barthélemy',     coords: [-62.8500,  17.9000] }, // eastern Caribbean
  { id: '663', name: 'Saint Martin',         coords: [-63.0700,  18.0900] }, // French northern half
  { id: '534', name: 'Sint Maarten',         coords: [-63.0500,  18.0200] }, // Dutch southern half
  { id: '500', name: 'Montserrat',           coords: [-62.1900,  16.7400] }, // eastern Caribbean
  { id: '136', name: 'Cayman Islands',       coords: [-80.8700,  19.3100] }, // south of Cuba
  { id: '796', name: 'Turks and Caicos Islands', coords: [-71.8500, 21.8200] },
  { id: '533', name: 'Aruba',               coords: [-69.9700,  12.5200] }, // off Venezuela
  { id: '531', name: 'Curaçao',             coords: [-68.9800,  12.1700] }, // off Venezuela

  // ── Atlantic ──────────────────────────────────────────────────────────────
  { id: '666', name: 'Saint Pierre and Miquelon', coords: [-56.2700, 46.8800] }, // off Newfoundland
  { id: '654', name: 'Saint Helena',         coords: [ -5.7200, -15.9700] }, // remote South Atlantic

  // ── Indian Ocean ──────────────────────────────────────────────────────────
  { id: '086', name: 'British Indian Ocean Territory', coords: [ 72.4000,  -7.3200] }, // Diego Garcia
  { id: '334', name: 'Heard Island and McDonald Islands', coords: [ 73.5200, -53.1000] }, // sub-Antarctic

  // ── Asia ──────────────────────────────────────────────────────────────────
  { id: '344', name: 'Hong Kong',            coords: [114.1800,  22.3000] }, // south China coast
  { id: '446', name: 'Macau',               coords: [113.5500,  22.1700] }, // Pearl River Delta

  // ── Pacific ───────────────────────────────────────────────────────────────
  { id: '316', name: 'Guam',                coords: [144.7900,  13.4500] }, // western Pacific
  { id: '580', name: 'Northern Mariana Islands', coords: [145.6700, 15.1900] }, // western Pacific
  { id: '016', name: 'American Samoa',       coords: [-170.6900, -14.2700] }, // south Pacific
  { id: '876', name: 'Wallis and Futuna',    coords: [-177.9600, -13.2800] }, // south Pacific
  { id: '184', name: 'Cook Islands',         coords: [-159.7800, -21.2400] }, // south Pacific
  { id: '570', name: 'Niue',                coords: [-169.8700, -19.0500] }, // south Pacific
  { id: '574', name: 'Norfolk Island',       coords: [ 167.9600, -29.0300] }, // south Pacific
  { id: '612', name: 'Pitcairn Islands',     coords: [-130.1000, -25.0700] }, // remote south Pacific
]
