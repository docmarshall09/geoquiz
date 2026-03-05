import Map from './components/Map/Map'

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0f1a]">
      {/* 60px top nav placeholder — will be replaced with real nav */}
      <div className="h-[60px] flex items-center px-6 border-b border-white/5">
        <span className="text-white font-bold tracking-tight text-lg">GeoQuiz</span>
      </div>
      <Map />
    </div>
  )
}
