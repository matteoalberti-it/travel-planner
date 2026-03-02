'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import NewTripModal from '@/app/dashboard/components/NewTripModal'

interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTrip, setShowNewTrip] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      if (data) setTrips(data as Trip[])
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Triply</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/40">{user?.user_metadata?.full_name || user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white transition-colors">Esci</button>
        </div>
      </nav>

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

        {trips.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map(trip => (
              <button
                key={trip.id}
                onClick={() => router.push(`/dashboard/trip/${trip.id}`)}
                className="bg-white/3 border border-white/8 rounded-2xl p-6 text-left hover:border-white/20 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">✈️</span>
                  <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">
                    {trip.status === 'planning' ? 'In pianificazione' : trip.status}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{trip.name}</h3>
                <div className="flex flex-col gap-1 mt-3">
                  {trip.destination
                    ? <span className="text-xs text-white/40">📍 {trip.destination}</span>
                    : <span className="text-xs text-yellow-500/60">📍 Destinazione da definire</span>
                  }
                  {trip.start_date
                    ? <span className="text-xs text-white/40">📅 {new Date(trip.start_date).toLocaleDateString('it-IT')} — {new Date(trip.end_date).toLocaleDateString('it-IT')}</span>
                    : <span className="text-xs text-yellow-500/60">📅 Date da definire</span>
                  }
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowNewTrip(true)}
              className="border border-white/10 border-dashed rounded-2xl p-6 text-left hover:border-white/30 hover:bg-white/3 transition-all flex flex-col items-center justify-center gap-3 min-h-40"
            >
              <span className="text-3xl text-white/20">＋</span>
              <span className="text-sm text-white/30">Nuovo viaggio</span>
            </button>
          </div>
        )}
      </div>

      {showNewTrip && (
        <NewTripModal onClose={() => { setShowNewTrip(false) }} />
      )}
    </main>
  )
}