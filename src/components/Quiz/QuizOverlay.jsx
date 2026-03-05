// Overlay UI for Quiz Mode — rendered on top of the map

export default function QuizOverlay({
  currentCountry,
  phase,
  score,
  position,
  clickedCountry,
  wrongList,
  onNext,
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
