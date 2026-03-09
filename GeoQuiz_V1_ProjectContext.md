# GeoQuiz — Project Context (V1 Complete — March 2026)

## Project Overview
GeoQuiz is a world geography learning web app. The goal is to build the best geography quiz tool on the internet — better than Seterra, Sporcle, and every other existing option.

**Live repo:** https://github.com/docmarshall09/geoquiz
**Local path:** /Users/marshalldeese/Projects/geoquiz
**Status:** V1 complete. V2 planning phase.

## Team Roles
- **Marshall:** Product Manager + UAT tester
- **Claude (Opus in claude.ai):** Engineering Manager — writes specs, prompts for CC, reviews output, makes architectural decisions
- **Claude Code (Sonnet, desktop app):** Developer — writes and commits all code

## Workflow
1. Opus writes a detailed prompt for each feature/fix
2. Marshall sends the prompt to CC in the desktop app (pointed at the local repo directory)
3. CC builds, commits directly to main, and pushes
4. Marshall tests in browser and reports back to Opus
5. Every CC prompt ends with a required output format so Marshall can relay status easily

## Tech Stack
- React (Vite) + Tailwind CSS
- D3.js + TopoJSON (Natural Earth 1:50m) for interactive map
- Fuse.js for fuzzy text matching
- Static JSON data (countries.json — 195 nations + 39 territories)
- Supplemental JSON data (geoquiz_supplemental_data.json — HDI, travel advisory, sovereignty, territory parent)
- Tourist arrivals JSON data (tourist_arrivals.json — international arrivals for 190 countries)
- localStorage for progress tracking
- Hosting: Render (static site) — deployed and live
- Desktop-first, no mobile consideration for now

## CC Prompt Format
Every prompt to CC should end with:

```
IMPORTANT: Before writing any code, run `git status` to confirm you are working in the local repo at /Users/marshalldeese/Projects/geoquiz and that your changes will be committed locally. After building, commit and push to main.

Commit and push to main when done.

When complete, respond in this format:

STATUS: [DONE or BLOCKED]
WHAT WAS BUILT: [bullet list]
FILES CHANGED: [list of files]
ISSUES/DECISIONS: [anything noteworthy]
```

## CC Guardrails (Learned the Hard Way)
- **CC must verify builds before committing.** "Verified clean build" in CC output doesn't always mean it actually tested. Prompts should explicitly say: "Run `npm run dev`, open the browser, confirm no console errors before committing."
- **Map.jsx is fragile.** Do NOT let CC add new React hooks, change the component function signature, or restructure the component. Any Map.jsx changes should be minimal and additive — pure D3 code inside existing useEffect blocks.
- **Prefer changes in data files (microstates.js, islandEmphasis.js, countries.json) over Map.jsx logic changes** when possible. Simpler = safer.
- **If something breaks the site, revert first, debug second.** Don't let CC stack fix-on-fix commits. Use `git reset --hard <known-good-hash>` and rebuild cleanly.
- **React 18 concurrent rendering gotcha:** `e.currentTarget` is nullified after event handlers return. If state updater callbacks need DOM measurements like `getBoundingClientRect()`, capture the rect synchronously in the handler body before any async batching.
- **Portal pattern for overflow:** Tooltips and dropdowns inside containers with `overflow: hidden` must use `createPortal` to `document.body` (same pattern used by SearchableDropdown and Travel Score tooltip).

---

## V0 Features (All Complete)

### Feature 1: Interactive World Map
- D3 Natural Earth projection, dark theme (#0a0f1a ocean, #1a2740 land)
- Zoom (1x–20x scroll wheel) and pan with translate boundary clamping
- CSS-driven hover highlights (GPU-accelerated, no JS jank)
- 7 microstate circle markers (Vatican City, San Marino, Monaco, Liechtenstein, Andorra, Singapore, Bahrain) with invisible 20px hit targets and subtle solid styling
- Graticule grid lines
- 60px nav bar at top

### Feature 2: Country Data
- public/data/countries.json — 234 entries (195 sovereign + 39 territories)
- Fields: name, official_name, aliases, iso_numeric, capital, population, area_km2, gdp_ppp_per_capita, region, is_territory, flag_emoji
- Kosovo handled with name-string ID (no ISO numeric code exists)
- src/utils/countryData.js — helpers: getCountryByIsoNumeric, getCountriesByRegion, getSovereignNations, searchCountryByName, getFilteredCountries
- REGIONS constant exported

### Feature 3: Supplemental Country Data
- public/data/geoquiz_supplemental_data.json — merged at runtime by src/utils/mergedData.js
- Fields: hdi, hdi_rank, travel_advisory (1-4), independence_year (negative = BCE), independence_from, sovereignty_type, territory_of
- Sources: UNDP Human Development Report 2025, US State Department Travel Advisories, Britannica/CIA World Factbook
- Metadata includes tooltip_text for HDI, travel advisory, and sovereignty type columns
- 193 countries with HDI values, 232 with travel advisory levels, 196 with sovereignty data, 42 territories with parent mapping

### Feature 4: Learn Mode (Browse)
- Click any country → scorecard panel shows name, flag, capital, population, area, GDP PPP, region
- Microstate circles also trigger scorecards
- Click ocean to dismiss
- Clicked country stays highlighted while scorecard is open
- Mode switcher in nav: Learn | Quiz | Quick Quiz | Data

### Feature 5: Quiz Mode — Name → Map (click)
- Quiz Launcher screen: region checkboxes with "All" toggle, scope selector (Nations/Territories/Both), direction toggle (Name→Map / Map→Name), live country count, Start Quiz button
- Country name displayed, user clicks where it is on the map
- Full round logic: all countries in scope shuffled, presented exactly once, no repeats until full cycle
- Correct: green flash + auto-advance 1.5s
- Incorrect: red flash on wrong click + green on correct + "You clicked: X" + manual Next button
- Progress counter (X of Y) and running score
- Round complete screen: accuracy %, scrollable missed-countries list, Play Again
- localStorage progress tracking via useProgress hook (per-country: seen, correct, incorrect, streak, lastSeen)

### Feature 6: Quiz Mode — Map → Name (type)
- Country highlighted on map with teal/cyan quiz-target color (#134e4a / #2dd4bf)
- Text input with auto-focus, Enter to submit
- Fuse.js fuzzy matching (threshold 0.3, minMatchCharLength 3) against name, official_name, aliases
- Substring matching requires ≥5 chars to prevent false positives
- Correct: green highlight + "Correct!" + proper name + auto-advance 1.5s
- Incorrect: red text + correct name shown + Next button (Enter key also advances)
- Wrong answer highlights the guessed country in red if it matches a real country
- Microstate circles: teal color + ~1.85x base radius + pulsing animation when targeted; green/red on answer
- Same round logic, progress tracking, completion screen as Name→Map

### Feature 7: Quick Quiz
- 10-question quiz mode for fast practice sessions
- Same launcher as full quiz: region checkboxes, scope, direction toggle
- "Weak Spots" toggle: targets countries with lowest accuracy (≥5 attempts minimum), backfills with unseen countries, falls back to random if no progress data
- Results screen: score, accuracy %, elapsed time (mm:ss), missed countries list
- "Play Again" (same filters, new random 10) and "Change Settings" buttons
- Progress tracking feeds into same useProgress hook

### Feature 8: Data Tab
- Full sortable/filterable data grid with 13 columns: Name, Capital, Region, Population, Population Density (derived), Area km², GDP PPP/capita, HDI, Independence Year, Independence From, Sovereignty Type, Travel Advisory, Wikipedia link
- Territories show parent country in "Independence From" column with "—" for independence year
- 3-state sort cycle (asc → desc → reset) with arrow indicators, nulls sort last
- Column-level filters: text inputs (Name, Capital), dropdowns (Region, Sovereignty Type, Travel Advisory, Independence From with searchable portal dropdown), numeric range inputs (Population, Density, Area, GDP, HDI, Independence Year)
- "?" tooltip icons on HDI, Sovereignty Type, Travel Advisory headers
- Active filter chips (removable blue pills) in toolbar
- "Clear All Filters" button, "Showing X of Y" count
- CSV export of filtered data
- Region dropdown and scope selector synced between toolbar and column filters
- Default view: sovereign nations, all regions, alpha by name
- Spinner arrows hidden on numeric inputs
- Dark theme, sticky headers, zebra striping, hover highlight, horizontal scroll

---

## V1 Features (All Complete)

### Feature 9: Quiz Feedback Animations
- Correct answer: bouncy scale-up pop with celebratory energy
- Incorrect answer: shake/rumble animation
- Map glow effects on answer feedback
- Commit: `049cdc0`

### Feature 10: Territory Scorecard Improvements
- Parent country name displayed on territory scorecards
- Fixed `territory_of` field not reaching scorecard (wrong lookup source)
- Commits: `333a38f`, `53a94ae`

### Feature 11: Small Territory Circle Markers
- 8 new curated circle markers for territories too small to see/click on the map
- Uses same dual-circle pattern as the original 7 microstates (invisible 20px hit target + visible 7px styled circle)
- New circles: Saint Barthélemy, Macau, Sint Maarten, Saint Martin, Bermuda, Anguilla, Montserrat, Virgin Islands (British)
- Total circle markers: 15 (7 original microstates + 8 new territories)
- Selection logic: Bahrain (778 km²) is the largest of the original 7 microstates → that area became the threshold → then manually curated from candidates under that threshold based on actual map visibility
- Defined in `src/utils/microstates.js`
- Commit: `c8539f1`

### Feature 12: Leeward Islands Cluster Separation
- 4 Leeward Islands circles (Saint Martin, Sint Maarten, Saint Barthélemy, Anguilla) overlap at default zoom
- Hardcoded offset display coordinates in `microstates.js` — each entry has `coords` (display position) and `trueCoords` (real geographic position)
- Static leader lines drawn from offset circle to true island location (1px, 0.3 opacity, renders behind circles)
- Lines are in geo-space so they pan/zoom naturally with the map

### Feature 13: Scorecard Callout Redesign
- Scorecard position is dynamic based on click location
- Leader lines extend from click point to scorecard edges
- Dot offset and fan lines for visual polish
- Commits: `67b1275`, `551aef1`

### Feature 14: Render Deployment
- Site deployed as static site on Render — live on the public web

### Feature 15: Hover Performance Fix
- Throttled hover detection to eliminate jank on laptops with integrated graphics / trackpads

### Feature 16: Quiz/Quick Quiz Overlay Responsiveness
- Overlay screens (launcher, results) responsive to actual viewport height
- Buttons no longer cut off on 13" laptop displays

### Feature 17: Scorecard Rankings
- Global rank shown in parentheses after each numeric scorecard value (e.g., "335,000,000 (3rd)")
- Ranked fields: Population, Area km², GDP per capita
- Rankings precomputed at module load via `src/utils/rankings.js` — exports `getRank(field, countryName)` and `ordinal(n)`
- Rank 1 = highest value for all fields; only sovereign nations ranked
- Territories show values but no rank; null values excluded from ranking
- Country name used as rank map key (avoids Kosovo ISO edge case)
- Rank displayed in slightly smaller/lighter text via `ValueWithRank` component

### Feature 18: Travel Score (Travelworthiness Composite)
- Composite 1-10 score on the scorecard indicating how travelworthy a country is for a US traveler
- Three weighted components:
  - **Safety (35%):** US State Dept. travel advisory level, stepped scoring (L1→10, L2→8, L3→4, L4→1)
  - **Popularity (35%):** International tourist arrivals, log-scaled normalization across all sovereign nations
  - **Value (30%):** Dollar stretch via PPP ratio (US GDP PPP / country GDP PPP), log-scaled with formula `min(10, max(1, 3 * ln(ppp_ratio) + 5))`, capped 1-10
- Data source: `public/data/tourist_arrivals.json` — 190 countries with arrivals data (6 nulls: Afghanistan, North Korea, Somalia, South Sudan, Vatican City, Yemen)
- Precomputed at module load via `src/utils/travelScore.js` — exports `getTravelScore(name)` returning `{ score, safety, arrivals, dollarStretch }` or null
- Color-coded display: green (#4ade80) for 8-10, yellow (#facc15) for 5-7.9, red (#f87171) for 1-4.9
- Only shown for sovereign nations with all three component values; territories excluded
- Clickable "?" tooltip explains the three components and their weights, rendered via `createPortal`
- US advisory treated as Level 1 (State Dept doesn't rate its own country)
- Verified scores: France 8.0, Thailand 8.5, Switzerland 7.7, Japan 8.6, US 8.4

### Feature 19: Small Island Nation Emphasis
- 16 small island nations get a brighter land fill (#2a4a6a vs default #1a2740) so they're visible at default zoom
- Defined in `src/utils/islandEmphasis.js` as a Set of ISO numeric string IDs
- Applied in Map.jsx during initial path render and in the highlights reset useEffect (both locations required — reset would otherwise revert emphasis on any click)
- Indian Ocean: Maldives, Seychelles, Comoros, Mauritius
- Oceania: Fiji, Samoa, Tonga, Vanuatu, Solomon Islands, Kiribati, Marshall Islands, Micronesia, Palau, Nauru
- Atlantic: Cabo Verde, São Tomé and Príncipe
- Tuvalu excluded — no geometry in 1:50m TopoJSON
- Hover/click/quiz highlighting all override normally; emphasis is the "resting" fill state

---

## Known Issues (Minor)
- **Leader line thickness at zoom:** Leeward Islands leader lines are geo-space SVG strokes, so they scale thicker as you zoom in. Fix: scale stroke-width inversely with `transform.k`. Low priority.
- **Cabo Verde / Côte d'Ivoire name mismatches:** These two countries have different name spellings between `countries.json` and `geoquiz_supplemental_data.json`, causing their Travel Scores to be null. Fix: normalize names in one of the data files. Only 2 countries affected.
- **Tuvalu not visible:** No geometry in 1:50m Natural Earth TopoJSON. Would need a circle marker to be findable. Low priority.

---

## Key Technical Details
- TopoJSON IDs are ISO 3166-1 numeric codes (zero-padded strings like "840" for USA)
- Kosovo uses name-string ID "Kosovo" (no ISO numeric exists) — Map.jsx falls back to d.properties.name
- 5 undefined-ID TopoJSON features intentionally excluded (Somaliland, N. Cyprus, Indian Ocean Ter., Siachen Glacier, Antarctica)
- Microstate circles use dual-circle pattern: invisible 20px hit target + visible 7px styled circle
- Microstate data lives in `src/utils/microstates.js` — includes `coords` (display position) and optional `trueCoords` (real position for offset markers with leader lines)
- Island emphasis data lives in `src/utils/islandEmphasis.js` — Set of ISO numeric IDs
- Rankings precomputed at module load in `src/utils/rankings.js` — keyed by country name
- Travel scores precomputed at module load in `src/utils/travelScore.js` — keyed by country name
- Hover is pure CSS (not D3 event handlers) for performance
- Pan boundaries use D3 zoom translateExtent
- mergedData.js uses top-level await (same pattern as countryData.js) — dev server works fine; prod build requires build.target: 'esnext' in vite.config.js
- Map unmounts when Data tab is active (D3 cleanup via useEffect return), remounts cleanly on switch-back
- SearchableDropdown in DataTab uses createPortal to document.body to escape overflow:auto container
- Travel Score tooltip also uses createPortal to document.body for the same reason
- **Map.jsx hook count: 9 React hooks (useRef ×7, useEffect ×4) — all at top level of Map() function. Do not add new hooks without extreme caution.**

---

## V2 Roadmap: Users & Progression

### User Accounts + Authentication
- Auth provider TBD (Firebase Auth, Supabase, Clerk, or Auth0 under consideration)
- Platform choice drives database and hosting decisions
- Key architectural decision: this shifts GeoQuiz from a pure static site to a client + backend architecture

### Server-Side Progress Storage
- Migrate from localStorage to persistent server-side storage
- Per-country progress: seen, correct, incorrect, streak, lastSeen (same schema as current useProgress hook)
- Migration path needed: "claim your progress" flow for existing users with localStorage data
- Database TBD (Postgres via Supabase, Firestore, etc.)

### Achievement System
- Achievement definitions and unlock conditions TBD (product design phase)
- Examples: "Mapped 50 countries", "Perfect round on Africa", "7-day streak"
- Requires server-side storage for persistence

### Global Leaderboards
- Ranking users by accuracy, countries completed, streaks, etc.
- Requires user accounts and server-side data

### V2 Open Architecture Questions
- Auth provider selection
- Database platform selection
- API layer (serverless functions vs. dedicated backend)
- Hosting migration (Render static → Render + backend, or move to Supabase/Firebase)
- Real-time vs. batch leaderboard updates

---

## V3 Roadmap: New Content
- States/provinces/regions quiz (admin-1 level — zoom into a country, show internal borders, quiz on subdivisions)
- Bodies of water (oceans, major seas, lakes, rivers — learn mode overlay + quiz mode)
- Capitals quiz mode
- Flags quiz mode

## Backlog
- Timed challenge mode
- Enhanced spaced repetition (SM-2 algorithm)
- Dynamic circle size threshold setting
- Mobile support
