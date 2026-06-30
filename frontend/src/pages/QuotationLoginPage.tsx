import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function QuotationLoginPage() {
  const { accessToken } = useParams<{ accessToken: string }>()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [profileMode, setProfileMode] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [trackingToken, setTrackingToken] = useState('')
  const [profile, setProfile] = useState({ name: '', username: '', password: '' })

  useEffect(() => {
    if (!accessToken) return
    api.quotationLogin(accessToken).then((result) => {
      if (!result?.success || !result.data?.token) {
        setError(result?.message || 'Invalid quotation link')
        setLoading(false)
        return
      }
      login(result.data.token, result.data.user!)
      setAuthToken(result.data.token)
      setTrackingToken(result.data.tracking_token || '')
      if (result.data.requires_profile_completion) {
        setProfileMode(true)
        setProfile((p) => ({
          ...p,
          name: result.data!.user?.name || '',
          username: result.data!.user?.username || '',
        }))
      } else if (result.data.tracking_token) {
        navigate(`/track/${result.data.tracking_token}`, { replace: true })
      }
      setLoading(false)
    })
  }, [accessToken, login, navigate])

  const completeProfile = async () => {
    if (!authToken || !profile.name || !profile.username || !profile.password) return
    const result = await api.completeProfile(authToken, profile)
    if (result?.success) {
      navigate(`/track/${trackingToken}`, { replace: true })
    } else {
      setError(result?.message || 'Could not update profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-ips-blue" />
      </div>
    )
  }

  if (error && !profileMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  if (profileMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
          <h1 className="text-xl font-bold text-ips-blue mb-2">Complete Your Profile</h1>
          <p className="text-sm text-slate-600 mb-6">Update your details before reviewing your quotation.</p>
          <div className="space-y-3">
            <input className="form-input w-full" placeholder="Full name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <input className="form-input w-full" placeholder="Username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
            <input className="form-input w-full" type="password" placeholder="New password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} />
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <Button className="w-full mt-6" onClick={completeProfile}>Continue to Quotation</Button>
        </div>
      </div>
    )
  }

  return null
}
