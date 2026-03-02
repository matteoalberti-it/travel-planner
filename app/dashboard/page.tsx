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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('trips').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
      if (data) setTrips(data as Trip[])
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation()
    if (!confirm('Eliminare questo viaggio?')) return
    await supabase.from('trips').delete().eq('id', tripId)
    setTrips(trips.filter(t => t.id !== tripId))
  }

  const refreshTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('trips').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    if (data) setTrips(data as Trip[])
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
          <button onClick={() => setShowNewTrip(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
            + Nuovo viaggio
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">✈️</div>
            <h2 className="text-xl font-semibold mb-2">Nessun viaggio ancora</h2>
            <p className="text-white/40 text-sm mb-8 max-w-sm">Crea il tuo primo viaggio, invita gli amici e lascia che l'AI pianifichi tutto per te.</p>
            <button onClick={() => setShowNewTrip(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
              + Crea nuovo viaggio
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'list' ? 'bg-white text-black font-medium' : 'text-white/40 hover:text-white'}`}>
                  ☰ Lista
                </button>
                <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${viewMode === 'grid' ? 'bg-white text-black font-medium' : 'text-white/40 hover:text-white'}`}>
                  ⊞ Griglia
                </button>
              </div>
            </div>

            {viewMode === 'list' && (
              <div>
                <div className="flex items-center px-6 mb-2 text-xs text-white/30 gap-4">
                  <span className="flex-1">Viaggio</span>
                  <span className="w-36">Destinazione</span>
                  <span className="w-48">Date</span>
                  <span className="w-28">Stato</span>
                  <span className="w-8"></span>
                </div>
                <div className="flex flex-col gap-2">
                  {trips.map(trip => (
                    <button key={trip.id} onClick={() => router.push(`/dashboard/trip/${trip.id}`)} className="flex items-center px-6 py-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-left gap-4 group">
                      <span className="text-xl">✈️</span>
                      <span className="flex-1 font-medium">{trip.name}</span>
                      <span className="w-36 text-sm text-white/40 truncate">
                        {trip.destination || <span className="text-yellow-500/60">Da definire</span>}
                      </span>
                      <span className="w-48 text-sm text-white/40">
                        {trip.start_date
                          ? `${new Date(trip.start_date).toLocaleDateString('it-IT')} — ${new Date(trip.end_date).toLocaleDateString('it-IT')}`
                          : <span className="text-yellow-500/60">Da definire</span>
                        }
                      </span>
                      <span className="w-28 text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full text-center">In pianificazione</span>
                      <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="w-8 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm">🗑️</button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map(trip => (
                  <div key={trip.id} className="relative group">
                    <button onClick={() => router.push(`/dashboard/trip/${trip.id}`)} className="w-full bg-white/3 border border-white/8 rounded-2xl p-6 text-left hover:border-white/20 hover:bg-white/5 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">✈️</span>
                        <span className="text-xs bg-white/10 text-white/40 px-2 py-1 rounded-full">In pianificazione</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-3">{trip.name}</h3>
                      <div className="flex flex-col gap-1">
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
                    <button onClick={(e) => handleDeleteTrip(e, trip.id)} className="absolute top-3 right-3 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showNewTrip && (
        <NewTripModal onClose={() => { setShowNewTrip(false); refreshTrips() }} />
      )}
    </main>
  )
}