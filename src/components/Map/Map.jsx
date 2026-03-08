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
  // Quiz target — teal/cyan, distinct from green/red/blue
  target: '#134e4a',
  targetStroke: '#2dd4bf',
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
// Quiz-target marker is larger so it's identifiable
const BASE_TARGET_R = 13
const MIN_TARGET_R = 8

const ZOOM_EXTENT = [1, 20]
const MAP_PADDING = 20

// The SVG container starts at this offset from the viewport top (nav bar height).
// Used to convert clientY → SVG-space Y when computing map-space click coords.
const NAV_H = 60

export default function Map({
  mode,
  selectedCountryId,
  onCountryClick,
  onBackgroundClick,
  quizHighlights,
  dotMapCoords,   // [mx, my] in pre-transform SVG space, or null
  cardCorners,    // [{x,y}×4] in container coords, or null
}) {
  const svgRef = useRef(null)

  // Refs so D3 event handlers always read the latest props without stale closures
  const onCountryClickRef = useRef(onCountryClick)
  const onBackgroundClickRef = useRef(onBackgroundClick)
  useEffect(() => { onCountryClickRef.current = onCountryClick }, [onCountryClick])
  useEffect(() => { onBackgroundClickRef.current = onBackgroundClick }, [onBackgroundClick])

  // Refs shared between the one-time D3 setup and the highlights effect
  const quizHighlightsRef = useRef(quizHighlights)
  const currentTransformRef = useRef(null) // latest zoom transform
  const updateMarkersRef = useRef(null)    // updateMarkers fn defined in D3 setup

  // Annotation refs — dot + fan lines that track click point during zoom/pan
  const dotMapCoordsRef = useRef(dotMapCoords)   // prop synced to ref
  const cardCornersRef = useRef(cardCorners)      // prop synced to ref
  const gAnnotationRef = useRef(null)             // D3 selection set in setup
  const updateAnnotationRef = useRef(null)        // updateAnnotation fn set in setup

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
      currentTransformRef.current = transform
      const hl = quizHighlightsRef.current ?? {}
      const visualR = Math.max(MIN_MARKER_R, BASE_MARKER_R / Math.pow(transform.k, 0.4))
      const targetR = Math.max(MIN_TARGET_R, BASE_TARGET_R / Math.pow(transform.k, 0.4))
      gMarkers.selectAll('g.marker-group')
        .attr('transform', (d) => {
          const p = projection(d.coords)
          if (!p) return 'translate(-9999,-9999)'
          return `translate(${transform.applyX(p[0])},${transform.applyY(p[1])})`
        })
      gMarkers.selectAll('circle.marker-visual').attr('r', (d) =>
        hl[d.id] === 'target' ? targetR : visualR
      )
    }
    updateMarkersRef.current = updateMarkers

    const groups = gMarkers.selectAll('g.marker-group')
      .data(MICROSTATES)
      .join('g')
      .attr('class', 'marker-group')
      .attr('data-id', (d) => d.id)
      .on('click', (event, d) => {
        event.stopPropagation()
        const T = currentTransformRef.current ?? d3.zoomIdentity
        const mapPt = T.invert([event.clientX, event.clientY - NAV_H])
        onCountryClickRef.current?.(d.id, {
          screen: { x: event.clientX, y: event.clientY },
          map: mapPt,
        })
      })

    // Invisible large hit target — constant 20px in screen space
    // pointer-events: all so the transparent fill still captures events
    groups.append('circle')
      .attr('class', 'marker-hit')
      .attr('r', 20)
      .attr('fill', 'white')
      .attr('fill-opacity', 0)
      .attr('pointer-events', 'all')

    // Visible styled circle — shrinks slightly with zoom, pointer-events disabled
    groups.append('circle')
      .attr('class', 'marker-visual')
      .attr('fill', MARKER.fill)
      .attr('stroke', MARKER.stroke)
      .attr('stroke-width', MARKER.strokeWidth)
      .attr('pointer-events', 'none')

    updateMarkers(d3.zoomIdentity)

    // ── Annotation layer: click-dot + four fan lines ──
    // Drawn above markers; updates imperatively on every zoom/pan frame.
    const gAnnotation = svg.append('g')
      .attr('class', 'map-annotation')
      .style('pointer-events', 'none')
      .style('transition', 'opacity 0.2s ease')
      .style('opacity', 0)
    gAnnotationRef.current = gAnnotation

    // Four fan lines — one per card corner
    for (let i = 0; i < 4; i++) {
      gAnnotation.append('line')
        .attr('class', 'annot-line')
        .attr('stroke', 'rgba(130,175,245,0.28)')
        .attr('stroke-width', 2)
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 0).attr('y2', 0)
    }

    // Dot at the click origin
    gAnnotation.append('circle')
      .attr('class', 'annot-dot')
      .attr('r', 5.5)
      .attr('fill', 'rgba(100,155,230,0.9)')
      .attr('cx', 0).attr('cy', 0)

    // Project the stored map-space dot through the current transform, update lines.
    // Called from zoom handler (RAF-throttled) and whenever dotMapCoords/cardCorners change.
    const updateAnnotation = (transform) => {
      const mapPt = dotMapCoordsRef.current
      const corners = cardCornersRef.current
      if (!mapPt || !corners || corners.length !== 4) return

      const [sx, sy] = transform.apply(mapPt)

      gAnnotation.select('.annot-dot').attr('cx', sx).attr('cy', sy)

      const lineNodes = gAnnotation.selectAll('.annot-line').nodes()
      corners.forEach((c, i) => {
        d3.select(lineNodes[i])
          .attr('x1', sx).attr('y1', sy)
          .attr('x2', c.x).attr('y2', c.y)
      })
    }
    updateAnnotationRef.current = updateAnnotation

    // Zoom + pan
    // translateExtent([[0,0],[w,h]]) keeps the map filling the viewport at all
    // zoom levels: at k=1 no panning; at k=N can pan across the full world.
    //
    // Trackpads fire wheel events at up to 120Hz. Applying the main group
    // transform must stay synchronous for a responsive feel, but the marker
    // repositioning (14 DOM writes across 7 elements) is throttled to one
    // update per animation frame (~60fps max) to avoid layout thrash.
    // Annotation updates are included in the same RAF.
    let markerRafId = null
    const zoom = d3.zoom()
      .scaleExtent(ZOOM_EXTENT)
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        currentTransformRef.current = event.transform
        if (markerRafId === null) {
          markerRafId = requestAnimationFrame(() => {
            markerRafId = null
            updateMarkersRef.current?.(currentTransformRef.current)
            updateAnnotationRef.current?.(currentTransformRef.current)
          })
        }
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
    // For features without a numeric ISO id (e.g. Kosovo), fall back to the
    // name property so they remain clickable and selectable.
    d3.json('/data/world-50m.json').then((topo) => {
      const countries = feature(topo, topo.objects.countries)

      g.selectAll('path.country')
        .data(countries.features)
        .join('path')
        .attr('class', 'country')
        .attr('data-id', (d) => d.id !== undefined ? d.id : d.properties?.name)
        .attr('d', pathGen)
        .attr('fill', COLORS.land)
        .attr('stroke', COLORS.border)
        .attr('stroke-width', 0.5)
        .on('click', (event, d) => {
          event.stopPropagation()
          const id = d.id !== undefined ? String(d.id) : d.properties?.name
          if (!id) return
          const T = currentTransformRef.current ?? d3.zoomIdentity
          const mapPt = T.invert([event.clientX, event.clientY - NAV_H])
          onCountryClickRef.current?.(id, {
            screen: { x: event.clientX, y: event.clientY },
            map: mapPt,
          })
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
      updateAnnotationRef.current?.(d3.zoomIdentity)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      if (markerRafId !== null) cancelAnimationFrame(markerRafId)
      window.removeEventListener('resize', handleResize)
      svgEl.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      svg.selectAll('*').remove()
      gAnnotationRef.current = null
      updateAnnotationRef.current = null
    }
  }, [])

  // ── Sync dotMapCoords prop → ref; fade annotation in/out ──
  // When a new click arrives: snap annotation to projected position, then fade in.
  // When dismissed (null): fade out.
  useEffect(() => {
    dotMapCoordsRef.current = dotMapCoords
    const gA = gAnnotationRef.current
    if (!gA) return

    // Reset to invisible immediately (snap, no transition artifact)
    gA.style('opacity', 0)
    if (!dotMapCoords) return

    // Position dot + lines at the new location before fading in
    if (updateAnnotationRef.current && currentTransformRef.current) {
      updateAnnotationRef.current(currentTransformRef.current)
    }

    // Double-RAF: give browser one frame to commit geometry, then fade in
    let cancelled = false
    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) gA.style('opacity', 1)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(r1)
    }
  }, [dotMapCoords])

  // ── Sync cardCorners prop → ref; redraw lines to new corners ──
  useEffect(() => {
    cardCornersRef.current = cardCorners
    if (updateAnnotationRef.current && currentTransformRef.current) {
      updateAnnotationRef.current(currentTransformRef.current)
    }
  }, [cardCorners])

  // ── Apply all highlights: Learn selection + quiz feedback ──
  // Runs whenever selectedCountryId or quizHighlights changes.
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const svg = d3.select(svgEl)

    // Keep ref in sync so updateMarkers can read latest highlights
    quizHighlightsRef.current = quizHighlights

    // Reset everything to default
    svg.selectAll('path.country')
      .classed('map-pulse-correct map-pulse-wrong', false)
      .attr('fill', COLORS.land)
      .attr('stroke', COLORS.border)
      .attr('stroke-width', 0.5)
    svg.selectAll('g.marker-group')
      .classed('quiz-target', false)
    svg.selectAll('g.marker-group circle.marker-visual')
      .classed('map-pulse-correct map-pulse-wrong', false)
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

    // Quiz mode highlights
    if (quizHighlights) {
      Object.entries(quizHighlights).forEach(([id, state]) => {
        if (state === 'target') {
          // Teal highlight on polygon
          svg.select(`path.country[data-id="${id}"]`)
            .attr('fill', COLORS.target)
            .attr('stroke', COLORS.targetStroke)
            .attr('stroke-width', 1.5)
          // Teal + pulsing CSS class on microstate marker
          svg.select(`g.marker-group[data-id="${id}"]`)
            .classed('quiz-target', true)
          svg.select(`g.marker-group[data-id="${id}"] circle.marker-visual`)
            .attr('fill', COLORS.target)
            .attr('stroke', COLORS.targetStroke)
            .attr('stroke-width', 2)
        } else {
          const fill = state === 'wrong' ? COLORS.wrong : COLORS.correct
          const stroke = state === 'wrong' ? COLORS.wrongStroke : COLORS.correctStroke
          const pulseClass = state === 'wrong' ? 'map-pulse-wrong' : 'map-pulse-correct'

          const path = svg.select(`path.country[data-id="${id}"]`)
          path
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1.5)
            .classed(pulseClass, true)
          path.node()?.addEventListener('animationend', () => path.classed(pulseClass, false), { once: true })

          const marker = svg.select(`g.marker-group[data-id="${id}"] circle.marker-visual`)
          marker
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1.5)
            .classed(pulseClass, true)
          marker.node()?.addEventListener('animationend', () => marker.classed(pulseClass, false), { once: true })
        }
      })
    }

    // Re-run updateMarkers so the target gets its larger radius immediately
    // (without waiting for a zoom event)
    if (updateMarkersRef.current && currentTransformRef.current) {
      updateMarkersRef.current(currentTransformRef.current)
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
