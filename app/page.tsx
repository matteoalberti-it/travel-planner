import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Triply</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Accedi
          </Link>
          <Link href="/register" className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
            Inizia gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white/60">Ora in beta — accesso anticipato gratuito</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-tight">
          Pianifica viaggi
          <span className="block text-white/30">senza impazzire</span>
        </h1>

        <p className="text-lg text-white/50 max-w-xl mb-10 leading-relaxed">
          Butta le tue idee nel secchio, invita gli amici, lascia che l'AI costruisca l'itinerario perfetto. Dal caos al piano in pochi secondi.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register" className="bg-white text-black px-8 py-3.5 rounded-xl font-semibold hover:bg-white/90 transition-colors text-sm">
            Crea il tuo primo viaggio →
          </Link>
          <Link href="/login" className="bg-white/5 border border-white/10 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors text-sm">
            Ho già un account
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🪣",
              title: "Il Secchio",
              desc: "Raccogli idee da TikTok, Maps, blog e consigli degli amici in un unico spazio condiviso."
            },
            {
              icon: "✨",
              title: "AI Planner",
              desc: "L'AI trasforma il caos in un itinerario ottimizzato giorno per giorno, rispettando i desideri di tutti."
            },
            {
              icon: "👥",
              title: "Viaggi di gruppo",
              desc: "Date matching automatico, destination finder e spese condivise. Niente più gruppi WhatsApp che muoiono."
            }
          ].map((f, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-white/30">© 2026 Triply</span>
        <span className="text-xs text-white/30">Fatto con ✦ e tanta pianificazione</span>
      </footer>
    </main>
  )
}