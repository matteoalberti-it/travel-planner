'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import NewTripModal from '../components/NewTripModal'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showNewTrip, setShowNewTrip] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white/50 text-sm">Caricamento...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Triply</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/40">
            {user?.user_metadata?.full_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Ciao, {user?.user_metadata?.full_name?.split(' ')[0] || 'viaggiatore'} 👋
            </h1>
            <p className="text-white/40">Pronto per il tuo prossimo viaggio?</p>
          </div>
          <button
            onClick={() => setShowNewTrip(true)}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            + Nuovo viaggio
          </button>
        </div>

        {/* Empty state */}
        <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold mb-2">Nessun viaggio ancora</h2>
          <p className="text-white/40 text-sm mb-8 max-w-sm">
            Crea il tuo primo viaggio, invita gli amici e lascia che l'AI pianifichi tutto per te.
          </p>
          <button
            onClick={() => setShowNewTrip(true)}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            + Crea nuovo viaggio
          </button>
        </div>
      </div>

      {/* Modal */}
      {showNewTrip && (
        <NewTripModal onClose={() => setShowNewTrip(false)} />
      )}
    </main>
  )
}