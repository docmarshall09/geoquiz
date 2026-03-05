// Microstates and tiny island nations that need circle markers because their
// polygons are too small to reliably click at global zoom levels.
// coords: [longitude, latitude]  |  id: ISO 3166-1 numeric (matches TopoJSON)
export const MICROSTATES = [
  // European microstates (clustered near Italy — circles will be close together)
  { id: '336', name: 'Vatican City',                     coords: [ 12.4534,  41.9029] },
  { id: '674', name: 'San Marino',                       coords: [ 12.4578,  43.9424] },
  { id: '492', name: 'Monaco',                           coords: [  7.4128,  43.7384] },
  { id: '438', name: 'Liechtenstein',                    coords: [  9.5554,  47.1411] },
  { id: '020', name: 'Andorra',                          coords: [  1.5218,  42.5063] },
  { id: '470', name: 'Malta',                            coords: [ 14.3754,  35.9375] },

  // Asia / Middle East / Indian Ocean
  { id: '702', name: 'Singapore',                        coords: [103.8198,   1.3521] },
  { id: '048', name: 'Bahrain',                          coords: [ 50.5577,  26.0275] },
  { id: '462', name: 'Maldives',                         coords: [ 73.2207,   3.2028] },

  // Pacific
  { id: '798', name: 'Tuvalu',                           coords: [179.1942,  -8.5167] },
  { id: '520', name: 'Nauru',                            coords: [166.9315,  -0.5228] },
  { id: '585', name: 'Palau',                            coords: [134.5825,   7.5150] },
  { id: '584', name: 'Marshall Islands',                 coords: [171.1845,   7.1315] },
  { id: '583', name: 'Micronesia',                       coords: [158.1850,   6.9248] },
  { id: '882', name: 'Samoa',                            coords: [-172.1046, -13.7590] },
  { id: '776', name: 'Tonga',                            coords: [-175.1982, -21.1789] },
  { id: '548', name: 'Vanuatu',                          coords: [166.9592, -15.3767] },

  // Caribbean (densely clustered — will overlap at k=1, separate at zoom 2–3)
  { id: '028', name: 'Antigua and Barbuda',              coords: [ -61.7964,  17.0608] },
  { id: '659', name: 'Saint Kitts and Nevis',            coords: [ -62.7830,  17.3578] },
  { id: '212', name: 'Dominica',                         coords: [ -61.3710,  15.4150] },
  { id: '662', name: 'Saint Lucia',                      coords: [ -60.9789,  13.9094] },
  { id: '670', name: 'Saint Vincent and the Grenadines', coords: [ -61.2872,  12.9843] },
  { id: '308', name: 'Grenada',                          coords: [ -61.6790,  12.1165] },
  { id: '052', name: 'Barbados',                         coords: [ -59.5432,  13.1939] },

  // Atlantic / Africa
  { id: '132', name: 'Cabo Verde',                       coords: [ -24.0132,  15.1111] },
  { id: '678', name: 'São Tomé and Príncipe',            coords: [   6.6131,   0.1864] },

  // Indian Ocean / Africa
  { id: '174', name: 'Comoros',                          coords: [  43.3333, -11.6455] },
  { id: '480', name: 'Mauritius',                        coords: [  57.5522, -20.3484] },
  { id: '690', name: 'Seychelles',                       coords: [  55.4920,  -4.6796] },
]
