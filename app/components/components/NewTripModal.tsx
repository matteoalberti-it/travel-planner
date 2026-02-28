'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

export default function NewTripModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [isGroup, setIsGroup] = useState<boolean | null>(null)
  const [destinationKnown, setDestinationKnown] = useState<boolean | null>(null)
  const [destination, setDestination] = useState('')
  const [datesKnown, setDatesKnown] = useState<boolean | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        name,
        destination: destinationKnown ? destination : null,
        start_date: datesKnown ? startDate : null,
        end_date: datesKnown ? endDate : null,
        status: 'planning',
        created_by: user.id
      })
      .select()
      .single()

    if (!error && trip) {
      await supabase.from('trip_members').insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'admin'
      })
      router.push(`/dashboard/trip/${trip.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md p-8 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-white' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Nome */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Come si chiama il viaggio?</h2>
              <p className="text-white/40 text-sm">Dagli un nome, anche provvisorio</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Es. Estate 2026, Weekend Parigi..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continua →
            </button>
          </div>
        )}

        {/* Step 2 — Solo o gruppo */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Viaggi da solo o in gruppo?</h2>
              <p className="text-white/40 text-sm">Puoi sempre aggiungere persone dopo</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { value: false, icon: '🧳', label: 'Da solo', desc: 'Organizzo tutto per me' },
                { value: true, icon: '👥', label: 'In gruppo', desc: 'Coinvolgo altre persone' }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setIsGroup(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    isGroup === opt.value
                      ? 'border-white bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-white/40 text-xs">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:border-white/30 transition-colors"
              >
                ← Indietro
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={isGroup === null}
                className="flex-1 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continua →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Destinazione */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Hai già una meta in mente?</h2>
              <p className="text-white/40 text-sm">Se non sai ancora dove andare, ti aiutiamo noi</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { value: true, icon: '📍', label: 'Sì, so già dove andare', desc: 'Ho una destinazione in mente' },
                { value: false, icon: '🔍', label: 'No, aiutami a scegliere', desc: "L'AI mi suggerirà le mete migliori" }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setDestinationKnown(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    destinationKnown === opt.value
                      ? 'border-white bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-white/40 text-xs">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {destinationKnown === true && (
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="Es. Tokyo, Barcellona, New York..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:border-white/30 transition-colors"
              >
                ← Indietro
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={destinationKnown === null || (destinationKnown === true && !destination.trim())}
                className="flex-1 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Continua →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Date */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Le date sono già decise?</h2>
              <p className="text-white/40 text-sm">Puoi sempre modificarle in seguito</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { value: true, icon: '📅', label: 'Sì, ho le date', desc: 'So già quando partire' },
                { value: false, icon: '⏳', label: 'Non ancora', desc: 'Le definiremo insieme al gruppo' }
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setDatesKnown(opt.value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    datesKnown === opt.value
                      ? 'border-white bg-white/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-white/40 text-xs">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {datesKnown === true && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Partenza</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/50 mb-1.5 block">Ritorno</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 border border-white/10 text-white py-3 rounded-xl font-semibold text-sm hover:border-white/30 transition-colors"
              >
                ← Indietro
              </button>
              <button
                onClick={handleCreate}
                disabled={datesKnown === null || loading}
                className="flex-1 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? 'Creazione...' : '✨ Crea viaggio'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}