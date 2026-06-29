import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Loader2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const inputClass = 'w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-ips-blue/30 outline-none text-sm'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const [loginId, setLoginId] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [twoFaCode, setTwoFaCode] = useState('')
  const [needs2fa, setNeeds2fa] = useState(false)

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const id = loginId.trim()
    const payload = id.includes('@')
      ? { email: id, password }
      : /^\+?\d[\d\s-]+$/.test(id)
        ? { phone: id, password }
        : { username: id, password }
    const result = await api.login(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.message || 'Login failed')
      return
    }

    if (result.data?.requires_2fa && result.data.temp_token) {
      setNeeds2fa(true)
      setTempToken(result.data.temp_token)
      return
    }

    if (result.data?.token && result.data.user) {
      login(result.data.token, result.data.user)
      navigate(result.data.user.roles.includes('client') ? '/portal' : '/admin')
    }
  }

  const handle2fa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await api.verify2fa(tempToken, twoFaCode)
    setLoading(false)
    if (result.success && result.data?.token && result.data.user) {
      login(result.data.token, result.data.user)
      navigate('/admin')
    } else {
      setError(result.message || 'Invalid 2FA code')
    }
  }

  const handleRequestOtp = async () => {
    setLoading(true)
    setError('')
    const result = await api.requestOtp(phone)
    setLoading(false)
    if (result.success) {
      setOtpSent(true)
    } else {
      setError(result.message || 'Failed to send OTP')
    }
  }

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await api.verifyOtp({ phone, otp, context: 'login' })
    setLoading(false)
    if (result.success && result.data?.token && result.data.user) {
      login(result.data.token, result.data.user)
      navigate('/portal')
    } else {
      setError(result.message || 'Invalid OTP')
    }
  }

  if (needs2fa) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-slate-500 text-sm mb-6">Enter the 6-digit code from your authenticator app.</p>
          <form onSubmit={handle2fa} className="space-y-4">
            <input className={inputClass} value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} placeholder="000000" maxLength={6} />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify'}</Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo title="Login" path="/login" />
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-ips-blue dark:text-white mb-2">Login</h1>
          <p className="text-slate-500 text-sm mb-6">Clients use phone; admins can use username <strong>admin</strong>.</p>

          <div className="flex gap-2 mb-6">
            {(['password', 'otp'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setOtpSent(false) }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === t ? 'bg-ips-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {t === 'password' ? 'Password' : 'WhatsApp OTP'}
              </button>
            ))}
          </div>

          {tab === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <input className={inputClass} value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="Username, email or phone" required />
              <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+250...)" required />
              {!otpSent ? (
                <Button type="button" onClick={handleRequestOtp} disabled={loading || !phone} className="w-full gap-2">
                  <MessageCircle size={16} /> Send OTP via WhatsApp
                </Button>
              ) : (
                <>
                  <input className={inputClass} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} required />
                  <Button type="submit" disabled={loading} className="w-full">Verify & Sign In</Button>
                </>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            No account? <Link to="/register" className="text-ips-blue hover:underline">Register</Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}
