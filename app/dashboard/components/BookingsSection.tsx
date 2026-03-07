'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Booking {
  id: string
  type: string
  title: string
  booking_date: string
  time_start: string
  time_end: string
  location_from: string
  location_to: string
  confirmation_code: string
  notes: string
  url: string
  amount: number
  currency: string
}

interface Props {
  tripId: string
  startDate: string
  endDate: string
}

const BOOKING_TYPES = [
  { id: 'flight', label: 'Volo', emoji: '✈️' },
  { id: 'hotel', label: 'Hotel', emoji: '🛏️' },
  { id: 'transfer', label: 'Transfer & Taxi', emoji: '🚗' },
  { id: 'train', label: 'Treno & Bus', emoji: '🚆' },
  { id: 'activity', label: 'Attività & Esperienza', emoji: '🎯' },
  { id: 'restaurant', label: 'Ristorante', emoji: '🍽️' },
  { id: 'other', label: 'Altro', emoji: '📄' },
]

function getTypeInfo(type: string) {
  return BOOKING_TYPES.find(t => t.id === type) || BOOKING_TYPES[6]
}

const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
const labelClass = "text-xs text-white/50 mb-1.5 block"

function FieldGroup({ label, children }: { label?: string, children: React.ReactNode }) {
  return (
    <div>
      {label && <label className={labelClass}>{label}</label>}
      {children}
    </div>
  )
}

export default function BookingsSection({ tripId, startDate, endDate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  const [formData, setFormData] = useState({
    type: 'flight',
    title: '',
    date: '',
    timeStart: '',
    timeEnd: '',
    locationFrom: '',
    locationTo: '',
    confirmation: '',
    notes: '',
    url: '',
    amount: '',
    currency: 'EUR',
    checkInDate: '',
    checkOutDate: '',
    checkInTime: '',
    checkOutTime: '',
    flightNumber: '',
  })

  const supabase = createClient()

  useEffect(() => { fetchBookings() }, [tripId])

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('trip_id', tripId)
      .order('booking_date', { ascending: true })
    if (data) setBookings(data as Booking[])
  }

  const setField = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  const resetForm = () => {
    setFormData({
      type: 'flight', title: '', date: '', timeStart: '', timeEnd: '',
      locationFrom: '', locationTo: '', confirmation: '', notes: '',
      url: '', amount: '', currency: 'EUR', checkInDate: '',
      checkOutDate: '', checkInTime: '', checkOutTime: '', flightNumber: '',
    })
  }

  const buildPayload = () => {
    const f = formData
    return {
      trip_id: tripId,
      type: f.type,
      title: f.title,
      booking_date: f.type === 'hotel' ? f.checkInDate : f.date || null,
      time_start: f.type === 'hotel' ? f.checkInTime : f.timeStart || null,
      time_end: f.type === 'hotel' ? f.checkOutTime : f.timeEnd || null,
      location_from: f.locationFrom || null,
      location_to: f.type === 'hotel' ? f.checkOutDate : f.locationTo || null,
      confirmation_code: f.confirmation || null,
      notes: f.type === 'flight' || f.type === 'train' ? f.flightNumber || null : f.notes || null,
      url: f.url || null,
      amount: f.amount ? parseFloat(f.amount) : null,
      currency: f.currency,
    }
  }

  const handleAdd = async () => {
    if (!formData.title.trim()) return
    const payload = buildPayload()
    const { error } = await supabase.from('bookings').insert(payload)
    if (error) {
      alert('Errore: ' + JSON.stringify(error))
    } else {
      resetForm()
      setShowForm(false)
      fetchBookings()
    }
  }

  const handleUpdate = async () => {
    if (!editingBooking) return
    await supabase.from('bookings').update({
      type: editingBooking.type,
      title: editingBooking.title,
      booking_date: editingBooking.type === 'hotel' ? (editingBooking as any).check_in_date : editingBooking.booking_date,
      time_start: editingBooking.type === 'hotel' ? (editingBooking as any).check_in_time : editingBooking.time_start,
      time_end: editingBooking.type === 'hotel' ? (editingBooking as any).check_out_time : editingBooking.time_end,
      location_from: editingBooking.location_from,
      location_to: editingBooking.type === 'hotel' ? (editingBooking as any).check_out_date : editingBooking.location_to,
      confirmation_code: editingBooking.confirmation_code,
      notes: editingBooking.notes,
      url: editingBooking.url,
      amount: editingBooking.amount,
      currency: editingBooking.currency,
    }).eq('id', editingBooking.id)
    setEditingBooking(null)
    setSelectedBooking(null)
    fetchBookings()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa prenotazione?')) return
    await supabase.from('bookings').delete().eq('id', id)
    setSelectedBooking(null)
    fetchBookings()
  }

  const getHotelFields = (b: Booking) => ({
    checkInDate: b.booking_date,
    checkOutDate: b.location_to,
    checkInTime: b.time_start,
    checkOutTime: b.time_end,
  })

  const renderFormFields = (type: string, data: any, onChange: (f: string, v: string) => void, onEnter: () => void) => (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={data.title}
        onChange={e => onChange('title', e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        placeholder={type === 'hotel' ? 'Nome hotel *' : type === 'restaurant' ? 'Nome ristorante *' : 'Titolo *'}
        className={inputClass}
      />

      {type === 'flight' && <>
        <div className="flex gap-3">
          <input type="text" value={data.locationFrom || ''} onChange={e => onChange('locationFrom', e.target.value)} placeholder="Aeroporto partenza" className={`flex-1 ${inputClass}`} />
          <input type="text" value={data.locationTo || ''} onChange={e => onChange('locationTo', e.target.value)} placeholder="Aeroporto arrivo" className={`flex-1 ${inputClass}`} />
        </div>
        <div className="flex gap-3">
          <FieldGroup label="Data"><input type="date" value={data.date || ''} min={startDate} max={endDate} onChange={e => onChange('date', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Ora partenza"><input type="time" value={data.timeStart || ''} onChange={e => onChange('timeStart', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Ora arrivo"><input type="time" value={data.timeEnd || ''} onChange={e => onChange('timeEnd', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
        <input type="text" value={data.flightNumber || ''} onChange={e => onChange('flightNumber', e.target.value)} placeholder="Numero volo (es. FR1234)" className={inputClass} />
      </>}

      {type === 'hotel' && <>
        <div className="flex gap-3">
          <FieldGroup label="Check-in"><input type="date" value={data.checkInDate || ''} min={startDate} max={endDate} onChange={e => onChange('checkInDate', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Orario check-in"><input type="time" value={data.checkInTime || ''} onChange={e => onChange('checkInTime', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
        <div className="flex gap-3">
          <FieldGroup label="Check-out"><input type="date" value={data.checkOutDate || ''} min={data.checkInDate || startDate} max={endDate} onChange={e => onChange('checkOutDate', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Orario check-out"><input type="time" value={data.checkOutTime || ''} onChange={e => onChange('checkOutTime', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
        <input type="text" value={data.locationFrom || ''} onChange={e => onChange('locationFrom', e.target.value)} placeholder="Indirizzo (opzionale)" className={inputClass} />
      </>}

      {type === 'transfer' && <>
        <div className="flex gap-3">
          <input type="text" value={data.locationFrom || ''} onChange={e => onChange('locationFrom', e.target.value)} placeholder="Da" className={`flex-1 ${inputClass}`} />
          <input type="text" value={data.locationTo || ''} onChange={e => onChange('locationTo', e.target.value)} placeholder="A" className={`flex-1 ${inputClass}`} />
        </div>
        <div className="flex gap-3">
          <FieldGroup label="Data"><input type="date" value={data.date || ''} min={startDate} max={endDate} onChange={e => onChange('date', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Orario pickup"><input type="time" value={data.timeStart || ''} onChange={e => onChange('timeStart', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
      </>}

      {type === 'train' && <>
        <div className="flex gap-3">
          <input type="text" value={data.locationFrom || ''} onChange={e => onChange('locationFrom', e.target.value)} placeholder="Stazione partenza" className={`flex-1 ${inputClass}`} />
          <input type="text" value={data.locationTo || ''} onChange={e => onChange('locationTo', e.target.value)} placeholder="Stazione arrivo" className={`flex-1 ${inputClass}`} />
        </div>
        <div className="flex gap-3">
          <FieldGroup label="Data"><input type="date" value={data.date || ''} min={startDate} max={endDate} onChange={e => onChange('date', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Ora partenza"><input type="time" value={data.timeStart || ''} onChange={e => onChange('timeStart', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Ora arrivo"><input type="time" value={data.timeEnd || ''} onChange={e => onChange('timeEnd', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
        <input type="text" value={data.flightNumber || ''} onChange={e => onChange('flightNumber', e.target.value)} placeholder="Numero treno (opzionale)" className={inputClass} />
      </>}

      {(type === 'activity' || type === 'restaurant' || type === 'other') && <>
        <div className="flex gap-3">
          <FieldGroup label="Data"><input type="date" value={data.date || ''} min={startDate} max={endDate} onChange={e => onChange('date', e.target.value)} className={inputClass} /></FieldGroup>
          <FieldGroup label="Orario"><input type="time" value={data.timeStart || ''} onChange={e => onChange('timeStart', e.target.value)} className={inputClass} /></FieldGroup>
        </div>
        <input type="text" value={data.locationFrom || ''} onChange={e => onChange('locationFrom', e.target.value)} placeholder="Luogo (opzionale)" className={inputClass} />
        {type === 'other' && <input type="text" value={data.notes || ''} onChange={e => onChange('notes', e.target.value)} placeholder="Note (opzionale)" className={inputClass} />}
      </>}

      <input type="text" value={data.confirmation || data.confirmation_code || ''} onChange={e => onChange('confirmation', e.target.value)} placeholder="Codice prenotazione (opzionale)" className={inputClass} />
      <div className="flex gap-3">
        <input type="number" value={data.amount || ''} onChange={e => onChange('amount', e.target.value)} placeholder="Prezzo (opzionale)" className={`flex-1 ${inputClass}`} />
        <select value={data.currency || 'EUR'} onChange={e => onChange('currency', e.target.value)} className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
          <option value="EUR" className="bg-black">EUR</option>
          <option value="USD" className="bg-black">USD</option>
          <option value="GBP" className="bg-black">GBP</option>
        </select>
      </div>
      <input type="text" value={data.url || ''} onChange={e => onChange('url', e.target.value)} placeholder="Link prenotazione (opzionale)" className={inputClass} />
    </div>
  )

  if (bookings.length === 0 && !showForm) {
    return (
      <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🎫</div>
        <h2 className="text-xl font-semibold mb-2">Nessuna prenotazione ancora</h2>
        <p className="text-white/40 text-sm mb-8 max-w-sm">Aggiungi voli, hotel, transfer e tutte le tue prenotazioni confermate.</p>
        <button onClick={() => setShowForm(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">+ Aggiungi prenotazione</button>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Nuova prenotazione</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Tipo</label>
                <select value={formData.type} onChange={e => setField('type', e.target.value)} className={inputClass}>
                  {BOOKING_TYPES.map(t => (<option key={t.id} value={t.id} className="bg-black">{t.emoji} {t.label}</option>))}
                </select>
              </div>
              {renderFormFields(formData.type, formData, setField, handleAdd)}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { resetForm(); setShowForm(false) }} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleAdd} disabled={!formData.title.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {bookings.map(booking => {
            const typeInfo = getTypeInfo(booking.type)
            const hotel = booking.type === 'hotel' ? getHotelFields(booking) : null
            return (
              <button key={booking.id} onClick={() => { setSelectedBooking(booking); setEditingBooking(null) }} className={`flex items-center gap-4 px-5 py-4 bg-white/3 border rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-left ${selectedBooking?.id === booking.id ? 'border-white/30' : 'border-white/8'}`}>
                <span className="text-2xl shrink-0">{typeInfo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{booking.title}</div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {hotel ? (
                      <>
                        {hotel.checkInDate && <span className="text-xs text-white/40">Check-in: {new Date(hotel.checkInDate + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}{hotel.checkInTime ? ` ${hotel.checkInTime.slice(0,5)}` : ''}</span>}
                        {hotel.checkOutDate && <span className="text-xs text-white/40">Check-out: {new Date(hotel.checkOutDate + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}{hotel.checkOutTime ? ` ${hotel.checkOutTime.slice(0,5)}` : ''}</span>}
                      </>
                    ) : (
                      <>
                        {booking.booking_date && <span className="text-xs text-white/40">{new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>}
                        {booking.time_start && <span className="text-xs text-white/40">{booking.time_start.slice(0,5)}{booking.time_end ? ` — ${booking.time_end.slice(0,5)}` : ''}</span>}
                        {booking.location_from && booking.location_to && <span className="text-xs text-white/40">{booking.location_from} → {booking.location_to}</span>}
                      </>
                    )}
                  </div>
                </div>
                {booking.amount && <span className="text-sm text-white/40 shrink-0">{booking.amount} {booking.currency}</span>}
                {booking.confirmation_code && <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full shrink-0">{booking.confirmation_code}</span>}
              </button>
            )
          })}
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)} className="mt-3 w-full flex items-center gap-3 px-4 py-4 border border-white/10 border-dashed rounded-2xl text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-sm">
            <span className="text-lg">+</span> Aggiungi prenotazione
          </button>
        )}
      </div>

      {selectedBooking && (
        <div className="w-80 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-5 h-fit">
          {editingBooking ? (
            <div>
              <h3 className="font-semibold mb-4">Modifica</h3>
              <div className="flex flex-col gap-3">
                <select value={editingBooking.type} onChange={e => setEditingBooking({...editingBooking, type: e.target.value})} className={inputClass}>
                  {BOOKING_TYPES.map(t => (<option key={t.id} value={t.id} className="bg-black">{t.emoji} {t.label}</option>))}
                </select>
                {renderFormFields(
                  editingBooking.type,
                  {
                    title: editingBooking.title,
                    date: editingBooking.booking_date,
                    timeStart: editingBooking.time_start,
                    timeEnd: editingBooking.time_end,
                    locationFrom: editingBooking.location_from,
                    locationTo: editingBooking.type === 'hotel' ? '' : editingBooking.location_to,
                    flightNumber: editingBooking.notes,
                    checkInDate: editingBooking.type === 'hotel' ? editingBooking.booking_date : '',
                    checkOutDate: editingBooking.type === 'hotel' ? editingBooking.location_to : '',
                    checkInTime: editingBooking.type === 'hotel' ? editingBooking.time_start : '',
                    checkOutTime: editingBooking.type === 'hotel' ? editingBooking.time_end : '',
                    confirmation: editingBooking.confirmation_code,
                    notes: editingBooking.notes,
                    url: editingBooking.url,
                    amount: editingBooking.amount,
                    currency: editingBooking.currency,
                  },
                  (field, val) => {
                    const map: Record<string, string> = {
                      title: 'title', date: 'booking_date', timeStart: 'time_start',
                      timeEnd: 'time_end', locationFrom: 'location_from', locationTo: 'location_to',
                      flightNumber: 'notes', checkInDate: 'booking_date', checkOutDate: 'location_to',
                      checkInTime: 'time_start', checkOutTime: 'time_end',
                      confirmation: 'confirmation_code', notes: 'notes', url: 'url',
                      amount: 'amount', currency: 'currency',
                    }
                    setEditingBooking({...editingBooking, [map[field] || field]: val})
                  },
                  handleUpdate
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingBooking(null)} className="flex-1 border border-white/10 text-white py-2 rounded-xl text-sm">Annulla</button>
                <button onClick={handleUpdate} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Salva</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeInfo(selectedBooking.type).emoji}</span>
                  <span className="text-xs text-white/40">{getTypeInfo(selectedBooking.type).label}</span>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="text-white/30 hover:text-white text-sm">✕</button>
              </div>
              <h3 className="font-semibold mb-3">{selectedBooking.title}</h3>
              <div className="flex flex-col gap-2 text-sm text-white/50">
                {selectedBooking.type === 'hotel' ? (
                  <>
                    {selectedBooking.booking_date && <div className="flex gap-2"><span>🛬</span><span>Check-in: {new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}{selectedBooking.time_start ? ` — ${selectedBooking.time_start.slice(0,5)}` : ''}</span></div>}
                    {selectedBooking.location_to && <div className="flex gap-2"><span>🛫</span><span>Check-out: {new Date(selectedBooking.location_to + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}{selectedBooking.time_end ? ` — ${selectedBooking.time_end.slice(0,5)}` : ''}</span></div>}
                    {selectedBooking.location_from && <div className="flex gap-2"><span>📍</span><span>{selectedBooking.location_from}</span></div>}
                  </>
                ) : (
                  <>
                    {selectedBooking.booking_date && <div className="flex gap-2"><span>📅</span><span>{new Date(selectedBooking.booking_date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>}
                    {selectedBooking.time_start && <div className="flex gap-2"><span>🕐</span><span>{selectedBooking.time_start.slice(0,5)}{selectedBooking.time_end ? ` — ${selectedBooking.time_end.slice(0,5)}` : ''}</span></div>}
                    {selectedBooking.location_from && <div className="flex gap-2"><span>🛫</span><span>{selectedBooking.location_from}</span></div>}
                    {selectedBooking.location_to && selectedBooking.type !== 'hotel' && <div className="flex gap-2"><span>🛬</span><span>{selectedBooking.location_to}</span></div>}
                    {selectedBooking.notes && (selectedBooking.type === 'flight' || selectedBooking.type === 'train') && <div className="flex gap-2"><span>🔢</span><span>{selectedBooking.notes}</span></div>}
                  </>
                )}
                {selectedBooking.confirmation_code && <div className="flex gap-2"><span>🔖</span><span>{selectedBooking.confirmation_code}</span></div>}
                {selectedBooking.amount && <div className="flex gap-2"><span>💶</span><span>{selectedBooking.amount} {selectedBooking.currency}</span></div>}
                {selectedBooking.url && <div className="flex gap-2"><span>🔗</span><a href={selectedBooking.url} target="_blank" rel="noopener noreferrer" className="text-blue-400/60 hover:text-blue-400 truncate">Link prenotazione</a></div>}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => handleDelete(selectedBooking.id)} className="flex-1 border border-red-500/30 text-red-400 py-2 rounded-xl text-sm hover:border-red-500/60">Elimina</button>
                <button onClick={() => setEditingBooking(selectedBooking)} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Modifica</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
