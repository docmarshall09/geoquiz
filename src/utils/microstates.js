// Countries that get circle markers: true microstates embedded within or
// immediately adjacent to a larger country, whose polygon is too small to
// ever reliably click even when zoomed in on that region.
// Island nations are excluded — their polygons are clickable when zoomed.
// coords: [longitude, latitude]  |  id: ISO 3166-1 numeric (matches TopoJSON)
export const MICROSTATES = [
  { id: '336', name: 'Vatican City',   coords: [ 12.4534, 41.9029] }, // inside Italy
  { id: '674', name: 'San Marino',     coords: [ 12.4578, 43.9424] }, // inside Italy
  { id: '492', name: 'Monaco',         coords: [  7.4128, 43.7384] }, // French coast
  { id: '438', name: 'Liechtenstein',  coords: [  9.5554, 47.1411] }, // Switzerland/Austria
  { id: '020', name: 'Andorra',        coords: [  1.5218, 42.5063] }, // France/Spain border
  { id: '702', name: 'Singapore',      coords: [103.8198,  1.3521] }, // tip of Malaysia
  { id: '048', name: 'Bahrain',        coords: [ 50.5577, 26.0275] }, // off Saudi coast
]
