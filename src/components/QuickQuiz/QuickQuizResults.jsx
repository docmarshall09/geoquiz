// Results screen shown after a Quick Quiz round completes

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function QuickQuizResults({
  score,
  total,
  wrongList,
  elapsedSeconds,
  onPlayAgain,
  onChangeSettings,
}) {
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0
  const accuracyColor =
    accuracy >= 80 ? 'text-green-400' : accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-8"
      style={{ background: 'rgba(10, 15, 26, 0.93)', backdropFilter: 'blur(16px)' }}
    >
      <div className="text-white/40 text-xs uppercase tracking-widest mb-4">
        Quick Quiz Complete
      </div>

      {/* Score display */}
      <div className="flex items-end gap-2 mb-1">
        <span className={`text-8xl font-bold leading-none ${accuracyColor}`}>
          {score.correct}
        </span>
        <span className="text-white/25 text-4xl font-light mb-2">/ {total}</span>
      </div>

      <div className={`text-2xl font-semibold mb-1 ${accuracyColor}`}>{accuracy}%</div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm text-white/40 mb-8">
        <span>{score.correct} correct</span>
        <span className="text-white/15">·</span>
        <span>{score.incorrect} incorrect</span>
        <span className="text-white/15">·</span>
        <span className="flex items-center gap-1">
          <span className="text-white/30">⏱</span>
          <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
        </span>
      </div>

      {/* Missed countries */}
      {wrongList.length === 0 ? (
        <div className="text-green-400 text-lg font-semibold mb-8">Perfect! 🎉</div>
      ) : (
        <div className="w-full max-w-sm mb-8">
          <div className="text-white/40 text-xs uppercase tracking-widest mb-3">
            Missed ({wrongList.length})
          </div>
          <div
            className="space-y-1.5 overflow-y-auto pr-1"
            style={{ maxHeight: '220px' }}
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

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onChangeSettings}
          className="px-6 py-3 rounded-xl text-white/60 hover:text-white font-medium text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          Change Settings
        </button>
        <button
          onClick={onPlayAgain}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
