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

interface Props {
  tripId: string
}

const PRESET_CATEGORIES = [
  { emoji: '🍽️', name: 'Ristoranti' },
  { emoji: '🎯', name: 'Attività' },
  { emoji: '🏛️', name: 'Musei & Cultura' },
  { emoji: '🛏️', name: 'Hotel & Alloggi' },
  { emoji: '🚆', name: 'Trasporti' },
  { emoji: '🏖️', name: 'Spiagge & Natura' },
  { emoji: '🍸', name: 'Nightlife' },
  { emoji: '🛍️', name: 'Shopping' },
  { emoji: '⚽', name: 'Sport & Avventura' },
  { emoji: '🔖', name: 'Altro' },
]

const CUSTOM_EMOJIS = ['📌','🎪','🎨','🎭','🎬','🎤','🏔️','🌊','🍜','🍕','☕','🎠']

export default function BucketSection({ tripId }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [categoryType, setCategoryType] = useState<'preset' | 'custom'>('preset')
  const [selectedPreset, setSelectedPreset] = useState(PRESET_CATEGORIES[0])
  const [customName, setCustomName] = useState('')
  const [customEmoji, setCustomEmoji] = useState('📌')
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')
  const [newItemNotes, setNewItemNotes] = useState('')
  const [newItemMustDo, setNewItemMustDo] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editingCategory, setEditingCategory] = useState(false)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryEmoji, setEditCategoryEmoji] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchCategories() }, [tripId])

  const fetchCategories = async () => {
    const { data: cats } = await supabase.from('bucket_categories').select('*').eq('trip_id', tripId).order('created_at', { ascending: true })
    if (!cats) return
    const enriched = await Promise.all(cats.map(async cat => {
      const { data: allItems } = await supabase.from('bucket_items').select('is_must_do').eq('category_id', cat.id)
      return { ...cat, itemCount: allItems?.length || 0, mustDoCount: allItems?.filter(i => i.is_must_do).length || 0 }
    }))
    setCategories(enriched)
  }

  const fetchItems = async (categoryId: string) => {
    const { data } = await supabase.from('bucket_items').select('*').eq('category_id', categoryId).order('created_at', { ascending: true })
    if (data) setItems(data as Item[])
  }

  const handleSelectCategory = (cat: Category) => {
    setActiveCategory(cat)
    fetchItems(cat.id)
    setShowNewItem(false)
    setEditingItem(null)
    setEditingCategory(false)
  }

  const handleCreateCategory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const emoji = categoryType === 'preset' ? selectedPreset.emoji : customEmoji
    const name = categoryType === 'preset' ? selectedPreset.name : customName
    if (!name.trim()) return
    await supabase.from('bucket_categories').insert({ trip_id: tripId, name, emoji, created_by: user.id })
    setShowNewCategory(false)
    setCustomName('')
    setCategoryType('preset')
    setSelectedPreset(PRESET_CATEGORIES[0])
    fetchCategories()
  }

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !activeCategory) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bucket_items').insert({ trip_id: tripId, category_id: activeCategory.id, user_id: user.id, title: newItemTitle, url: newItemUrl, notes: newItemNotes, is_must_do: newItemMustDo, type: 'idea' })
    setNewItemTitle(''); setNewItemUrl(''); setNewItemNotes(''); setNewItemMustDo(false); setShowNewItem(false)
    fetchItems(activeCategory.id); fetchCategories()
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return
    await supabase.from('bucket_items').update({ title: editingItem.title, url: editingItem.url, notes: editingItem.notes, is_must_do: editingItem.is_must_do }).eq('id', editingItem.id)
    setEditingItem(null)
    if (activeCategory) fetchItems(activeCategory.id)
    fetchCategories()
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Eliminare questa voce?')) return
    await supabase.from('bucket_items').delete().eq('id', id)
    if (activeCategory) fetchItems(activeCategory.id)
    fetchCategories()
  }

  const toggleMustDo = async (item: Item) => {
    await supabase.from('bucket_items').update({ is_must_do: !item.is_must_do }).eq('id', item.id)
    if (activeCategory) fetchItems(activeCategory.id)
    fetchCategories()
  }

  const handleUpdateCategory = async () => {
    if (!activeCategory || !editCategoryName.trim()) return
    await supabase.from('bucket_categories').update({ name: editCategoryName, emoji: editCategoryEmoji }).eq('id', activeCategory.id)
    setEditingCategory(false)
    const updated = { ...activeCategory, name: editCategoryName, emoji: editCategoryEmoji }
    setActiveCategory(updated)
    fetchCategories()
  }

  const handleDeleteCategory = async () => {
    if (!activeCategory) return
    if (!confirm('Eliminare questa categoria e tutte le sue voci?')) return
    await supabase.from('bucket_categories').delete().eq('id', activeCategory.id)
    setActiveCategory(null)
    fetchCategories()
  }

  if (categories.length === 0 && !showNewCategory) {
    return (
      <div className="border border-white/10 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🪣</div>
        <h2 className="text-xl font-semibold mb-2">Il secchio e vuoto</h2>
        <p className="text-white/40 text-sm mb-8 max-w-sm">Aggiungi le cose che vuoi fare, vedere e mangiare.</p>
        <button onClick={() => setShowNewCategory(true)} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">+ Aggiungi categoria</button>
      </div>
    )
  }

  return (
    <div>
      {!activeCategory && (
        <div>
          <div className="flex items-center px-4 mb-2 text-xs text-white/30 gap-4">
            <span className="flex-1">Categoria</span>
            <span className="w-16 text-right">inseriti</span>
            <span className="w-16 text-right">must do</span>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => handleSelectCategory(cat)} className="flex items-center px-4 py-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-left gap-4">
                <span className="text-2xl">{cat.emoji}</span>
                <span className="flex-1 font-medium">{cat.name}</span>
                <span className="w-16 text-right text-sm text-white/40">{cat.itemCount ?? 0}</span>
                <span className={`w-16 text-right text-sm ${(cat.mustDoCount ?? 0) > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{cat.mustDoCount ?? 0}</span>
                <span className="text-white/20">›</span>
              </button>
            ))}
          </div>

          {showNewCategory ? (
            <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Nuova categoria</h3>
              <div className="flex flex-col gap-2">
                {PRESET_CATEGORIES.map(p => (
                  <button key={p.name} onClick={() => { setSelectedPreset(p); setCategoryType('preset') }} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${categoryType === 'preset' && selectedPreset.name === p.name ? 'bg-white/15 border border-white/30' : 'bg-white/5 border border-white/5 hover:border-white/20'}`}>
                    <span className="text-xl">{p.emoji}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
                <button onClick={() => setCategoryType('custom')} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${categoryType === 'custom' ? 'bg-white/15 border border-white/30' : 'bg-white/5 border border-dashed border-white/20 hover:border-white/40'}`}>
                  <span className="text-xl">＋</span>
                  <span className="text-white/60">Crea personalizzata</span>
                </button>
                {categoryType === 'custom' && (
                  <div className="flex flex-col gap-3 mt-1 p-3 bg-white/5 rounded-xl">
                    <div className="flex flex-wrap gap-2">
                      {CUSTOM_EMOJIS.map(e => (
                        <button key={e} onClick={() => setCustomEmoji(e)} className={`w-10 h-10 rounded-xl text-xl transition-colors ${customEmoji === e ? 'bg-white/20 border border-white/40' : 'bg-white/5 hover:bg-white/10'}`}>{e}</button>
                      ))}
                    </div>
                    <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Nome categoria..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowNewCategory(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
                <button onClick={handleCreateCategory} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold">Crea categoria</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewCategory(true)} className="mt-2 w-full flex items-center gap-3 px-4 py-4 border border-white/10 border-dashed rounded-2xl text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-sm">
              <span className="text-lg">+</span> Nuova categoria
            </button>
          )}
        </div>
      )}

      {activeCategory && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setActiveCategory(null); setEditingCategory(false) }} className="text-sm text-white/40 hover:text-white transition-colors">← Tutte le categorie</button>
            {!editingCategory && (
              <div className="flex gap-3">
                <button onClick={() => { setEditingCategory(true); setEditCategoryName(activeCategory.name); setEditCategoryEmoji(activeCategory.emoji) }} className="text-xs text-white/30 hover:text-white transition-colors">✏️ Modifica</button>
                <button onClick={handleDeleteCategory} className="text-xs text-red-400/50 hover:text-red-400 transition-colors">🗑️ Elimina</button>
              </div>
            )}
          </div>

          {editingCategory ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold mb-3">Modifica categoria</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {CUSTOM_EMOJIS.map(e => (
                  <button key={e} onClick={() => setEditCategoryEmoji(e)} className={`w-10 h-10 rounded-xl text-xl ${editCategoryEmoji === e ? 'bg-white/20 border border-white/40' : 'bg-white/5 hover:bg-white/10'}`}>{e}</button>
                ))}
              </div>
              <input type="text" value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none mb-3" />
              <div className="flex gap-3">
                <button onClick={() => setEditingCategory(false)} className="flex-1 border border-white/10 text-white py-2 rounded-xl text-sm">Annulla</button>
                <button onClick={handleUpdateCategory} className="flex-1 bg-white text-black py-2 rounded-xl text-sm font-semibold">Salva</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{activeCategory.emoji}</span>
              <h2 className="text-xl font-semibold">{activeCategory.name}</h2>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            {items.map(item => (
              <div key={item.id} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 group">
                {editingItem?.id === item.id ? (
                  <div className="flex flex-col gap-2">
                    <input type="text" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                    <input type="text" value={editingItem.url} onChange={e => setEditingItem({...editingItem, url: e.target.value})} placeholder="Link (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <input type="text" value={editingItem.notes} onChange={e => setEditingItem({...editingItem, notes: e.target.value})} placeholder="Note (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none" />
                    <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                      <input type="checkbox" checked={editingItem.is_must_do} onChange={e => setEditingItem({...editingItem, is_must_do: e.target.checked})} className="w-4 h-4 rounded" />
                      Must Do
                    </label>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setEditingItem(null)} className="flex-1 border border-white/10 text-white py-1.5 rounded-lg text-xs">Annulla</button>
                      <button onClick={handleUpdateItem} className="flex-1 bg-white text-black py-1.5 rounded-lg text-xs font-semibold">Salva</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleMustDo(item)} className={`text-xl transition-colors shrink-0 ${item.is_must_do ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}>★</button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400/60 hover:text-blue-400 truncate block">{item.url}</a>}
                      {item.notes && <div className="text-xs text-white/30 mt-0.5">{item.notes}</div>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingItem(item)} className="text-xs text-white/30 hover:text-white">✏️</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-white/30 hover:text-red-400">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showNewItem ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Nuova voce</h3>
              <div className="flex flex-col gap-2">
                <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="Nome *" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                <input type="text" value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} placeholder="Link (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                <input type="text" value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="Note (opzionale)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none" />
                <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer mt-1">
                  <input type="checkbox" checked={newItemMustDo} onChange={e => setNewItemMustDo(e.target.checked)} className="w-4 h-4 rounded" />
                  Must Do
                </label>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowNewItem(false)} className="flex-1 border border-white/10 text-white py-2.5 rounded-xl text-sm hover:border-white/30">Annulla</button>
                <button onClick={handleAddItem} disabled={!newItemTitle.trim()} className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30">Aggiungi</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewItem(true)} className="w-full flex items-center gap-3 px-4 py-4 border border-white/10 border-dashed rounded-2xl text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-sm">
              <span className="text-lg">+</span> Aggiungi voce
            </button>
          )}
        </div>
      )}
    </div>
  )
}
