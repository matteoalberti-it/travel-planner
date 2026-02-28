'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o password non corretti')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Triply</span>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Bentornato</h1>
        <p className="text-white/50 text-sm text-center mb-8">Accedi al tuo account per continuare</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="mario@esempio.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="La tua password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Accesso in corso...' : 'Accedi →'}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-6">
          Non hai un account?{' '}
          <Link href="/register" className="text-white/60 hover:text-white transition-colors">
            Registrati gratis
          </Link>
        </p>
      </div>
    </main>
  )
}