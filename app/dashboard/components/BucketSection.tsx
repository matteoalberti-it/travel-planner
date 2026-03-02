'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  emoji: string
  itemCount?: number
  mustDoCount?: number
}

interface Item {
  id: string
  title: string
  url: string
  notes: string
  is_must_do: boolean
  category_id: string
}

export default function BucketSection({ tripId }: { tripId: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📌')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemNotes, setNewItemNotes] = useState('')
  const [newItemMustDo, setNewItemMustDo] = useState(false)
  const supabase = createClient()

  useEffect(() => { fetchCategories() }, [tripId])
  useEffect(() => { if (activeCategory) fetchItems(activeCategory.id) }, [activeCategory])

  const fetchCategories = async () => {
    const { data: cats } = await supabase
      .from('bucket_categories')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
    if (!cats) return

    const enriched = await Promise.all(cats.map(async (cat) => {
      const { data: allItems } = await supabase.from('bucket_items').select('is_must_do').eq('category_id', cat.id)
      return {
        ...cat,
        itemCount: allItems?.length || 0,
        mustDoCount: allItems?.filter(i => i.is_must_do).length || 0
      }
    }))
    setCategories(enriched as Category[])
  }

  const fetchItems = async (categoryId: string) => {
    const { data } = await supabase
      .from('bucket_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: true })
    if (data) setItems(data as Item[])
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    const { data } = await supabase
      .from('bucket_categories')
      .insert({ trip_id: tripId, name: newCategoryName, emoji: newCategoryEmoji, created_by: user.id })
      .select()
      .single()
    if (data) {
      setNewCategoryName('')
      setNewCategoryEmoji('📌')
      setShowNewCategory(false)
      await fetchCategories()
    }
  }

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !activeCategory) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    await supabase.from('bucket_items').insert({
      trip_id: tripId,
      category_id: activeCategory.id,
      user_id: user.id,
      title: newItemTitle,
      url: newItemUrl,
      notes: newItemNotes,
      is_must_do: newItemMustDo,
      type: 'idea'
    })
    setNewItemTitle('')
    setNewItemUrl('')
    setNewItemNotes('')
    setNewItemMustDo(false)
    setShowNewItem(false)
    fetchItems(activeCategory.id)
    fetchCategories()
  }

  const toggleMustDo = async (item: Item) => {
    await supabase.from('bucket_items').update({ is_must_do: !item.is_must_do }).eq('id', item.id)
    if (activeCategory) {
      fetchItems(activeCategory.id)
      fetchCategories()
    }
  }

  const emojis = ['📌', '🍽️', '🎯', '🏨', '🚆', '🏖️', '🎭', '🛍️', '🍸', '⚽', '🏛️', '🌿']

  // VISTA DETTAGLIO CATEGORIA
  if (activeCategory) {
    return (
      <div>
        <button
          onClick={() => { setActiveCategory(null); setShowNewItem(false) }}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
        >
          ← Tutte le categorie
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeCategory.emoji}</span>
            <h2 className="text-xl font-bold">{activeCategory.name}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/3 border border-white/8 rounded-xl px-5 py-3 flex items-center gap-4 hover:border-white/20 transition-colors">
              <button
                onClick={() => toggleMustDo(item)}
                className={`text-xl transition-colors shrink-0 ${item.is_must_do ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}
                title={item.is_must_do ? 'Must Do!' : 'Segna come Must Do'}
              >
                ★
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.is_must_do && (
                    <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">Must Do</span>
                  )}
                </div>
                {item.notes && <p className="text-xs text-white/30 mt-0.5">{item.notes}</p>}
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">
                  🔗
                </a>
              )}
            </div>
          ))}
        </div>

        {showNewItem ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col gap-3">
              <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="Nome *" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} placeholder="Link opzionale" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
              <input type="text" value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="Note opzionali" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newItemMustDo} onChange={e => setNewItemMustDo(e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-white/60">★ Must Do — voglio assolutamente farlo</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNewItem(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleAddItem} disabled={!newItemTitle.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewItem(true)} className="w-full border border-white/10 border-dashed rounded-xl py-3 text-sm text-white/30 hover:text-white hover:border-white/30 transition-colors">
            + Aggiungi voce
          </button>
        )}
      </div>
    )
  }

  // VISTA ELENCO CATEGORIE
  return (
    <div>
      {categories.length === 0 ? (
        <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">🪣</div>
          <h2 className="text-xl font-semibold mb-2">Il secchio è vuoto</h2>
          <p className="text-white/40 text-sm mb-8 max-w-sm">Crea la tua prima categoria per iniziare a raccogliere idee.</p>
          <button onClick={() => setShowNewCategory(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90">
            + Crea prima categoria
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-4 px-6 py-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-left"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="flex-1 font-medium">{cat.name}</span>
              <div className="flex items-center gap-4 text-sm text-white/30 shrink-0">
                <span>inseriti: <span className="text-white/60">{cat.itemCount}</span></span>
                {(cat.mustDoCount ?? 0) > 0 && (
                  <span className="text-yellow-400/70">★ must do: {cat.mustDoCount}</span>
                )}
              </div>
              <span className="text-white/20 text-lg">›</span>
            </button>
          ))}
          <button
            onClick={() => setShowNewCategory(true)}
            className="flex items-center gap-4 px-6 py-4 border border-white/10 border-dashed rounded-2xl hover:border-white/30 hover:bg-white/3 transition-all text-white/30 hover:text-white/60"
          >
            <span className="text-3xl">＋</span>
            <span className="font-medium">Nuova categoria</span>
          </button>
        </div>
      )}

      {showNewCategory && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-4">
          <h3 className="font-semibold mb-4">Nuova categoria</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {emojis.map(e => (
              <button key={e} onClick={() => setNewCategoryEmoji(e)} className={`w-9 h-9 rounded-lg text-lg transition-colors ${newCategoryEmoji === e ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                {e}
              </button>
            ))}
          </div>
          <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nome categoria (es. Ristoranti, Attività...)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none mb-4" />
          <div className="flex gap-3">
            <button onClick={() => setShowNewCategory(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
            <button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Crea categoria</button>
          </div>
        </div>
      )}
</div>
  )
}