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
  { id: 'activity', label: 'Attivita', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  { id: 'other', label: 'Altro', color: 'bg-white/10 border-white/20 text-white/60' },
]

const HOUR_HEIGHT = 56

function getCategoryStyle(category: string) {
  return CATEGORIES.find(c => c.id === category)?.color || CATEGORIES[6].color
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

function timeToHours(time: string): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h + m / 60
}

export default function ItinerarySection({ tripId, startDate, endDate }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [formDate, setFormDate] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('activity')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')
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
      setFormDescription('')
      setFormCategory('activity')
      fetchItems()
    }
  }

  const handleUpdate = async () => {
    if (!editingItem || !editingItem.title.trim()) return
    await supabase.from('itinerary_items').update({
      title: editingItem.title,
      date: editingItem.date,
      time_start: editingItem.time_start || null,
      time_end: editingItem.time_end || null,
      category: editingItem.category,
      location: editingItem.location || null,
      description: editingItem.description || null,
    }).eq('id', editingItem.id)
    setEditingItem(null)
    setSelectedItem(null)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa attivita?')) return
    await supabase.from('itinerary_items').delete().eq('id', id)
    setSelectedItem(null)
    setEditingItem(null)
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

  const allTimes = items.flatMap(item => [
    item.time_start ? timeToHours(item.time_start) : null,
    item.time_end ? timeToHours(item.time_end) : null,
  ]).filter((t): t is number => t !== null)

  const minHour = allTimes.length > 0 ? Math.max(0, Math.floor(Math.min(...allTimes)) - 1) : 8
  const maxHour = allTimes.length > 0 ? Math.min(24, Math.ceil(Math.max(...allTimes)) + 1) : 20
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => i + minHour)
  const totalHeight = HOUR_HEIGHT * hours.length

  const renderDayItems = (dayItems: Item[]) => {
    const positioned = dayItems.map(item => ({
      ...item,
      startH: item.time_start ? timeToHours(item.time_start) : minHour + 1,
      endH: item.time_end ? timeToHours(item.time_end) : (item.time_start ? timeToHours(item.time_start) + 1 : minHour + 2),
    }))

    const columns: typeof positioned[] = []
    positioned.forEach(item => {
      let placed = false
      for (const col of columns) {
        if (!col.some(c => c.startH < item.endH && c.endH > item.startH)) {
          col.push(item)
          placed = true
          break
        }
      }
      if (!placed) columns.push([item])
    })

    const totalCols = columns.length || 1
    return columns.flatMap((col, colIdx) =>
      col.map(item => {
        const top = (item.startH - minHour) * HOUR_HEIGHT
        const height = Math.max((item.endH - item.startH) * HOUR_HEIGHT, 32)
        const widthPct = 100 / totalCols
        const leftPct = (colIdx / totalCols) * 100
        return (
          <div
            key={item.id}
            onClick={() => { setSelectedItem(item); setEditingItem(null) }}
            className={`absolute rounded-lg border px-2 py-1 cursor-pointer overflow-hidden transition-opacity hover:opacity-90 ${getCategoryStyle(item.category)}`}
            style={{
              top: top + 'px',
              height: height + 'px',
              width: 'calc(' + widthPct + '% - 4px)',
              left: 'calc(' + leftPct + '% + 2px)',
            }}
          >
            <div className="text-xs font-medium leading-tight truncate">{item.title}</div>
            {item.time_start && (
              <div className="text-xs opacity-60">{item.time_start.slice(0, 5)}</div>
            )}
          </div>
        )
      })
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Nuova attivita</h3>
            <div className="flex flex-col gap-3">
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Titolo *" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Giorno *</label>
                  <select value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
                    {days.map(d => (
                      <option key={d} value={d} className="bg-black">
                        {new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Categoria</label>
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
                    {CATEGORIES.map(c => (<option key={c.id} value={c.id} className="bg-black">{c.label}</option>))}
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
              <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Note (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleAdd} disabled={!formTitle.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <div className="flex" style={{ minWidth: (60 + days.length * 180) + 'px' }}>
            <div className="w-14 shrink-0 border-r border-white/10">
              <div className="h-12 border-b border-white/10" />
              <div className="relative" style={{ height: totalHeight + 'px' }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute w-full pr-2 text-right" style={{ top: (i * HOUR_HEIGHT - 8) + 'px' }}>
                    <span className="text-xs text-white/25">{h}:00</span>
                  </div>
                ))}
              </div>
            </div>
            {days.map((day) => {
              const dayItems = items.filter(item => item.date === day)
              const dateObj = new Date(day + 'T12:00:00')
              return (
                <div key={day} className="flex-1 min-w-44 border-r border-white/10 last:border-r-0">
                  <div className="h-12 border-b border-white/10 flex items-center justify-between px-3">
                    <div>
                      <span className="text-xs text-white/30 uppercase">{dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                      <span className="text-xs text-white/60 ml-1">{dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <button onClick={() => openFormForDay(day)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-white/30 hover:text-white transition-colors flex items-center justify-center text-sm">+</button>
                  </div>
                  <div className="relative" style={{ height: totalHeight + 'px' }}>
                    {hours.map((h, i) => (
                      <div key={h} className="absolute w-full border-t border-white/5" style={{ top: (i * HOUR_HEIGHT) + 'px' }} />
                    ))}
                    {renderDayItems(dayItems)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {items.length === 0 && (
          <div className="text-center mt-4">
            <p className="text-white/20 text-sm">Clicca + su un giorno per aggiungere la prima attivita</p>
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 h-fit">
          {editingItem ? (
            <div>
              <h3 className="font-semibold mb-4">Modifica</h3>
              <div className="flex flex-col gap-3">
                <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                  {CATEGORIES.map(c => (<option key={c.id} value={c.id} className="bg-black">{c.label}</option>))}
                </select>
                <select value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                  {days.map(d => (<option key={d} value={d} className="bg-black">{new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</option>))}
                </select>
                <div className="flex gap-2">
                  <input type="time" value={editingItem.time_start || ''} onChange={e => setEditingItem({...editingItem, time_start: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                  <input type="time" value={editingItem.time_end || ''} onChange={e => setEditingItem({...editingItem, time_end: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <input type="text" value={editingItem.location || ''} onChange={e => setEditingItem({...editingItem, location: e.target.value})} placeholder="Luogo" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                <input type="text" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="Note" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingItem(null)} className="flex-1 border border-white/10 text-white py-2 rounded-xl text-sm hover:border-white/30">Annulla</button>
                <button onClick={handleUpdate} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Salva</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(selectedItem.category)}`}>
                  {CATEGORIES.find(c => c.id === selectedItem.category)?.label || 'Altro'}
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-white/30 hover:text-white text-sm">x</button>
              </div>
              <h3 className="font-semibold text-base mb-3">{selectedItem.title}</h3>
              <div className="flex flex-col gap-2 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(selectedItem.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                {selectedItem.time_start && (
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{selectedItem.time_start.slice(0,5)}{selectedItem.time_end ? ' - ' + selectedItem.time_end.slice(0,5) : ''}</span>
                  </div>
                )}
                {selectedItem.location && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{selectedItem.location}</span>
                  </div>
                )}
                {selectedItem.description && (
                  <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span>{selectedItem.description}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => handleDelete(selectedItem.id)} className="flex-1 border border-red-500/30 text-red-400 py-2 rounded-xl text-sm hover:border-red-500/60">Elimina</button>
                <button onClick={() => setEditingItem(selectedItem)} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Modifica</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
