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

interface Booking {
  id: string
  type: string
  title: string
  booking_date: string
  time_start: string
  time_end: string
  location_from: string
  location_to: string
  notes: string
  confirmation_code: string
  amount: number
  currency: string
  url: string
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

const BOOKING_TYPES = [
  { id: 'flight', label: 'Volo', emoji: '✈️', color: 'bg-sky-500/20 border-sky-400/40 text-sky-300' },
  { id: 'hotel', label: 'Hotel', emoji: '🛏️', color: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
  { id: 'transfer', label: 'Transfer & Taxi', emoji: '🚗', color: 'bg-orange-500/20 border-orange-400/40 text-orange-300' },
  { id: 'train', label: 'Treno & Bus', emoji: '🚆', color: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300' },
  { id: 'activity', label: 'Attivita & Esperienza', emoji: '🎯', color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  { id: 'restaurant', label: 'Ristorante', emoji: '🍽️', color: 'bg-green-500/20 border-green-500/40 text-green-300' },
  { id: 'other', label: 'Altro', emoji: '📄', color: 'bg-white/10 border-white/20 text-white/60' },
]

const HOUR_HEIGHT = 56
const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
const labelClass = "text-xs text-white/50 mb-1.5 block"

function FieldGroup({ label, children }: { label?: string, children: React.ReactNode }) {
  return <div>{label && <label className={labelClass}>{label}</label>}{children}</div>
}

function getCategoryStyle(category: string) {
  return CATEGORIES.find(c => c.id === category)?.color || CATEGORIES[6].color
}

function getBookingColor(type: string) {
  return BOOKING_TYPES.find(t => t.id === type)?.color || 'bg-white/10 border-white/20 text-white/60'
}

function getBookingEmoji(type: string) {
  return BOOKING_TYPES.find(t => t.id === type)?.emoji || '📄'
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
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  // Form state
  const [formMode, setFormMode] = useState<'simple' | 'booking'>('simple')
  const [formDate, setFormDate] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('activity')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')

  // Booking form state
  const [bookingType, setBookingType] = useState('flight')
  const [bookingTitle, setBookingTitle] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTimeStart, setBookingTimeStart] = useState('')
  const [bookingTimeEnd, setBookingTimeEnd] = useState('')
  const [bookingLocationFrom, setBookingLocationFrom] = useState('')
  const [bookingLocationTo, setBookingLocationTo] = useState('')
  const [bookingConfirmation, setBookingConfirmation] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingUrl, setBookingUrl] = useState('')
  const [bookingAmount, setBookingAmount] = useState('')
  const [bookingCurrency, setBookingCurrency] = useState('EUR')
  const [bookingCheckInDate, setBookingCheckInDate] = useState('')
  const [bookingCheckOutDate, setBookingCheckOutDate] = useState('')
  const [bookingCheckInTime, setBookingCheckInTime] = useState('')
  const [bookingCheckOutTime, setBookingCheckOutTime] = useState('')
  const [bookingFlightNumber, setBookingFlightNumber] = useState('')

  const supabase = createClient()

  useEffect(() => { fetchItems(); fetchBookings() }, [tripId, startDate, endDate])

  const fetchItems = async () => {
    const { data } = await supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('time_start', { ascending: true })
    if (data) setItems(data as Item[])
  }

  const fetchBookings = async () => {
    const { data } = await supabase.from('bookings').select('*').eq('trip_id', tripId)
    if (data) setBookings(data as Booking[])
  }

  const resetForm = () => {
    setFormTitle(''); setFormStartTime('09:00'); setFormEndTime('10:00')
    setFormLocation(''); setFormDescription(''); setFormCategory('activity')
    setBookingTitle(''); setBookingDate(''); setBookingTimeStart(''); setBookingTimeEnd('')
    setBookingLocationFrom(''); setBookingLocationTo(''); setBookingConfirmation('')
    setBookingNotes(''); setBookingUrl(''); setBookingAmount(''); setBookingCurrency('EUR')
    setBookingCheckInDate(''); setBookingCheckOutDate(''); setBookingCheckInTime('')
    setBookingCheckOutTime(''); setBookingFlightNumber(''); setBookingType('flight')
  }

  const handleAdd = async () => {
    if (formMode === 'simple') {
      if (!formTitle.trim() || !formDate) return
      await supabase.from('itinerary_items').insert({
        trip_id: tripId, title: formTitle, date: formDate,
        time_start: formStartTime || null, time_end: formEndTime || null,
        category: formCategory, location: formLocation || null, description: formDescription || null,
      })
      fetchItems()
    } else {
      const t = bookingType
      const title = bookingTitle.trim()
      if (!title) return
      const payload = {
        trip_id: tripId, type: t, title,
        booking_date: t === 'hotel' ? bookingCheckInDate : bookingDate || null,
        time_start: t === 'hotel' ? bookingCheckInTime : bookingTimeStart || null,
        time_end: t === 'hotel' ? bookingCheckOutTime : bookingTimeEnd || null,
        location_from: bookingLocationFrom || null,
        location_to: t === 'hotel' ? bookingCheckOutDate : bookingLocationTo || null,
        confirmation_code: bookingConfirmation || null,
        notes: t === 'flight' || t === 'train' ? bookingFlightNumber || null : bookingNotes || null,
        url: bookingUrl || null,
        amount: bookingAmount ? parseFloat(bookingAmount) : null,
        currency: bookingCurrency,
      }
      const { error } = await supabase.from('bookings').insert(payload)
      if (error) { alert('Errore: ' + JSON.stringify(error)); return }
      fetchBookings()
    }
    setShowForm(false)
    resetForm()
  }

  const handleUpdate = async () => {
    if (!editingItem || !editingItem.title.trim()) return
    await supabase.from('itinerary_items').update({
      title: editingItem.title, date: editingItem.date,
      time_start: editingItem.time_start || null, time_end: editingItem.time_end || null,
      category: editingItem.category, location: editingItem.location || null,
      description: editingItem.description || null,
    }).eq('id', editingItem.id)
    setEditingItem(null); setSelectedItem(null); fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa attivita?')) return
    await supabase.from('itinerary_items').delete().eq('id', id)
    setSelectedItem(null); setEditingItem(null); fetchItems()
  }

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Eliminare questa prenotazione?')) return
    await supabase.from('bookings').delete().eq('id', id)
    setSelectedBooking(null); fetchBookings()
  }

  const openFormForDay = (date: string) => {
    setFormDate(date)
    setBookingDate(date)
    setBookingCheckInDate(date)
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
  const allTimes = [
    ...items.flatMap(item => [
      item.time_start ? timeToHours(item.time_start) : null,
      item.time_end ? timeToHours(item.time_end) : null,
    ]),
    ...bookings.flatMap(b => [
      b.time_start ? timeToHours(b.time_start) : null,
      b.time_end ? timeToHours(b.time_end) : null,
    ]),
  ].filter((t): t is number => t !== null)

  const minHour = allTimes.length > 0 ? Math.max(0, Math.floor(Math.min(...allTimes)) - 1) : 8
  const maxHour = allTimes.length > 0 ? Math.min(24, Math.ceil(Math.max(...allTimes)) + 1) : 20
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => i + minHour)
  const totalHeight = HOUR_HEIGHT * hours.length

  const hotelBookings = bookings.filter(b => b.type === 'hotel')
  const slotBookings = bookings.filter(b =>
    ['flight', 'train', 'transfer', 'activity', 'restaurant', 'other'].includes(b.type) && b.booking_date && b.time_start
  )

  const renderDayItems = (day: string, dayItems: Item[]) => {
    const positioned = dayItems.map(item => ({
      ...item,
      startH: item.time_start ? timeToHours(item.time_start) : minHour + 1,
      endH: item.time_end ? timeToHours(item.time_end) : (item.time_start ? timeToHours(item.time_start) + 1 : minHour + 2),
      isBooking: false, bookingType: '',
    }))

    const daySlotBookings = slotBookings.filter(b => b.booking_date === day).map(b => ({
      id: b.id, title: b.title, date: b.booking_date,
      time_start: b.time_start, time_end: b.time_end || '',
      category: b.type, location: b.location_from || '', description: b.notes || '',
      startH: timeToHours(b.time_start),
      endH: b.time_end ? timeToHours(b.time_end) : timeToHours(b.time_start) + 1,
      isBooking: true, bookingType: b.type,
    }))

    const checkInReminders = hotelBookings.filter(b => b.booking_date === day && b.time_start).map(b => ({
      id: b.id + '_ci', title: '🛬 Check-in: ' + b.title, date: day,
      time_start: b.time_start, time_end: '', category: 'reminder', location: '', description: '',
      startH: timeToHours(b.time_start), endH: timeToHours(b.time_start) + 0.5,
      isBooking: true, bookingType: 'reminder',
    }))

    const checkOutReminders = hotelBookings.filter(b => b.location_to === day && b.time_end).map(b => ({
      id: b.id + '_co', title: '🛫 Check-out: ' + b.title, date: day,
      time_start: b.time_end, time_end: '', category: 'reminder', location: '', description: '',
      startH: timeToHours(b.time_end), endH: timeToHours(b.time_end) + 0.5,
      isBooking: true, bookingType: 'reminder',
    }))

    const allItems = [...positioned, ...daySlotBookings, ...checkInReminders, ...checkOutReminders]
    const columns: typeof allItems[] = []
    allItems.forEach(item => {
      let placed = false
      for (const col of columns) {
        if (!col.some(c => c.startH < item.endH && c.endH > item.startH)) { col.push(item); placed = true; break }
      }
      if (!placed) columns.push([item])
    })

    const totalCols = columns.length || 1
    return columns.flatMap((col, colIdx) => col.map(item => {
      const top = (item.startH - minHour) * HOUR_HEIGHT
      const height = Math.max((item.endH - item.startH) * HOUR_HEIGHT, 28)
      const widthPct = 100 / totalCols
      const leftPct = (colIdx / totalCols) * 100
      const style = { top: top + 'px', height: height + 'px', width: 'calc(' + widthPct + '% - 4px)', left: 'calc(' + leftPct + '% + 2px)' }

      if (item.bookingType === 'reminder') {
        return (
          <div key={item.id} className="absolute rounded-lg px-2 py-1 overflow-hidden cursor-default" style={{ ...style, border: '1px dashed rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-xs text-white/40 leading-tight truncate">{item.title}</div>
            {item.time_start && <div className="text-xs text-white/25">{item.time_start.slice(0,5)}</div>}
          </div>
        )
      }

      if (item.isBooking) {
        return (
          <div key={item.id} onClick={() => { const b = bookings.find(bk => bk.id === item.id); if (b) { setSelectedBooking(b); setSelectedItem(null) } }} className={`absolute rounded-lg border px-2 py-1 cursor-pointer overflow-hidden hover:opacity-90 ${getBookingColor(item.bookingType)}`} style={style}>
            <div className="text-xs font-medium leading-tight truncate">{getBookingEmoji(item.bookingType)} {item.title}</div>
            {item.time_start && <div className="text-xs opacity-60">{item.time_start.slice(0,5)}</div>}
          </div>
        )
      }

      return (
        <div key={item.id} onClick={() => { setSelectedItem(item as unknown as Item); setSelectedBooking(null); setEditingItem(null) }} className={`absolute rounded-lg border px-2 py-1 cursor-pointer overflow-hidden hover:opacity-90 ${getCategoryStyle(item.category)}`} style={style}>
          <div className="text-xs font-medium leading-tight truncate">{item.title}</div>
          {item.time_start && <div className="text-xs opacity-60">{item.time_start.slice(0,5)}</div>}
        </div>
      )
    }))
  }

  const renderBookingFormFields = () => {
    const t = bookingType
    return (
      <div className="flex flex-col gap-3">
        {t !== 'hotel' && (
          <input type="text" value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} placeholder="Titolo *" className={inputClass} />
        )}
        {t === 'hotel' && (
          <input type="text" value={bookingTitle} onChange={e => setBookingTitle(e.target.value)} placeholder="Nome hotel *" className={inputClass} />
        )}

        {t === 'flight' && <>
          <div className="flex gap-3">
            <input type="text" value={bookingLocationFrom} onChange={e => setBookingLocationFrom(e.target.value)} placeholder="Aeroporto partenza" className={`flex-1 ${inputClass}`} />
            <input type="text" value={bookingLocationTo} onChange={e => setBookingLocationTo(e.target.value)} placeholder="Aeroporto arrivo" className={`flex-1 ${inputClass}`} />
          </div>
          <div className="flex gap-3">
            <FieldGroup label="Data"><input type="date" value={bookingDate} min={startDate} max={endDate} onChange={e => setBookingDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Ora partenza"><input type="time" value={bookingTimeStart} onChange={e => setBookingTimeStart(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Ora arrivo"><input type="time" value={bookingTimeEnd} onChange={e => setBookingTimeEnd(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
          <input type="text" value={bookingFlightNumber} onChange={e => setBookingFlightNumber(e.target.value)} placeholder="Numero volo (es. FR1234)" className={inputClass} />
        </>}

        {t === 'hotel' && <>
          <div className="flex gap-3">
            <FieldGroup label="Check-in"><input type="date" value={bookingCheckInDate} min={startDate} max={endDate} onChange={e => setBookingCheckInDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Orario check-in"><input type="time" value={bookingCheckInTime} onChange={e => setBookingCheckInTime(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
          <div className="flex gap-3">
            <FieldGroup label="Check-out"><input type="date" value={bookingCheckOutDate} min={bookingCheckInDate || startDate} max={endDate} onChange={e => setBookingCheckOutDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Orario check-out"><input type="time" value={bookingCheckOutTime} onChange={e => setBookingCheckOutTime(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
          <input type="text" value={bookingLocationFrom} onChange={e => setBookingLocationFrom(e.target.value)} placeholder="Indirizzo (opzionale)" className={inputClass} />
        </>}

        {t === 'transfer' && <>
          <div className="flex gap-3">
            <input type="text" value={bookingLocationFrom} onChange={e => setBookingLocationFrom(e.target.value)} placeholder="Da" className={`flex-1 ${inputClass}`} />
            <input type="text" value={bookingLocationTo} onChange={e => setBookingLocationTo(e.target.value)} placeholder="A" className={`flex-1 ${inputClass}`} />
          </div>
          <div className="flex gap-3">
            <FieldGroup label="Data"><input type="date" value={bookingDate} min={startDate} max={endDate} onChange={e => setBookingDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Orario pickup"><input type="time" value={bookingTimeStart} onChange={e => setBookingTimeStart(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
        </>}

        {t === 'train' && <>
          <div className="flex gap-3">
            <input type="text" value={bookingLocationFrom} onChange={e => setBookingLocationFrom(e.target.value)} placeholder="Stazione partenza" className={`flex-1 ${inputClass}`} />
            <input type="text" value={bookingLocationTo} onChange={e => setBookingLocationTo(e.target.value)} placeholder="Stazione arrivo" className={`flex-1 ${inputClass}`} />
          </div>
          <div className="flex gap-3">
            <FieldGroup label="Data"><input type="date" value={bookingDate} min={startDate} max={endDate} onChange={e => setBookingDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Ora partenza"><input type="time" value={bookingTimeStart} onChange={e => setBookingTimeStart(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Ora arrivo"><input type="time" value={bookingTimeEnd} onChange={e => setBookingTimeEnd(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
          <input type="text" value={bookingFlightNumber} onChange={e => setBookingFlightNumber(e.target.value)} placeholder="Numero treno (opzionale)" className={inputClass} />
        </>}

        {(t === 'activity' || t === 'restaurant' || t === 'other') && <>
          <div className="flex gap-3">
            <FieldGroup label="Data"><input type="date" value={bookingDate} min={startDate} max={endDate} onChange={e => setBookingDate(e.target.value)} className={inputClass} /></FieldGroup>
            <FieldGroup label="Orario"><input type="time" value={bookingTimeStart} onChange={e => setBookingTimeStart(e.target.value)} className={inputClass} /></FieldGroup>
          </div>
          <input type="text" value={bookingLocationFrom} onChange={e => setBookingLocationFrom(e.target.value)} placeholder="Luogo (opzionale)" className={inputClass} />
          {t === 'other' && <input type="text" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Note (opzionale)" className={inputClass} />}
        </>}

        <input type="text" value={bookingConfirmation} onChange={e => setBookingConfirmation(e.target.value)} placeholder="Codice prenotazione (opzionale)" className={inputClass} />
        <div className="flex gap-3">
          <input type="number" value={bookingAmount} onChange={e => setBookingAmount(e.target.value)} placeholder="Prezzo (opzionale)" className={`flex-1 ${inputClass}`} />
          <select value={bookingCurrency} onChange={e => setBookingCurrency(e.target.value)} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
            <option value="EUR" className="bg-black">EUR</option>
            <option value="USD" className="bg-black">USD</option>
            <option value="GBP" className="bg-black">GBP</option>
          </select>
        </div>
        <input type="text" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="Link prenotazione (opzionale)" className={inputClass} />
      </div>
    )
  }

  const canSubmit = formMode === 'simple' ? formTitle.trim() !== '' : bookingTitle.trim() !== ''

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Aggiungi al calendario</h3>

            {/* Toggle Attività / Prenotazione */}
            <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl w-fit">
              <button onClick={() => setFormMode('simple')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formMode === 'simple' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>📍 Attività</button>
              <button onClick={() => setFormMode('booking')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formMode === 'booking' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>🎫 Prenotazione</button>
            </div>

            {formMode === 'simple' ? (
              <div className="flex flex-col gap-3">
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Titolo *" className={inputClass} />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className={labelClass}>Giorno *</label>
                    <select value={formDate} onChange={e => setFormDate(e.target.value)} className={inputClass}>
                      {days.map(d => (<option key={d} value={d} className="bg-black">{new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</option>))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className={labelClass}>Categoria</label>
                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className={inputClass}>
                      {CATEGORIES.map(c => (<option key={c.id} value={c.id} className="bg-black">{c.label}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className={labelClass}>Ora inizio</label><input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} className={inputClass} /></div>
                  <div className="flex-1"><label className={labelClass}>Ora fine</label><input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} className={inputClass} /></div>
                </div>
                <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="Luogo (opzionale)" className={inputClass} />
                <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Note (opzionale)" className={inputClass} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelClass}>Tipo prenotazione</label>
                  <select value={bookingType} onChange={e => setBookingType(e.target.value)} className={inputClass}>
                    {BOOKING_TYPES.map(t => (<option key={t.id} value={t.id} className="bg-black">{t.emoji} {t.label}</option>))}
                  </select>
                </div>
                {renderBookingFormFields()}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowForm(false); resetForm() }} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleAdd} disabled={!canSubmit} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <div className="flex" style={{ minWidth: (60 + days.length * 180) + 'px' }}>
            <div className="w-14 shrink-0 border-r border-white/10">
              <div className="border-b border-white/10" style={{ height: hotelBookings.length > 0 ? '52px' : '48px' }} />
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
              const dayHotels = hotelBookings.filter(b => {
                const checkIn = b.booking_date
                const checkOut = b.location_to
                return checkIn && checkOut && day >= checkIn && day <= checkOut
              })

              return (
                <div key={day} className="flex-1 min-w-44 border-r border-white/10 last:border-r-0">
                  <div className="border-b border-white/10" style={{ height: hotelBookings.length > 0 ? '52px' : '48px' }}>
                    <div className="flex items-center justify-between px-3 h-8">
                      <div>
                        <span className="text-xs text-white/30 uppercase">{dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                        <span className="text-xs text-white/60 ml-1">{dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <button onClick={() => openFormForDay(day)} className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/15 text-white/30 hover:text-white transition-colors flex items-center justify-center text-sm">+</button>
                    </div>
                    {dayHotels.length > 0 && (
                      <div className="px-1 flex flex-col gap-0.5">
                        {dayHotels.map(b => (
                          <div key={b.id} onClick={() => { setSelectedBooking(b); setSelectedItem(null) }} className="w-full rounded px-2 py-0.5 text-xs text-purple-200 bg-purple-500/25 border border-purple-500/40 cursor-pointer hover:bg-purple-500/35 truncate">
                            🛏️ {b.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" style={{ height: totalHeight + 'px' }}>
                    {hours.map((h, i) => (
                      <div key={h} className="absolute w-full border-t border-white/5" style={{ top: (i * HOUR_HEIGHT) + 'px' }} />
                    ))}
                    {renderDayItems(day, dayItems)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {items.length === 0 && bookings.length === 0 && (
          <div className="text-center mt-4">
            <p className="text-white/20 text-sm">Clicca + su un giorno per aggiungere la prima attivita</p>
          </div>
        )}
      </div>

      {/* Pannello dettaglio attività */}
      {selectedItem && !selectedBooking && (
        <div className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 h-fit">
          {editingItem ? (
            <div>
              <h3 className="font-semibold mb-4">Modifica</h3>
              <div className="flex flex-col gap-3">
                <input type="text" onKeyDown={e => e.key === 'Enter' && handleUpdate()} value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className={inputClass} />
                <select value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} className={inputClass}>
                  {CATEGORIES.map(c => (<option key={c.id} value={c.id} className="bg-black">{c.label}</option>))}
                </select>
                <select value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} className={inputClass}>
                  {days.map(d => (<option key={d} value={d} className="bg-black">{new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</option>))}
                </select>
                <div className="flex gap-2">
                  <input type="time" value={editingItem.time_start || ''} onChange={e => setEditingItem({...editingItem, time_start: e.target.value})} className={`flex-1 ${inputClass}`} />
                  <input type="time" value={editingItem.time_end || ''} onChange={e => setEditingItem({...editingItem, time_end: e.target.value})} className={`flex-1 ${inputClass}`} />
                </div>
                <input type="text" value={editingItem.location || ''} onChange={e => setEditingItem({...editingItem, location: e.target.value})} placeholder="Luogo" className={inputClass} />
                <input type="text" value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} placeholder="Note" className={inputClass} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingItem(null)} className="flex-1 border border-white/10 text-white py-2 rounded-xl text-sm">Annulla</button>
                <button onClick={handleUpdate} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Salva</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryStyle(selectedItem.category)}`}>
                  {CATEGORIES.find(c => c.id === selectedItem.category)?.label || 'Altro'}
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-white/30 hover:text-white text-sm">✕</button>
              </div>
              <h3 className="font-semibold text-base mb-3">{selectedItem.title}</h3>
              <div className="flex flex-col gap-2 text-sm text-white/50">
                <div className="flex items-center gap-2"><span>📅</span><span>{new Date(selectedItem.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                {selectedItem.time_start && <div className="flex items-center gap-2"><span>🕐</span><span>{selectedItem.time_start.slice(0,5)}{selectedItem.time_end ? ' - ' + selectedItem.time_end.slice(0,5) : ''}</span></div>}
                {selectedItem.location && <div className="flex items-center gap-2"><span>📍</span><span>{selectedItem.location}</span></div>}
                {selectedItem.description && <div className="flex items-center gap-2"><span>📝</span><span>{selectedItem.description}</span></div>}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => handleDelete(selectedItem.id)} className="flex-1 border border-red-500/30 text-red-400 py-2 rounded-xl text-sm hover:border-red-500/60">Elimina</button>
                <button onClick={() => setEditingItem(selectedItem)} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Modifica</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pannello dettaglio prenotazione */}
      {selectedBooking && !selectedItem && (
        <div className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 h-fit">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">🎫 Prenotazione</span>
            <button onClick={() => setSelectedBooking(null)} className="text-white/30 hover:text-white text-sm">✕</button>
          </div>
          <h3 className="font-semibold text-base mb-3">{selectedBooking.title}</h3>
          <div className="flex flex-col gap-2 text-sm text-white/50">
            {selectedBooking.type === 'hotel' ? (
              <>
                {selectedBooking.booking_date && <div className="flex gap-2"><span>🛬</span><span>Check-in: {new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}{selectedBooking.time_start ? ` — ${selectedBooking.time_start.slice(0,5)}` : ''}</span></div>}
                {selectedBooking.location_to && <div className="flex gap-2"><span>🛫</span><span>Check-out: {new Date(selectedBooking.location_to + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}{selectedBooking.time_end ? ` — ${selectedBooking.time_end.slice(0,5)}` : ''}</span></div>}
              </>
            ) : (
              <>
                {selectedBooking.booking_date && <div className="flex gap-2"><span>📅</span><span>{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>}
                {selectedBooking.time_start && <div className="flex gap-2"><span>🕐</span><span>{selectedBooking.time_start.slice(0,5)}{selectedBooking.time_end ? ` — ${selectedBooking.time_end.slice(0,5)}` : ''}</span></div>}
                {selectedBooking.location_from && <div className="flex gap-2"><span>🛫</span><span>{selectedBooking.location_from}</span></div>}
                {selectedBooking.location_to && selectedBooking.type !== 'hotel' && <div className="flex gap-2"><span>🛬</span><span>{selectedBooking.location_to}</span></div>}
              </>
            )}
            {selectedBooking.notes && <div className="flex gap-2"><span>📝</span><span>{selectedBooking.notes}</span></div>}
            {selectedBooking.confirmation_code && <div className="flex gap-2"><span>🔖</span><span>{selectedBooking.confirmation_code}</span></div>}
            {selectedBooking.amount && <div className="flex gap-2"><span>💶</span><span>{selectedBooking.amount} {selectedBooking.currency}</span></div>}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => handleDeleteBooking(selectedBooking.id)} className="flex-1 border border-red-500/30 text-red-400 py-2 rounded-xl text-sm hover:border-red-500/60">Elimina</button>
            <p className="text-xs text-white/20 mt-2 text-center flex-1">Modifica in Biglietti</p>
          </div>
        </div>
      )}
    </div>
  )
}
