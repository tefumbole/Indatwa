import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const inputClass = 'w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-ips-blue/30 outline-none text-sm'

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', password_confirmation: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await api.register(form)
    setLoading(false)

    if (result.success && result.data?.token && result.data.user) {
      login(result.data.token, result.data.user)
      navigate('/portal')
    } else {
      setError(result.message || 'Registration failed')
    }
  }

  return (
    <>
      <Seo title="Register" path="/register" />
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-2">Create Account</h1>
          <p className="text-slate-500 text-sm mb-6">Register to track your service requests.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required />
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (+250...)" required />
            <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" />
            <input className={inputClass} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (min 8 chars)" required minLength={8} />
            <input className={inputClass} type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Confirm Password" required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link to="/login" className="text-ips-blue hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}
