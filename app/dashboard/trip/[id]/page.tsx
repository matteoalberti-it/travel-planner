'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BucketSection from '@/app/dashboard/components/BucketSection'

export default function TripPage() {
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const getTrip = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) setTrip(data)
      setLoading(false)
    }
    getTrip()
  }, [params.id])

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <span className="text-white/20">/</span>
          <span className="text-sm font-medium">{trip?.name}</span>
        </div>
        <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">
          🗺️ In pianificazione
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{trip?.name}</h1>
          <div className="flex items-center gap-4 text-white/40 text-sm">
            {trip?.destination
              ? <span>📍 {trip.destination}</span>
              : <span className="text-yellow-500/60">📍 Destinazione da definire</span>
            }
            {trip?.start_date
              ? <span>📅 {new Date(trip.start_date).toLocaleDateString('it-IT')} — {new Date(trip.end_date).toLocaleDateString('it-IT')}</span>
              : <span className="text-yellow-500/60">📅 Date da definire</span>
            }
          </div>
        </div>

        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {['🪣 Secchio', '🗓️ Itinerario', '🎫 Biglietti', '💸 Spese'].map((tab, i) => (
            <button
              key={i}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                i === 0 ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <BucketSection tripId={params.id as string} />
      </div>
    </main>
  )
}