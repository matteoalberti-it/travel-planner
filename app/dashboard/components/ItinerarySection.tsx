'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Item {
  id: string
  title: string
  date: string
  time_start: string
  time_end: string
  category: string
  location: string
  description: string
}

interface Props {
  tripId: string
  startDate: string
  endDate: string
}

const CATEGORIES = [
  { id: 'transport', label: 'Trasporto', color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' },
  { id: 'hotel', label: 'Hotel', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  { id: 'breakfast', label: 'Colazione', color: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
  { id: 'lunch', label: 'Pranzo', color: 'bg-green-500/20 border-green-500/40 text-green-300' },
  { id: 'dinner', label: 'Cena', color: 'bg-green-600/20 border-green-600/40 text-green-200' },
  { id: 'activity', label: 'Attività', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  { id: 'other', label: 'Altro', color: 'bg-white/10 border-white/20 text-white/60' },
]

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6) // 6:00 - 24:00

function getCategoryStyle(category: string) {
  return CATEGORIES.find(c => c.id === category)?.color || CATEGORIES[6].color
}

function getCategoryLabel(category: string) {
  return CATEGORIES.find(c => c.id === category)?.label || 'Altro'
}

function getDaysArray(start: string, end: string): string[] {
  const days = []
  const current = new Date(start + 'T12:00:00')
  const last = new Date(end + 'T12:00:00')
  while (current <= last) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

function timeToMinutes(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const HOUR_HEIGHT = 60 // px per ora

export default function ItinerarySection({ tripId, startDate, endDate }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('activity')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormNotes] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchItems() }, [tripId])

  const fetchItems = async () => {
    const { data } = await supabase
      .from('itinerary_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('time_start', { ascending: true })
    if (data) setItems(data as Item[])
  }

  const handleAdd = async () => {
    if (!formTitle.trim() || !formDate) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    const { error } = await supabase.from('itinerary_items').insert({
      trip_id: tripId,
      title: formTitle,
      date: formDate,
      time_start: formStartTime || null,
      time_end: formEndTime || null,
      category: formCategory,
      location: formLocation || null,
      description: formDescription || null,
    })
    if (!error) {
      setShowForm(false)
      setFormTitle('')
      setFormStartTime('09:00')
      setFormEndTime('10:00')
      setFormLocation('')
      setFormNotes('')
      setFormCategory('activity')
      fetchItems()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('itinerary_items').delete().eq('id', id)
    fetchItems()
  }

  const openFormForDay = (date: string) => {
    setFormDate(date)
    setShowForm(true)
  }

  if (!startDate || !endDate) {
    return (
      <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🗓️</div>
        <h2 className="text-xl font-semibold mb-2">Imposta le date del viaggio</h2>
        <p className="text-white/40 text-sm max-w-sm">Per vedere il calendario devi prima definire le date di partenza e ritorno.</p>
      </div>
    )
  }

  const days = getDaysArray(startDate, endDate)
  const totalHeight = HOUR_HEIGHT * HOURS.length

  return (
    <div>
      {/* Form aggiunta attività */}
      {showForm && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Nuova attività</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Titolo *"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/50 mb-1.5 block">Giorno *</label>
                <select
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  {days.map(d => (
                    <option key={d} value={d} className="bg-black">
                      {new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-white/50 mb-1.5 block">Categoria</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id} className="bg-black">{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-white/50 mb-1.5 block">Ora inizio</label>
                <input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-white/50 mb-1.5 block">Ora fine</label>
                <input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
              </div>
            </div>
            <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Luogo (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
            <input type="text" value={formDescription} onChange={e => setFormNotes(e.target.value)} placeholder="Note (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
            <button onClick={handleAdd} disabled={!formTitle.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
          </div>
        </div>
      )}

      {/* Calendario stile Google */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <div className="flex" style={{ minWidth: `${60 + days.length * 180}px` }}>

          {/* Colonna orari */}
          <div className="w-14 shrink-0 border-r border-white/10">
            <div className="h-12 border-b border-white/10" />
            <div className="relative" style={{ height: `${totalHeight}px` }}>
              {HOURS.map(h => (
                <div
                  key={h}
                  className="absolute w-full pr-2 text-right"
                  style={{ top: `${(h - 6) * HOUR_HEIGHT - 8}px` }}
                >
                  <span className="text-xs text-white/25">{h}:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne giorni */}
          {days.map((day, idx) => {
            const dayItems = items.filter(item => item.date === day)
            const dateObj = new Date(day + 'T12:00:00')
            return (
              <div key={day} className="flex-1 min-w-44 border-r border-white/10 last:border-r-0">
                {/* Header giorno */}
                <div className="h-12 border-b border-white/10 flex items-center justify-between px-3">
                  <div>
                    <span className="text-xs text-white/30 uppercase">
                      {dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}
                    </span>
                    <span className="text-xs text-white/60 ml-1">
                      {dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <button
                    onClick={() => openFormForDay(day)}
                    className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-white/30 hover:text-white transition-colors flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Griglia oraria */}
                <div className="relative" style={{ height: `${totalHeight}px` }}>
                  {/* Linee orarie */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-white/5"
                      style={{ top: `${(h - 6) * HOUR_HEIGHT}px` }}
                    />
                  ))}

                  {/* Attività posizionate */}
                  {dayItems.map(item => {
                    const startMins = timeToMinutes(item.time_start) || timeToMinutes('09:00')
                    const endMins = timeToMinutes(item.time_end) || startMins + 60
                    const top = ((startMins / 60) - 6) * HOUR_HEIGHT
                    const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 30)
                    return (
                      <div
                        key={item.id}
                        className={`absolute left-1 right-1 rounded-lg border px-2 py-1 group cursor-pointer overflow-hidden ${getCategoryStyle(item.category)}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <div className="text-xs font-medium leading-tight truncate">{item.title}</div>
                            {item.time_start && (
                              <div className="text-xs opacity-60">{item.time_start.slice(0, 5)}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs shrink-0 hover:text-red-400 transition-all"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}