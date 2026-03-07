/**
 * DataTab — sortable, filterable data grid for all countries/territories.
 *
 * Features:
 *  - 14 columns incl. "Territory Of" after Name
 *  - Column-level filters: text, dropdown, searchable-dropdown, numeric range
 *  - 3-state sort cycle: asc → desc → reset
 *  - Scope toggle (toolbar) + Region filter (toolbar + column) synced
 *  - Active-filter dot indicator per column header
 *  - "Clear All Filters" button
 *  - Info tooltip popups on HDI, Sovereignty, Travel Advisory
 *  - CSV export of visible rows
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { mergedCountries, supplementalMeta } from '../../utils/mergedData'
import { REGIONS } from '../../utils/countryData'

// ── Column definitions ─────────────────────────────────────────────────────────
// filterType: 'text' | 'dropdown' | 'searchable-dropdown' | 'range' | null

const COLUMNS = [
  { key: 'name',               header: 'Name',            align: 'left',   sortable: true,  minWidth: 160, filterType: 'text' },
  { key: 'territory_of',       header: 'Territory Of',    align: 'left',   sortable: true,  minWidth: 140, filterType: 'dropdown' },
  { key: 'capital',            header: 'Capital',         align: 'left',   sortable: true,  minWidth: 120, filterType: 'text' },
  { key: 'region',             header: 'Region',          align: 'left',   sortable: true,  minWidth: 150, filterType: 'dropdown' },
  { key: 'population',         header: 'Population',      align: 'right',  sortable: true,  minWidth: 115, filterType: 'range' },
  { key: 'density',            header: 'Pop. Density',    align: 'right',  sortable: true,  minWidth: 110, filterType: 'range' },
  { key: 'area_km2',           header: 'Area km²',        align: 'right',  sortable: true,  minWidth: 110, filterType: 'range' },
  { key: 'gdp_ppp_per_capita', header: 'GDP PPP/capita',  align: 'right',  sortable: true,  minWidth: 125, filterType: 'range' },
  { key: 'hdi',                header: 'HDI',             align: 'right',  sortable: true,  minWidth: 80,  filterType: 'range',              tooltipKey: 'hdi' },
  { key: 'independence_year',  header: 'Indep. Year',     align: 'right',  sortable: true,  minWidth: 100, filterType: 'range' },
  { key: 'independence_from',  header: 'Indep. From',     align: 'left',   sortable: true,  minWidth: 145, filterType: 'searchable-dropdown' },
  { key: 'sovereignty_type',   header: 'Sovereignty',     align: 'left',   sortable: true,  minWidth: 165, filterType: 'dropdown',           tooltipKey: 'sovereignty_type' },
  { key: 'travel_advisory',    header: 'Travel Advisory', align: 'right',  sortable: true,  minWidth: 130, filterType: 'dropdown',           tooltipKey: 'travel_advisory' },
  { key: 'wikipedia',          header: 'Wikipedia',       align: 'center', sortable: false, minWidth: 85,  filterType: null },
]

// ── Filter state schema ────────────────────────────────────────────────────────

const INITIAL_FILTERS = {
  name: '',
  territory_of: 'All',
  capital: '',
  region: 'All',
  population_min: '',      population_max: '',
  density_min: '',         density_max: '',
  area_km2_min: '',        area_km2_max: '',
  gdp_ppp_per_capita_min: '', gdp_ppp_per_capita_max: '',
  hdi_min: '',             hdi_max: '',
  independence_year_min: '', independence_year_max: '',
  independence_from: 'All',
  sovereignty_type: 'All',
  travel_advisory: 'All',
}

// ── Active filter detection ────────────────────────────────────────────────────

function isFilterActive(key, filters) {
  switch (key) {
    case 'name':               return filters.name.trim() !== ''
    case 'capital':            return filters.capital.trim() !== ''
    case 'region':             return filters.region !== 'All'
    case 'territory_of':       return filters.territory_of !== 'All'
    case 'population':         return filters.population_min !== '' || filters.population_max !== ''
    case 'density':            return filters.density_min !== '' || filters.density_max !== ''
    case 'area_km2':           return filters.area_km2_min !== '' || filters.area_km2_max !== ''
    case 'gdp_ppp_per_capita': return filters.gdp_ppp_per_capita_min !== '' || filters.gdp_ppp_per_capita_max !== ''
    case 'hdi':                return filters.hdi_min !== '' || filters.hdi_max !== ''
    case 'independence_year':  return filters.independence_year_min !== '' || filters.independence_year_max !== ''
    case 'independence_from':  return filters.independence_from !== 'All'
    case 'sovereignty_type':   return filters.sovereignty_type !== 'All'
    case 'travel_advisory':    return filters.travel_advisory !== 'All'
    default: return false
  }
}

// ── Cell formatters ────────────────────────────────────────────────────────────

function getCellText(key, c) {
  switch (key) {
    case 'name':               return c.name ?? '—'
    case 'territory_of':       return c.territory_of ?? '—'
    case 'capital':            return c.capital ?? '—'
    case 'region':             return c.region ?? '—'
    case 'population':         return c.population != null ? c.population.toLocaleString() : '—'
    case 'density': {
      if (!c.population || !c.area_km2) return '—'
      return (c.population / c.area_km2).toFixed(1) + ' /km²'
    }
    case 'area_km2':           return c.area_km2 != null ? c.area_km2.toLocaleString() : '—'
    case 'gdp_ppp_per_capita':
      return c.gdp_ppp_per_capita != null ? '$' + c.gdp_ppp_per_capita.toLocaleString() : '—'
    case 'hdi':                return c.hdi != null ? c.hdi.toFixed(3) : '—'
    case 'independence_year': {
      if (c.independence_year == null) return '—'
      return c.independence_year < 0
        ? Math.abs(c.independence_year) + ' BCE'
        : String(c.independence_year)
    }
    case 'independence_from':  return c.independence_from ?? '—'
    case 'sovereignty_type':   return c.sovereignty_type ?? '—'
    case 'travel_advisory':    return c.travel_advisory != null ? 'Level ' + c.travel_advisory : 'N/A'
    default: return ''
  }
}

function getCsvValue(key, c) {
  if (key === 'density')            return c.population && c.area_km2 ? (c.population / c.area_km2).toFixed(1) : ''
  if (key === 'gdp_ppp_per_capita') return c.gdp_ppp_per_capita != null ? String(c.gdp_ppp_per_capita) : ''
  if (key === 'population')         return c.population != null ? String(c.population) : ''
  if (key === 'area_km2')           return c.area_km2 != null ? String(c.area_km2) : ''
  const t = getCellText(key, c)
  return t === '—' ? '' : t
}

function getSortValue(key, c) {
  switch (key) {
    case 'name':               return (c.name ?? '').toLowerCase()
    case 'territory_of':       return c.territory_of != null ? c.territory_of.toLowerCase() : null
    case 'capital':            return c.capital != null ? c.capital.toLowerCase() : null
    case 'region':             return (c.region ?? '').toLowerCase()
    case 'population':         return c.population ?? null
    case 'density':            return c.population && c.area_km2 ? c.population / c.area_km2 : null
    case 'area_km2':           return c.area_km2 ?? null
    case 'gdp_ppp_per_capita': return c.gdp_ppp_per_capita ?? null
    case 'hdi':                return c.hdi ?? null
    case 'independence_year':  return c.independence_year ?? null
    case 'independence_from':  return c.independence_from != null ? c.independence_from.toLowerCase() : null
    case 'sovereignty_type':   return c.sovereignty_type != null ? c.sovereignty_type.toLowerCase() : null
    case 'travel_advisory':    return c.travel_advisory ?? null
    default: return null
  }
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCSV(rows) {
  const exportCols = COLUMNS.filter((col) => col.key !== 'wikipedia')
  const lines = [
    exportCols.map((col) => `"${col.header}"`).join(','),
    ...rows.map((c) =>
      exportCols.map((col) => `"${String(getCsvValue(col.key, c) ?? '').replace(/"/g, '""')}"`).join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'geoquiz-data.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Shared input/select styles ─────────────────────────────────────────────────

const INPUT_CLS = [
  'w-full bg-white/[0.06] border border-white/[0.08] rounded',
  'px-1.5 py-0.5 text-[11px] text-white/80 placeholder-white/25',
  'focus:outline-none focus:border-blue-500/50 transition-colors',
].join(' ')

const SELECT_CLS = [
  'w-full bg-[#091420] border border-white/[0.08] rounded',
  'px-1 py-0.5 text-[11px] text-white/80',
  'focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer',
].join(' ')

// ── Wikipedia icon ─────────────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

// ── Searchable dropdown (for Independence From — 33 values) ────────────────────

function SearchableDropdown({ value, onChange, options }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos]       = useState(null)
  const btnRef  = useRef(null)
  const panelRef = useRef(null)

  const handleToggle = () => {
    if (open) { setOpen(false); return }
    const rect = btnRef.current.getBoundingClientRect()
    setPos({
      top:  rect.bottom + 2,
      left: Math.min(rect.left, window.innerWidth - 220),
    })
    setSearch('')
    setOpen(true)
  }

  // Dismiss on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase()))
    : options

  const label = value === 'All' ? 'All' : value === '—' ? '— (none)' : value

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); handleToggle() }}
        className={[
          'w-full flex items-center justify-between gap-1',
          'bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5',
          'text-[11px] text-left transition-colors',
          value !== 'All' ? 'text-blue-300 border-blue-500/40' : 'text-white/50',
          'focus:outline-none hover:border-white/20',
        ].join(' ')}
      >
        <span className="truncate">{label}</span>
        <span className="text-white/30 shrink-0" style={{ fontSize: '8px' }}>▾</span>
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: 210,
            maxHeight: 220,
            zIndex: 9999,
            background: '#0c1a2e',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search input */}
          <div style={{ padding: '6px 6px 4px' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                padding: '3px 7px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: '11px',
                outline: 'none',
              }}
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {['All', '—', ...filtered].map((opt) => {
              const isActive = opt === value || (opt === '—' && value === '—')
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '4px 10px', fontSize: '11px', cursor: 'pointer',
                    color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.65)',
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  }}
                >
                  {opt === '—' ? '— (none)' : opt}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                No matches
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DataTab() {
  const [scope,   setScope]   = useState('nations')
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState(null)
  const [tooltip, setTooltip] = useState(null) // { key, x, y } | null

  const tooltipRef = useRef(null)
  const setFilter  = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }))
  const clearAll   = () => setFilters(INITIAL_FILTERS)

  // Info tooltip: dismiss on outside click
  useEffect(() => {
    if (!tooltip) return
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) setTooltip(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tooltip])

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortCol !== key) { setSortCol(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortCol(null); setSortDir(null) }
  }

  // ── Info tooltip ──────────────────────────────────────────────────────────
  const handleInfoClick = (e, key) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip((t) => t?.key === key ? null : {
      key, x: Math.min(rect.left, window.innerWidth - 340), y: rect.bottom + 6,
    })
  }

  // ── Distinct option lists ─────────────────────────────────────────────────
  const distinctTerritoryOf = useMemo(() =>
    [...new Set(mergedCountries.filter((c) => c.territory_of).map((c) => c.territory_of))].sort(),
    [],
  )
  const distinctIndependenceFrom = useMemo(() =>
    [...new Set(mergedCountries.filter((c) => c.independence_from).map((c) => c.independence_from))].sort(),
    [],
  )
  const distinctSovereigntyTypes = useMemo(() =>
    [...new Set(mergedCountries.filter((c) => c.sovereignty_type).map((c) => c.sovereignty_type))].sort(),
    [],
  )

  // ── Filtered + sorted rows ────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let rows = mergedCountries

    // Scope
    if (scope === 'nations')      rows = rows.filter((c) => !c.is_territory)
    else if (scope === 'territories') rows = rows.filter((c) => c.is_territory)

    // ── Column filters (AND logic) ──
    const q = filters.name.trim().toLowerCase()
    if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q))

    const qCap = filters.capital.trim().toLowerCase()
    if (qCap) rows = rows.filter((c) => (c.capital ?? '').toLowerCase().includes(qCap))

    if (filters.region !== 'All') rows = rows.filter((c) => c.region === filters.region)

    if (filters.territory_of !== 'All') {
      rows = filters.territory_of === '—'
        ? rows.filter((c) => !c.territory_of)
        : rows.filter((c) => c.territory_of === filters.territory_of)
    }

    if (filters.independence_from !== 'All') {
      rows = filters.independence_from === '—'
        ? rows.filter((c) => !c.independence_from)
        : rows.filter((c) => c.independence_from === filters.independence_from)
    }

    if (filters.sovereignty_type !== 'All')
      rows = rows.filter((c) => c.sovereignty_type === filters.sovereignty_type)

    if (filters.travel_advisory !== 'All') {
      rows = filters.travel_advisory === 'N/A'
        ? rows.filter((c) => c.travel_advisory == null)
        : rows.filter((c) => c.travel_advisory === parseInt(filters.travel_advisory))
    }

    // Range helper
    const applyRange = (arr, getter, minKey, maxKey) => {
      const lo = filters[minKey] !== '' ? Number(filters[minKey]) : null
      const hi = filters[maxKey] !== '' ? Number(filters[maxKey]) : null
      if (lo === null && hi === null) return arr
      return arr.filter((c) => {
        const v = getter(c)
        if (v == null) return false
        if (lo !== null && v < lo) return false
        if (hi !== null && v > hi) return false
        return true
      })
    }

    rows = applyRange(rows, (c) => c.population, 'population_min', 'population_max')
    rows = applyRange(rows,
      (c) => c.population && c.area_km2 ? c.population / c.area_km2 : null,
      'density_min', 'density_max')
    rows = applyRange(rows, (c) => c.area_km2, 'area_km2_min', 'area_km2_max')
    rows = applyRange(rows, (c) => c.gdp_ppp_per_capita, 'gdp_ppp_per_capita_min', 'gdp_ppp_per_capita_max')
    rows = applyRange(rows, (c) => c.hdi, 'hdi_min', 'hdi_max')
    rows = applyRange(rows, (c) => c.independence_year, 'independence_year_min', 'independence_year_max')

    // ── Sort ──
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = getSortValue(sortCol, a)
        const bv = getSortValue(sortCol, b)
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    } else {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name))
    }

    return rows
  }, [scope, filters, sortCol, sortDir])

  // Y in "Showing X of Y" — scope-only count
  const totalCount = useMemo(() => {
    if (scope === 'both')         return mergedCountries.length
    if (scope === 'nations')      return mergedCountries.filter((c) => !c.is_territory).length
    return mergedCountries.filter((c) => c.is_territory).length
  }, [scope])

  const anyActive = COLUMNS.some((col) => isFilterActive(col.key, filters))
  const tooltipText = supplementalMeta?.tooltip_text ?? {}

  // ── Render filter control for a given column ───────────────────────────────
  const renderFilter = (col) => {
    switch (col.filterType) {
      case 'text':
        return (
          <input
            type="text"
            value={filters[col.key]}
            onChange={(e) => { e.stopPropagation(); setFilter(col.key, e.target.value) }}
            onClick={(e) => e.stopPropagation()}
            placeholder="filter…"
            className={INPUT_CLS}
          />
        )

      case 'dropdown': {
        if (col.key === 'region') {
          return (
            <select value={filters.region} onChange={(e) => { e.stopPropagation(); setFilter('region', e.target.value) }}
              onClick={(e) => e.stopPropagation()} className={SELECT_CLS}>
              <option value="All">All</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )
        }
        if (col.key === 'territory_of') {
          return (
            <select value={filters.territory_of} onChange={(e) => { e.stopPropagation(); setFilter('territory_of', e.target.value) }}
              onClick={(e) => e.stopPropagation()} className={SELECT_CLS}>
              <option value="All">All</option>
              <option value="—">— (none)</option>
              {distinctTerritoryOf.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          )
        }
        if (col.key === 'sovereignty_type') {
          return (
            <select value={filters.sovereignty_type} onChange={(e) => { e.stopPropagation(); setFilter('sovereignty_type', e.target.value) }}
              onClick={(e) => e.stopPropagation()} className={SELECT_CLS}>
              <option value="All">All</option>
              {distinctSovereigntyTypes.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          )
        }
        if (col.key === 'travel_advisory') {
          return (
            <select value={filters.travel_advisory} onChange={(e) => { e.stopPropagation(); setFilter('travel_advisory', e.target.value) }}
              onClick={(e) => e.stopPropagation()} className={SELECT_CLS}>
              <option value="All">All</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="N/A">N/A</option>
            </select>
          )
        }
        return null
      }

      case 'searchable-dropdown':
        return (
          <SearchableDropdown
            value={filters[col.key]}
            onChange={(v) => setFilter(col.key, v)}
            options={col.key === 'independence_from' ? distinctIndependenceFrom : distinctTerritoryOf}
          />
        )

      case 'range': {
        const minKey = col.key + '_min'
        const maxKey = col.key + '_max'
        const isYear = col.key === 'independence_year'
        const isHdi  = col.key === 'hdi'
        return (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={filters[minKey]}
              onChange={(e) => setFilter(minKey, e.target.value)}
              placeholder={isYear ? '−500' : isHdi ? '0.0' : 'min'}
              className={INPUT_CLS}
              style={{ width: '50%' }}
              step={isHdi ? 0.001 : 1}
            />
            <span className="text-white/20 text-[10px] shrink-0">–</span>
            <input
              type="number"
              value={filters[maxKey]}
              onChange={(e) => setFilter(maxKey, e.target.value)}
              placeholder={isYear ? '2024' : isHdi ? '1.0' : 'max'}
              className={INPUT_CLS}
              style={{ width: '50%' }}
              step={isHdi ? 0.001 : 1}
            />
          </div>
        )
      }

      default:
        return null
    }
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0f1a' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-6 py-2.5 flex items-center gap-3 flex-wrap border-b border-white/5"
        style={{ background: 'rgba(13,24,41,0.9)' }}
      >
        {/* Scope toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {[['nations', 'Nations'], ['territories', 'Territories'], ['both', 'Both']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setScope(val)}
              className={[
                'px-3 py-1.5 text-sm font-medium transition-colors',
                scope === val
                  ? 'bg-blue-600 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Region convenience shortcut — synced with column filter */}
        <select
          value={filters.region}
          onChange={(e) => setFilter('region', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
          style={{ background: '#0d1829' }}
        >
          <option value="All">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Row count */}
        <span className="text-xs text-white/40">
          Showing{' '}
          <span className="text-white/70 font-medium">{filteredRows.length}</span>
          {' '}of{' '}
          <span className="text-white/70 font-medium">{totalCount}</span>
          {' '}countries
        </span>

        {/* Clear All Filters */}
        {anyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30 text-xs font-medium transition-colors"
          >
            <span>✕</span> Clear Filters
          </button>
        )}

        {/* Export CSV */}
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
        <table className="border-collapse text-sm" style={{ width: '100%', minWidth: '1720px' }}>

          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>

            {/* ── Row 1: Sort headers ── */}
            <tr style={{ background: '#0d1829' }}>
              {COLUMNS.map((col) => {
                const active = isFilterActive(col.key, filters)
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    style={{ minWidth: col.minWidth, position: 'relative' }}
                    className={[
                      'px-3 py-2.5 font-semibold uppercase tracking-wide whitespace-nowrap',
                      'border-b border-white/[0.07] text-[11px]',
                      col.align === 'right'  ? 'text-right'  : '',
                      col.align === 'center' ? 'text-center' : '',
                      active ? 'text-blue-300/80' : 'text-white/45',
                      col.sortable ? 'cursor-pointer select-none hover:text-white/70 hover:bg-white/[0.03] transition-colors' : '',
                    ].join(' ')}
                  >
                    {/* Active filter dot */}
                    {active && (
                      <span
                        style={{
                          position: 'absolute', top: 7, right: 5,
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#3b82f6',
                        }}
                      />
                    )}

                    <span className="inline-flex items-center gap-1">
                      {col.header}

                      {/* Info tooltip "?" button */}
                      {col.tooltipKey && (
                        <button
                          type="button"
                          onClick={(e) => handleInfoClick(e, col.tooltipKey)}
                          className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white/50 hover:text-white transition-colors shrink-0"
                          style={{ width: 14, height: 14, fontSize: 9, fontWeight: 700, lineHeight: 1 }}
                          title="More info"
                        >
                          ?
                        </button>
                      )}

                      {/* Sort arrow */}
                      {col.sortable && sortCol === col.key && (
                        <span className="text-blue-400 text-[11px] leading-none">
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>

            {/* ── Row 2: Filter controls ── */}
            <tr style={{ background: '#091420', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ minWidth: col.minWidth, padding: '4px 6px', fontWeight: 'normal' }}
                  className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                >
                  {renderFilter(col)}
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
                      col.align === 'right'  ? 'text-right tabular-nums' : '',
                      col.align === 'center' ? 'text-center' : '',
                      col.key === 'name'     ? 'font-medium text-white'  : '',
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

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-16 text-center text-white/30 text-sm">
                  No countries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Info tooltip popup ──────────────────────────────────────────── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-xl text-xs text-white/80 leading-relaxed shadow-2xl"
          style={{
            left: tooltip.x, top: tooltip.y, maxWidth: 320, padding: '12px 14px',
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
