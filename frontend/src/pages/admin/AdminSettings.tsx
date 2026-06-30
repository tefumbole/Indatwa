import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type SiteBrandingSettings } from '@/lib/api'
import { Loader2, Save, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AdminSettings() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SiteBrandingSettings>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    api.getAdminSettings(token).then((d) => {
      if (d) setSettings(d)
      setLoading(false)
    })
  }, [token])

  const save = async () => {
    if (!token) return
    setSaving(true)
    const result = await api.updateAdminBranding(token, {
      company_name: settings.company_name,
      company_phone: settings.company_phone,
      company_location: settings.company_location,
      pdf_header_html: settings.pdf_header_html,
      pdf_footer_html: settings.pdf_footer_html,
      rental_agreement_html: settings.rental_agreement_html,
    })
    setSaving(false)
    if (result?.success) {
      setMessage('Settings saved.')
      if (result.data) setSettings(result.data as SiteBrandingSettings)
    }
  }

  const uploadLogo = async (file: File) => {
    if (!token) return
    setSaving(true)
    const result = await api.uploadAdminLogo(token, file)
    setSaving(false)
    if (result?.success && result.data) {
      setSettings(result.data)
      setMessage('Logo uploaded.')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
  }

  return (
    <>
      <Seo title="System Settings" path="/admin/settings" />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-ips-blue mb-2">System Settings</h1>
        <p className="text-slate-600 text-sm mb-6">Logo, header, footer, and rental agreement used across pages and PDFs.</p>

        {message && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">{message}</p>}

        <div className="admin-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-slate-900">Branding</h2>
          <div className="flex items-center gap-4">
            {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="h-14 object-contain border rounded p-2 bg-white" />}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 cursor-pointer text-sm hover:bg-slate-50">
              <Upload size={16} /> Upload Logo
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          </div>
          <input className="form-input" placeholder="Company name" value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
          <input className="form-input" placeholder="Phone" value={settings.company_phone || ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} />
          <input className="form-input" placeholder="Location" value={settings.company_location || ''} onChange={(e) => setSettings({ ...settings, company_location: e.target.value })} />
        </div>

        <div className="admin-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-slate-900">PDF Header & Footer (HTML)</h2>
          <textarea className="form-input min-h-[80px] font-mono text-xs" placeholder="Optional header HTML for PDFs" value={settings.pdf_header_html || ''} onChange={(e) => setSettings({ ...settings, pdf_header_html: e.target.value })} />
          <textarea className="form-input min-h-[80px] font-mono text-xs" placeholder="Optional footer HTML for PDFs" value={settings.pdf_footer_html || ''} onChange={(e) => setSettings({ ...settings, pdf_footer_html: e.target.value })} />
        </div>

        <div className="admin-card rounded-xl p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-slate-900">Rental Agreement (HTML)</h2>
          <p className="text-xs text-slate-500">Shown when client views terms before signing. Use &lt;p&gt;, &lt;strong&gt; tags.</p>
          <textarea className="form-input min-h-[220px] font-mono text-xs" value={settings.rental_agreement_html || ''} onChange={(e) => setSettings({ ...settings, rental_agreement_html: e.target.value })} />
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </>
  )
}
