import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { feature } from 'topojson-client'

const COLORS = {
  ocean: '#0a0f1a',
  land: '#1a2740',
  border: '#0d1829',
  graticule: '#111e33',
}

const ZOOM_EXTENT = [1, 20]
const MAP_PADDING = 20

export default function Map() {
  const svgRef = useRef(null)

  useEffect(() => {
    const svgEl = svgRef.current
    const { width, height } = svgEl.getBoundingClientRect()

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)

    // Ocean fill covering the full SVG
    svg.append('rect')
      .attr('class', 'ocean-bg')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', COLORS.ocean)

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

    // Zoom + pan
    // translateExtent([[0,0],[w,h]]) keeps the map filling the viewport at all
    // zoom levels: at k=1 no panning; at k=N can pan across the full world.
    const zoom = d3.zoom()
      .scaleExtent(ZOOM_EXTENT)
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
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

    // Render countries — hover entirely via CSS :hover on path.country (no JS handlers)
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
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      svgEl.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      svg.selectAll('*').remove()
    }
  }, [])

  return (
    <div
      className="w-full"
      style={{ height: 'calc(100vh - 60px)', background: COLORS.ocean }}
    >
      <svg
        ref={svgRef}
        className="map-svg"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
