// Overlay UI for Quiz Mode — rendered on top of the map
import { useState, useEffect, useRef } from 'react'

export default function QuizOverlay({
  direction = 'name-to-map',
  currentCountry,
  phase,
  score,
  position,
  clickedCountry,
  typedAnswer,
  wrongList,
  onNext,
  onTextSubmit,
  onRestart,
}) {
  if (phase === 'complete') {
    return (
      <RoundComplete
        score={score}
        total={position.total}
        wrongList={wrongList}
        onRestart={onRestart}
      />
    )
  }

  if (direction === 'map-to-name') {
    return (
      <MapToNameOverlay
        currentCountry={currentCountry}
        phase={phase}
        score={score}
        position={position}
        typedAnswer={typedAnswer}
        onNext={onNext}
        onTextSubmit={onTextSubmit}
      />
    )
  }

  // ── Name→Map overlay ─────────────────────────────────────────────────────
  return (
    <>
      {/* ── Question prompt bar ── */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between rounded-xl px-5 py-3"
        style={{
          background: 'rgba(13, 24, 41, 0.90)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Progress */}
        <span className="text-white/40 text-sm tabular-nums w-20 shrink-0">
          {position.current} / {position.total}
        </span>

        {/* Country prompt */}
        <div className="text-center min-w-0 px-4">
          <div className="text-white/35 text-[10px] uppercase tracking-widest mb-0.5">
            Find on the map
          </div>
          <div className="text-white font-bold text-2xl leading-tight truncate">
            {currentCountry?.name ?? '…'}
          </div>
        </div>

        {/* Score */}
        <div className="text-sm tabular-nums w-20 shrink-0 text-right">
          <span className="text-green-400 font-medium">✓ {score.correct}</span>
          <span className="text-white/25 mx-1.5">|</span>
          <span className="text-red-400 font-medium">✗ {score.incorrect}</span>
        </div>
      </div>

      {/* ── Correct feedback (auto-dismisses) ── */}
      {phase === 'correct' && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl px-6 py-3"
          style={{
            background: 'rgba(20, 83, 45, 0.92)',
            border: '1px solid rgba(34,197,94,0.35)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="text-green-400 text-xl">✓</span>
          <span className="text-green-300 font-semibold text-lg">Correct!</span>
        </div>
      )}

      {/* ── Incorrect feedback + Next button ── */}
      {phase === 'incorrect' && (
        <div
          className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-xl px-5 py-3"
          style={{
            background: 'rgba(40, 16, 16, 0.92)',
            border: '1px solid rgba(239,68,68,0.30)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-lg">✗</span>
            <span className="text-white/70 text-sm">
              You clicked:{' '}
              <span className="text-white font-medium">
                {clickedCountry?.name ?? 'unknown'}
              </span>
            </span>
          </div>
          <button
            onClick={onNext}
            className="ml-2 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </>
  )
}

// ── Map→Name overlay ──────────────────────────────────────────────────────

function MapToNameOverlay({ currentCountry, phase, score, position, typedAnswer, onNext, onTextSubmit }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  // Clear input and auto-focus when a new question starts
  useEffect(() => {
    if (phase === 'asking') {
      setInputValue('')
      // Short delay so focus works even after React re-render
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [phase, currentCountry?.iso_numeric])

  // Enter key advances to next question while in incorrect phase
  useEffect(() => {
    if (phase !== 'incorrect') return
    const handler = (e) => { if (e.key === 'Enter') onNext() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, onNext])

  const handleSubmit = (e) => {
    e.preventDefault()
    onTextSubmit(inputValue)
  }

  return (
    <>
      {/* ── Progress bar at top ── */}
      <div
        className="absolute top-4 inset-x-4 flex items-center justify-between rounded-xl px-5 py-3"
        style={{
          background: 'rgba(13, 24, 41, 0.90)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span className="text-white/40 text-sm tabular-nums w-20 shrink-0">
          {position.current} / {position.total}
        </span>
        <div className="text-center min-w-0 px-4">
          <div className="text-white/35 text-[10px] uppercase tracking-widest">
            Name the highlighted country
          </div>
        </div>
        <div className="text-sm tabular-nums w-20 shrink-0 text-right">
          <span className="text-green-400 font-medium">✓ {score.correct}</span>
          <span className="text-white/25 mx-1.5">|</span>
          <span className="text-red-400 font-medium">✗ {score.incorrect}</span>
        </div>
      </div>

      {/* ── Input / feedback at bottom ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">

        {/* Asking: text input */}
        {phase === 'asking' && (
          <form
            onSubmit={handleSubmit}
            className="flex rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13, 24, 41, 0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type the country name…"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent px-4 py-3.5 text-white text-lg placeholder-white/25 outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors"
            >
              Submit
            </button>
          </form>
        )}

        {/* Correct feedback */}
        {phase === 'correct' && (
          <div
            className="rounded-xl px-6 py-4 text-center"
            style={{
              background: 'rgba(20, 83, 45, 0.95)',
              border: '1px solid rgba(34,197,94,0.40)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-green-400 text-2xl">✓</span>
              <span className="text-green-300 font-bold text-xl">Correct!</span>
            </div>
            <div className="text-green-200/70 text-sm">{currentCountry?.name}</div>
          </div>
        )}

        {/* Incorrect feedback */}
        {phase === 'incorrect' && (
          <div
            className="rounded-xl px-6 py-4"
            style={{
              background: 'rgba(40, 16, 16, 0.95)',
              border: '1px solid rgba(239,68,68,0.35)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-400 text-lg">✗</span>
                  <span className="text-red-300 font-semibold">
                    {typedAnswer ? `"${typedAnswer}"` : 'No answer'}
                  </span>
                </div>
                <div className="text-white/40 text-xs uppercase tracking-widest mb-0.5">Correct answer</div>
                <div className="text-white font-bold text-lg">{currentCountry?.name}</div>
              </div>
              <button
                onClick={onNext}
                className="mt-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Round Complete Screen ──────────────────────────────────────────────────

function RoundComplete({ score, total, wrongList, onRestart }) {
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0
  const accuracyColor =
    accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-8"
      style={{ background: 'rgba(10, 15, 26, 0.93)', backdropFilter: 'blur(16px)' }}
    >
      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Round Complete</div>
      <div className={`text-7xl font-bold mb-1 ${accuracyColor}`}>{accuracy}%</div>
      <div className="text-white/50 text-sm mb-8">
        {score.correct} correct · {score.incorrect} incorrect · {total} total
      </div>

      {wrongList.length === 0 ? (
        <div className="text-green-400 text-lg font-semibold mb-8">Perfect round! 🎉</div>
      ) : (
        <div className="w-full max-w-sm mb-8">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Missed ({wrongList.length})
          </div>
          <div
            className="space-y-1.5 overflow-y-auto pr-1"
            style={{ maxHeight: '260px' }}
          >
            {wrongList.map((country) => (
              <div
                key={country.iso_numeric}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span className="text-xl leading-none shrink-0">{country.flag_emoji}</span>
                <span className="text-white/80 text-sm">{country.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors"
      >
        Play Again
      </button>
    </div>
  )
}
