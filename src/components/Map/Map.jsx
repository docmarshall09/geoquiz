import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import { MICROSTATES } from '../../utils/microstates'

const COLORS = {
  ocean: '#0a0f1a',
  land: '#1a2740',
  border: '#0d1829',
  graticule: '#111e33',
  selected: '#2d4a7c',
  selectedStroke: '#4d80d0',
  correct: '#14532d',
  correctStroke: '#22c55e',
  wrong: '#5c1a1a',
  wrongStroke: '#ef4444',
}

const MARKER = {
  fill: '#1a2740',   // same as land — blends in at rest
  stroke: '#4d7ab0', // subtle blue ring so circles are still findable
  strokeWidth: 1,
}

// Screen-space radius at k=1. Generous enough to click reliably (14px diameter).
// Shrinks as r = BASE_R / k^0.4 as you zoom in (polygon becomes usable).
const BASE_MARKER_R = 7
const MIN_MARKER_R = 4

const ZOOM_EXTENT = [1, 20]
const MAP_PADDING = 20

export default function Map({
  mode,
  selectedCountryId,
  onCountryClick,
  onBackgroundClick,
  quizHighlights,
}) {
  const svgRef = useRef(null)

  // Refs so D3 event handlers always read the latest props without stale closures
  const onCountryClickRef = useRef(onCountryClick)
  const onBackgroundClickRef = useRef(onBackgroundClick)
  useEffect(() => { onCountryClickRef.current = onCountryClick }, [onCountryClick])
  useEffect(() => { onBackgroundClickRef.current = onBackgroundClick }, [onBackgroundClick])

  // ── One-time D3 setup ──
  useEffect(() => {
    const svgEl = svgRef.current
    const { width, height } = svgEl.getBoundingClientRect()

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)

    // Ocean fill — also acts as background click target
    svg.append('rect')
      .attr('class', 'ocean-bg')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', COLORS.ocean)
      .style('cursor', 'grab')
      .on('click', () => onBackgroundClickRef.current?.())

    // Natural Earth projection — best looking for a flat world map
    const projection = d3.geoNaturalEarth1()
      .fitExtent(
        [[MAP_PADDING, MAP_PADDING], [width - MAP_PADDING, height - MAP_PADDING]],
        { type: 'Sphere' }
      )

    const pathGen = d3.geoPath().projection(projection)

    // Main group — receives zoom/pan transform
    const g = svg.append('g').attr('class', 'map-root')

    // Subtle graticule grid
    g.append('path')
      .datum(d3.geoGraticule()())
      .attr('class', 'graticule')
      .attr('d', pathGen)
      .attr('fill', 'none')
      .attr('stroke', COLORS.graticule)
      .attr('stroke-width', 0.4)
      .attr('pointer-events', 'none')

    // ── Microstate circle markers ──
    // Separate group that is NOT inside g.map-root, so it lives in screen space.
    // Circles are repositioned on every zoom event via transform.applyX/Y().
    const gMarkers = svg.append('g').attr('class', 'microstate-markers')

    const updateMarkers = (transform) => {
      const visualR = Math.max(MIN_MARKER_R, BASE_MARKER_R / Math.pow(transform.k, 0.4))
      gMarkers.selectAll('g.marker-group')
        .attr('transform', (d) => {
          const p = projection(d.coords)
          if (!p) return 'translate(-9999,-9999)'
          return `translate(${transform.applyX(p[0])},${transform.applyY(p[1])})`
        })
      gMarkers.selectAll('circle.marker-visual').attr('r', visualR)
    }

    const groups = gMarkers.selectAll('g.marker-group')
      .data(MICROSTATES)
      .join('g')
      .attr('class', 'marker-group')
      .attr('data-id', (d) => d.id)
      .on('click', (event, d) => {
        event.stopPropagation()
        onCountryClickRef.current?.(d.id)
      })

    // Invisible large hit target — constant 20px in screen space
    groups.append('circle')
      .attr('class', 'marker-hit')
      .attr('r', 20)
      .attr('fill', 'white')
      .attr('fill-opacity', 0)

    // Visible styled circle — shrinks slightly with zoom, pointer-events disabled
    groups.append('circle')
      .attr('class', 'marker-visual')
      .attr('fill', MARKER.fill)
      .attr('stroke', MARKER.stroke)
      .attr('stroke-width', MARKER.strokeWidth)
      .attr('pointer-events', 'none')

    updateMarkers(d3.zoomIdentity)

    // Zoom + pan
    // translateExtent([[0,0],[w,h]]) keeps the map filling the viewport at all
    // zoom levels: at k=1 no panning; at k=N can pan across the full world.
    const zoom = d3.zoom()
      .scaleExtent(ZOOM_EXTENT)
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        updateMarkers(event.transform)
      })

    svg
      .call(zoom)
      .on('dblclick.zoom', null)

    // ── Cursor management via CSS classes ──
    // Native mousedown/mouseup toggle .is-dragging on the SVG element.
    // CSS (index.css) handles all states: grab (ocean), pointer (country), grabbing (drag).
    const onMouseDown = () => svgEl.classList.add('is-dragging')
    const onMouseUp = () => svgEl.classList.remove('is-dragging')
    svgEl.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)

    // Render countries — fire onCountryClick for any click; App routes by mode
    d3.json('/data/world-50m.json').then((topo) => {
      const countries = feature(topo, topo.objects.countries)

      g.selectAll('path.country')
        .data(countries.features)
        .join('path')
        .attr('class', 'country')
        .attr('data-id', (d) => d.id)
        .attr('d', pathGen)
        .attr('fill', COLORS.land)
        .attr('stroke', COLORS.border)
        .attr('stroke-width', 0.5)
        .on('click', (event, d) => {
          event.stopPropagation()
          onCountryClickRef.current?.(String(d.id))
        })
    })

    // Resize: refit projection, update translate extent, reset zoom
    const handleResize = () => {
      const { width: w, height: h } = svgEl.getBoundingClientRect()
      svg.attr('width', w).attr('height', h)
      svg.select('.ocean-bg').attr('width', w).attr('height', h)
      projection.fitExtent(
        [[MAP_PADDING, MAP_PADDING], [w - MAP_PADDING, h - MAP_PADDING]],
        { type: 'Sphere' }
      )
      zoom.translateExtent([[0, 0], [w, h]])
      g.select('.graticule').attr('d', pathGen)
      g.selectAll('.country').attr('d', pathGen)
      svg.call(zoom.transform, d3.zoomIdentity)
      updateMarkers(d3.zoomIdentity)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      svgEl.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      svg.selectAll('*').remove()
    }
  }, [])

  // ── Apply all highlights: Learn selection + quiz feedback ──
  // Runs whenever selectedCountryId or quizHighlights changes.
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const svg = d3.select(svgEl)

    // Reset everything to default
    svg.selectAll('path.country')
      .attr('fill', COLORS.land)
      .attr('stroke', COLORS.border)
      .attr('stroke-width', 0.5)
    svg.selectAll('g.marker-group circle.marker-visual')
      .attr('fill', MARKER.fill)
      .attr('stroke', MARKER.stroke)
      .attr('stroke-width', MARKER.strokeWidth)

    // Learn mode: selected country
    if (selectedCountryId) {
      svg.select(`path.country[data-id="${selectedCountryId}"]`)
        .attr('fill', COLORS.selected)
        .attr('stroke', COLORS.selectedStroke)
        .attr('stroke-width', 1.5)
      svg.select(`g.marker-group[data-id="${selectedCountryId}"] circle.marker-visual`)
        .attr('fill', COLORS.selected)
        .attr('stroke', COLORS.selectedStroke)
        .attr('stroke-width', 1.5)
    }

    // Quiz mode: correct / wrong / correct-reveal highlights
    if (quizHighlights) {
      Object.entries(quizHighlights).forEach(([id, state]) => {
        const fill = state === 'wrong' ? COLORS.wrong : COLORS.correct
        const stroke = state === 'wrong' ? COLORS.wrongStroke : COLORS.correctStroke
        svg.select(`path.country[data-id="${id}"]`)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', 1.5)
        svg.select(`g.marker-group[data-id="${id}"] circle.marker-visual`)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', 1.5)
      })
    }
  }, [selectedCountryId, quizHighlights])

  return (
    <div
      className="w-full"
      style={{ height: '100%', background: COLORS.ocean }}
    >
      <svg
        ref={svgRef}
        className="map-svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
