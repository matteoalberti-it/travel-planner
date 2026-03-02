'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Item { id: string; title: string; type: string }

export default function BucketSection({ tripId }: { tripId: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchItems() }, [tripId])

  const fetchItems = async () => {
    const { data } = await supabase.from('bucket_items').select('*').eq('trip_id', tripId).order('created_at', { ascending: false })
    if (data) setItems(data as Item[])
  }

  const handleAdd = async () => {
    if (!title.trim()) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    await supabase.from('bucket_items').insert({ trip_id: tripId, user_id: user.id, title, type: 'idea' })
    setTitle('')
    setShowAdd(false)
    fetchItems()
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowAdd(true)} className="bg-white text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
          + Aggiungi idea
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Nuova idea</h3>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome del posto o idea"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none mb-4"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm font-medium hover:border-white/30">
              Annulla
            </button>
            <button onClick={handleAdd} disabled={!title.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 disabled:opacity-30">
              Aggiungi
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd ? (
        <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">🪣</div>
          <h2 className="text-xl font-semibold mb-2">Il secchio è vuoto</h2>
          <p className="text-white/40 text-sm mb-8">Aggiungi idee, link e suggerimenti.</p>
          <button onClick={() => setShowAdd(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90">
            + Aggiungi la prima idea
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="font-medium text-sm">{item.title}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}