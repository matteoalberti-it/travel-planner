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
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
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
      return { ...cat, itemCount: allItems?.length || 0, mustDoCount: allItems?.filter(i => i.is_must_do).length || 0 }
    }))
    setCategories(enriched as Category[])
  }

  const fetchItems = async (categoryId: string) => {
    const { data } = await supabase.from('bucket_items').select('*').eq('category_id', categoryId).order('created_at', { ascending: true })
    if (data) setItems(data as Item[])
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    const { data } = await supabase.from('bucket_categories').insert({ trip_id: tripId, name: newCategoryName, emoji: newCategoryEmoji, created_by: user.id }).select().single()
    if (data) {
      setNewCategoryName('')
      setNewCategoryEmoji('📌')
      setShowNewCategory(false)
      await fetchCategories()
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return
    await supabase.from('bucket_categories').update({ name: editingCategory.name, emoji: editingCategory.emoji }).eq('id', editingCategory.id)
    setEditingCategory(null)
    if (activeCategory?.id === editingCategory.id) {
      setActiveCategory({ ...activeCategory, name: editingCategory.name, emoji: editingCategory.emoji })
    }
    fetchCategories()
  }

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !activeCategory) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    if (!user) return
    await supabase.from('bucket_items').insert({ trip_id: tripId, category_id: activeCategory.id, user_id: user.id, title: newItemTitle, url: newItemUrl, notes: newItemNotes, is_must_do: newItemMustDo, type: 'idea' })
    setNewItemTitle('')
    setNewItemUrl('')
    setNewItemNotes('')
    setNewItemMustDo(false)
    setShowNewItem(false)
    fetchItems(activeCategory.id)
    fetchCategories()
  }

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.title.trim()) return
    await supabase.from('bucket_items').update({ title: editingItem.title, url: editingItem.url, notes: editingItem.notes, is_must_do: editingItem.is_must_do }).eq('id', editingItem.id)
    setEditingItem(null)
    if (activeCategory) fetchItems(activeCategory.id)
    fetchCategories()
  }

  const toggleMustDo = async (item: Item) => {
    await supabase.from('bucket_items').update({ is_must_do: !item.is_must_do }).eq('id', item.id)
    if (activeCategory) { fetchItems(activeCategory.id); fetchCategories() }
  }

  const emojis = ['📌', '🍽️', '🎯', '🏨', '🚆', '🏖️', '🎭', '🛍️', '🍸', '⚽', '🏛️', '🌿']

  // VISTA DETTAGLIO CATEGORIA
  if (activeCategory) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setActiveCategory(null); setShowNewItem(false); setEditingItem(null) }} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
            ← Tutte le categorie
          </button>
          <button onClick={() => setEditingCategory({ ...activeCategory })} className="text-xs text-white/30 hover:text-white transition-colors">
            ✏️ Modifica categoria
          </button>
        </div>

        {editingCategory && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <h3 className="font-semibold mb-4">Modifica categoria</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {emojis.map(e => (
                <button key={e} onClick={() => setEditingCategory({ ...editingCategory, emoji: e })} className={`w-9 h-9 rounded-lg text-lg transition-colors ${editingCategory.emoji === e ? 'bg-white/20' : 'hover:bg-white/10'}`}>{e}</button>
              ))}
            </div>
            <input type="text" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setEditingCategory(null)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
              <button onClick={handleUpdateCategory} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold">Salva</button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{activeCategory.emoji}</span>
          <h2 className="text-xl font-bold">{activeCategory.name}</h2>
        </div>

        {/* Header colonne */}
        {items.length > 0 && (
          <div className="flex items-center gap-4 px-5 mb-2 text-xs text-white/30">
            <span className="w-6"></span>
            <span className="flex-1">Nome</span>
            <span className="w-16 text-right">Must Do</span>
            <span className="w-8"></span>
          </div>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {items.map(item => (
            <div key={item.id}>
              {editingItem?.id === item.id ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-col gap-3">
                    <input type="text" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none" />
                    <input type="text" value={editingItem.url} onChange={e => setEditingItem({ ...editingItem, url: e.target.value })} placeholder="Link" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <input type="text" value={editingItem.notes} onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })} placeholder="Note" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingItem.is_must_do} onChange={e => setEditingItem({ ...editingItem, is_must_do: e.target.checked })} className="w-4 h-4 rounded" />
                      <span className="text-sm text-white/60">★ Must Do</span>
                    </label>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setEditingItem(null)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
                    <button onClick={handleUpdateItem} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold">Salva</button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/3 border border-white/8 rounded-xl px-5 py-3 flex items-center gap-4 hover:border-white/20 transition-colors group">
                  <button onClick={() => toggleMustDo(item)} className={`text-xl transition-colors shrink-0 ${item.is_must_do ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>★</button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {item.notes && <p className="text-xs text-white/30 mt-0.5">{item.notes}</p>}
                  </div>
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">🔗</a>}
                  <button onClick={() => setEditingItem(item)} className="text-xs text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0">✏️</button>
                </div>
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
          <button onClick={() => setShowNewCategory(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90">+ Crea prima categoria</button>
        </div>
      ) : (
        <div>
          {/* Header colonne */}
          <div className="flex items-center gap-4 px-6 mb-2 text-xs text-white/30">
            <span className="text-3xl opacity-0">x</span>
            <span className="flex-1"></span>
            <div className="flex items-center gap-6 shrink-0 mr-6">
              <span className="w-16 text-right">inseriti</span>
              <span className="w-16 text-right">must do</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat)} className="flex items-center gap-4 px-6 py-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-left">
                <span className="text-3xl">{cat.emoji}</span>
                <span className="flex-1 font-medium">{cat.name}</span>
                <div className="flex items-center gap-6 shrink-0">
                  <span className="w-16 text-right text-white/50">{cat.itemCount}</span>
                  <span className={`w-16 text-right ${(cat.mustDoCount ?? 0) > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{cat.mustDoCount}</span>
                </div>
                <span className="text-white/20 text-lg">›</span>
              </button>
            ))}
            <button onClick={() => setShowNewCategory(true)} className="flex items-center gap-4 px-6 py-4 border border-white/10 border-dashed rounded-2xl hover:border-white/30 hover:bg-white/3 transition-all text-white/30 hover:text-white/60">
              <span className="text-3xl">＋</span>
              <span className="font-medium">Nuova categoria</span>
            </button>
          </div>
        </div>
      )}

      {showNewCategory && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-4">
          <h3 className="font-semibold mb-4">Nuova categoria</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {emojis.map(e => (
              <button key={e} onClick={() => setNewCategoryEmoji(e)} className={`w-9 h-9 rounded-lg text-lg transition-colors ${newCategoryEmoji === e ? 'bg-white/20' : 'hover:bg-white/10'}`}>{e}</button>
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