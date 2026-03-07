/**
 * DataTab — sortable, filterable data grid for all countries/territories.
 *
 * Features:
 *  - 13 columns (Name … Wikipedia)
 *  - 3-state sort cycle: asc → desc → reset
 *  - Region + scope + free-text filters
 *  - Tooltip popups on HDI, Sovereignty Type, Travel Advisory headers
 *  - CSV export of current visible rows
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { mergedCountries, supplementalMeta } from '../../utils/mergedData'
import { REGIONS } from '../../utils/countryData'

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'name',               header: 'Name',            align: 'left',   sortable: true,  minWidth: 160 },
  { key: 'capital',            header: 'Capital',          align: 'left',   sortable: true,  minWidth: 120 },
  { key: 'region',             header: 'Region',           align: 'left',   sortable: true,  minWidth: 150 },
  { key: 'population',         header: 'Population',       align: 'right',  sortable: true,  minWidth: 115 },
  { key: 'density',            header: 'Pop. Density',     align: 'right',  sortable: true,  minWidth: 110 },
  { key: 'area_km2',           header: 'Area km²',         align: 'right',  sortable: true,  minWidth: 110 },
  { key: 'gdp_ppp_per_capita', header: 'GDP PPP/capita',   align: 'right',  sortable: true,  minWidth: 125 },
  { key: 'hdi',                header: 'HDI',              align: 'right',  sortable: true,  minWidth: 80,  tooltipKey: 'hdi' },
  { key: 'independence_year',  header: 'Indep. Year',      align: 'right',  sortable: true,  minWidth: 100 },
  { key: 'independence_from',  header: 'Indep. From',      align: 'left',   sortable: true,  minWidth: 145 },
  { key: 'sovereignty_type',   header: 'Sovereignty',      align: 'left',   sortable: true,  minWidth: 165, tooltipKey: 'sovereignty_type' },
  { key: 'travel_advisory',    header: 'Travel Advisory',  align: 'right',  sortable: true,  minWidth: 130, tooltipKey: 'travel_advisory' },
  { key: 'wikipedia',          header: 'Wikipedia',        align: 'center', sortable: false, minWidth: 85  },
]

// ── Formatters ────────────────────────────────────────────────────────────────

function getCellText(key, c) {
  switch (key) {
    case 'name':               return c.name ?? '—'
    case 'capital':            return c.capital ?? '—'
    case 'region':             return c.region ?? '—'
    case 'population':
      return c.population != null ? c.population.toLocaleString() : '—'
    case 'density': {
      if (!c.population || !c.area_km2) return '—'
      return (c.population / c.area_km2).toFixed(1) + ' /km²'
    }
    case 'area_km2':
      return c.area_km2 != null ? c.area_km2.toLocaleString() : '—'
    case 'gdp_ppp_per_capita':
      return c.gdp_ppp_per_capita != null
        ? '$' + c.gdp_ppp_per_capita.toLocaleString()
        : '—'
    case 'hdi':
      return c.hdi != null ? c.hdi.toFixed(3) : '—'
    case 'independence_year': {
      if (c.independence_year == null) return '—'
      return c.independence_year < 0
        ? Math.abs(c.independence_year) + ' BCE'
        : String(c.independence_year)
    }
    case 'independence_from':  return c.independence_from ?? '—'
    case 'sovereignty_type':   return c.sovereignty_type ?? '—'
    case 'travel_advisory':
      return c.travel_advisory != null ? 'Level ' + c.travel_advisory : 'N/A'
    default: return ''
  }
}

/** Plain text value for CSV (no units/symbols that could confuse parsers). */
function getCsvValue(key, c) {
  if (key === 'density') {
    if (!c.population || !c.area_km2) return ''
    return (c.population / c.area_km2).toFixed(1)
  }
  if (key === 'gdp_ppp_per_capita') {
    return c.gdp_ppp_per_capita != null ? String(c.gdp_ppp_per_capita) : ''
  }
  if (key === 'population') {
    return c.population != null ? String(c.population) : ''
  }
  if (key === 'area_km2') {
    return c.area_km2 != null ? String(c.area_km2) : ''
  }
  const t = getCellText(key, c)
  return t === '—' ? '' : t
}

function getSortValue(key, c) {
  switch (key) {
    case 'name':               return (c.name ?? '').toLowerCase()
    case 'capital':            return c.capital != null ? c.capital.toLowerCase() : null
    case 'region':             return (c.region ?? '').toLowerCase()
    case 'population':         return c.population ?? null
    case 'density':
      return c.population && c.area_km2 ? c.population / c.area_km2 : null
    case 'area_km2':           return c.area_km2 ?? null
    case 'gdp_ppp_per_capita': return c.gdp_ppp_per_capita ?? null
    case 'hdi':                return c.hdi ?? null
    case 'independence_year':  return c.independence_year ?? null
    case 'independence_from':
      return c.independence_from != null ? c.independence_from.toLowerCase() : null
    case 'sovereignty_type':
      return c.sovereignty_type != null ? c.sovereignty_type.toLowerCase() : null
    case 'travel_advisory':    return c.travel_advisory ?? null
    default: return null
  }
}

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV(rows) {
  const exportCols = COLUMNS.filter((col) => col.key !== 'wikipedia')
  const headers = exportCols.map((col) => col.header)
  const csvLines = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((c) =>
      exportCols
        .map((col) => {
          const val = getCsvValue(col.key, c)
          return `"${String(val ?? '').replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ]
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'geoquiz-data.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Wikipedia external link icon ──────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataTab() {
  const [scopeFilter, setScopeFilter]     = useState('nations')
  const [regionFilter, setRegionFilter]   = useState('All')
  const [searchText, setSearchText]       = useState('')
  const [sortCol, setSortCol]             = useState(null)
  const [sortDir, setSortDir]             = useState(null) // 'asc' | 'desc' | null
  const [tooltip, setTooltip]             = useState(null) // { key, x, y } | null

  const tooltipRef = useRef(null)

  // Close tooltip when clicking outside it
  useEffect(() => {
    if (!tooltip) return
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltip(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltip])

  // ── Sort handler — 3-state cycle per column ──────────────────────────────
  const handleSort = (key) => {
    if (sortCol !== key) {
      setSortCol(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      // desc → reset
      setSortCol(null)
      setSortDir(null)
    }
  }

  // ── Tooltip click handler ────────────────────────────────────────────────
  const handleTooltipClick = (e, key) => {
    e.stopPropagation() // don't trigger column sort
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(rect.left, window.innerWidth - 340)
    const y = rect.bottom + 6
    setTooltip((t) => (t?.key === key ? null : { key, x, y }))
  }

  // ── Filtered + sorted rows ───────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = mergedCountries

    // Scope
    if (scopeFilter === 'nations')      rows = rows.filter((c) => !c.is_territory)
    else if (scopeFilter === 'territories') rows = rows.filter((c) => c.is_territory)

    // Region
    if (regionFilter !== 'All') rows = rows.filter((c) => c.region === regionFilter)

    // Free-text search (case-insensitive substring on name)
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      rows = rows.filter((c) => c.name.toLowerCase().includes(q))
    }

    // Sort
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = getSortValue(sortCol, a)
        const bv = getSortValue(sortCol, b)
        // Nulls always last
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    } else {
      // Default: alphabetical by name
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
    }

    return rows
  }, [scopeFilter, regionFilter, searchText, sortCol, sortDir])

  // Total count = scope-only (no region/search filters) — denominator for "X of Y"
  const totalCount = useMemo(() => {
    if (scopeFilter === 'both')         return mergedCountries.length
    if (scopeFilter === 'nations')      return mergedCountries.filter((c) => !c.is_territory).length
    return mergedCountries.filter((c) => c.is_territory).length
  }, [scopeFilter])

  const tooltipText = supplementalMeta?.tooltip_text ?? {}

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0f1a' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-6 py-3 flex items-center gap-3 flex-wrap border-b border-white/5"
        style={{ background: 'rgba(13,24,41,0.8)' }}
      >
        {/* Free-text search */}
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by name…"
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
          style={{ width: '180px' }}
        />

        {/* Region dropdown */}
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          style={{ background: '#0d1829' }}
        >
          <option value="All">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Scope toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {[['nations', 'Nations'], ['territories', 'Territories'], ['both', 'Both']].map(
            ([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setScopeFilter(val)}
                className={[
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  scopeFilter === val
                    ? 'bg-blue-600 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                ].join(' ')}
              >
                {label}
              </button>
            ),
          )}
        </div>

        {/* Row count */}
        <span className="text-xs text-white/40">
          Showing{' '}
          <span className="text-white/70 font-medium">{filteredRows.length}</span>
          {' '}of{' '}
          <span className="text-white/70 font-medium">{totalCount}</span>
          {' '}countries
        </span>

        {/* Export CSV — pushed to the right */}
        <button
          type="button"
          onClick={() => exportCSV(filteredRows)}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-colors hover:bg-white/5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="3" x2="12" y2="15" />
            <polyline points="8 11 12 15 16 11" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Data grid ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <table
          className="border-collapse text-sm"
          style={{ width: '100%', minWidth: '1560px' }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0d1829' }}>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  style={{ minWidth: col.minWidth }}
                  className={[
                    'px-3 py-2.5 text-left font-semibold uppercase tracking-wide whitespace-nowrap',
                    'border-b border-white/10 text-white/45 text-[11px]',
                    col.align === 'right'  ? 'text-right'  : '',
                    col.align === 'center' ? 'text-center' : '',
                    col.sortable ? 'cursor-pointer select-none hover:text-white/70 hover:bg-white/[0.03] transition-colors' : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}

                    {/* Tooltip "?" icon for HDI / Sovereignty / Travel Advisory */}
                    {col.tooltipKey && (
                      <button
                        type="button"
                        onClick={(e) => handleTooltipClick(e, col.tooltipKey)}
                        className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/50 hover:text-white transition-colors shrink-0"
                        style={{ width: '14px', height: '14px', fontSize: '9px', fontWeight: 700, lineHeight: 1 }}
                        title="More info"
                      >
                        ?
                      </button>
                    )}

                    {/* Sort direction arrow */}
                    {col.sortable && sortCol === col.key && (
                      <span className="text-blue-400 text-[11px] leading-none">
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((c, i) => (
              <tr
                key={c.iso_numeric ?? c.name}
                className="border-b border-white/[0.04] hover:bg-white/[0.035] transition-colors"
                style={{ background: i % 2 !== 0 ? 'rgba(255,255,255,0.018)' : 'transparent' }}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      'px-3 py-2 text-white/75',
                      col.align === 'right'  ? 'text-right tabular-nums'  : '',
                      col.align === 'center' ? 'text-center' : '',
                      col.key === 'name'     ? 'font-medium text-white'   : '',
                    ].join(' ')}
                  >
                    {col.key === 'wikipedia' ? (
                      <a
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(c.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center text-white/25 hover:text-blue-400 transition-colors"
                        title={`Wikipedia: ${c.name}`}
                      >
                        <ExternalLinkIcon />
                      </a>
                    ) : (
                      <span className={getCellText(col.key, c) === '—' ? 'text-white/25' : ''}>
                        {getCellText(col.key, c)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-16 text-center text-white/30 text-sm"
                >
                  No countries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Tooltip popup ───────────────────────────────────────────────── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-xl text-xs text-white/80 leading-relaxed shadow-2xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            maxWidth: '320px',
            padding: '12px 14px',
            background: 'rgba(10,20,38,0.97)',
            border: '1px solid rgba(255,255,255,0.13)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {tooltipText[tooltip.key] ?? ''}
        </div>
      )}
    </div>
  )
}
