'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BucketSection from '@/app/dashboard/components/BucketSection'
import ItinerarySection from '@/app/dashboard/components/ItinerarySection'
import BookingsSection from '@/app/dashboard/components/BookingsSection'

export default function TripPage() {
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDestination, setEditDestination] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('secchio')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const getTrip = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('trips').select('*').eq('id', params.id).single()
      if (data) {
        setTrip(data)
        setEditName(data.name)
        setEditDestination(data.destination || '')
        setEditStartDate(data.start_date || '')
        setEditEndDate(data.end_date || '')
      }
      setLoading(false)
    }
    getTrip()
  }, [params.id])

  const handleSave = async () => {
    await supabase.from('trips').update({
      name: editName,
      destination: editDestination,
      start_date: editStartDate || null,
      end_date: editEndDate || null,
    }).eq('id', params.id)
    setTrip({ ...trip, name: editName, destination: editDestination, start_date: editStartDate, end_date: editEndDate })
    setEditing(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
      </main>
    )
  }

  const tabs = [
    { id: 'secchio', label: '🪣 Secchio' },
    { id: 'itinerario', label: '🗓️ Itinerario' },
    { id: 'biglietti', label: '🎫 Biglietti' },
    { id: 'spese', label: '💸 Spese' },
  ]

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white transition-colors text-sm">
            ← Dashboard
          </button>
          <span className="text-white/20">/</span>
          <span className="text-sm font-medium">{trip?.name}</span>
        </div>
        <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">🗺️ In pianificazione</span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">

        {/* Header viaggio */}
        {editing ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Modifica viaggio</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()} placeholder="Nome viaggio"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
              <input
                type="text"
                value={editDestination}
                onChange={e => setEditDestination(e.target.value)}
                placeholder="Destinazione"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Partenza</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Ritorno</label>
                  <input
                    type="date"
                    value={editEndDate}
                    min={editStartDate || undefined}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleSave} disabled={!editName.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Salva</button>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex items-start justify-between">
            <div>
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
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-white/30 hover:text-white transition-colors mt-1"
            >
              ✏️ Modifica
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenuto tab */}
        {activeTab === 'secchio' && <BucketSection tripId={params.id as string} />}
{activeTab === 'itinerario' && (
          <ItinerarySection
            tripId={params.id as string}
            startDate={trip?.start_date || ''}
            endDate={trip?.end_date || ''}
          />
        )}
        {activeTab === 'biglietti' && (
          <BookingsSection tripId={params.id as string} startDate={trip?.start_date || ''} endDate={trip?.end_date || ''} />
        )}
        {activeTab === 'spese' && (
          <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">💸</div>
            <h2 className="text-xl font-semibold mb-2">Spese in arrivo</h2>
            <p className="text-white/40 text-sm max-w-sm">Qui potrai tenere traccia delle spese del gruppo.</p>
          </div>
        )}
      </div>
    </main>
  )
}