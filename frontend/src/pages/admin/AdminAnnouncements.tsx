import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type Announcement, type AnnouncementSettings } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Calendar, List, Loader2, Megaphone, Send, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

type Mode = 'compose' | 'list' | 'scheduled' | 'settings'

const adminSelectClass = 'admin-input w-full px-4 py-2.5 rounded-xl border text-sm form-select-light'
const adminFieldClass = 'admin-input w-full px-4 py-2.5 rounded-xl border text-sm'

export function AdminAnnouncements() {
  const { token } = useAuth()
  const [mode, setMode] = useState<Mode>('compose')
  const [items, setItems] = useState<Announcement[]>([])
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    title: '',
    body: '',
    header: '',
    footer: '',
    audience_type: 'clients' as 'clients' | 'staff' | 'custom',
    scheduled_at: '',
    custom_phone: '',
    custom_name: '',
  })
  const [files, setFiles] = useState<FileList | null>(null)

  const load = () => {
    if (!token) return
    setLoading(true)
    const status = mode === 'scheduled' ? 'scheduled' : undefined
    Promise.all([
      api.getAnnouncements(token, status),
      api.getAnnouncementSettings(token),
    ]).then(([list, sett]) => {
      if (list) setItems(list)
      if (sett) setSettings(sett)
      setLoading(false)
    })
  }

  useEffect(() => {
    if (mode !== 'compose') load()
  }, [token, mode])

  useEffect(() => {
    if (token && mode === 'settings') {
      api.getAnnouncementSettings(token).then((s) => { if (s) setSettings(s) })
    }
  }, [token, mode])

  const submit = async (sendNow: boolean) => {
    if (!token || !form.title.trim() || !form.body.trim()) return
    setSaving(true)
    setMessage('')

    const recipients = form.audience_type === 'custom' && form.custom_phone
      ? [{ name: form.custom_name || 'Customer', phone: form.custom_phone }]
      : undefined

    const res = await api.createAnnouncement(token, {
      title: form.title,
      body: form.body,
      header: form.header || undefined,
      footer: form.footer || undefined,
      audience_type: form.audience_type,
      recipients,
      send_now: sendNow,
      scheduled_at: !sendNow && form.scheduled_at ? form.scheduled_at : undefined,
      attachments: files ? Array.from(files) : undefined,
    })

    setSaving(false)
    if (res.success) {
      setMessage(sendNow ? 'Announcement sent via WhatsApp!' : 'Announcement saved.')
      setForm({ title: '', body: '', header: '', footer: '', audience_type: 'clients', scheduled_at: '', custom_phone: '', custom_name: '' })
      setFiles(null)
      if (!sendNow) setMode('list')
    } else {
      setMessage(res.message || 'Failed to save announcement')
    }
  }

  const resend = async (id: number) => {
    if (!token) return
    setSaving(true)
    const res = await api.sendAnnouncementNow(token, id)
    setSaving(false)
    setMessage(res.success ? 'Sent!' : res.message || 'Send failed')
    load()
  }

  const saveSettings = async () => {
    if (!token || !settings) return
    setSaving(true)
    await api.updateAnnouncementSettings(token, settings)
    setSaving(false)
    setMessage('Settings saved.')
  }

  return (
    <>
      <Seo title="Announcements" path="/admin/announcements" />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-ips-blue">WhatsApp Announcements</h1>
          <p className="text-slate-600 text-sm mt-1">Bulk messaging with attachments — New Vision / Alpha Bridge pattern</p>
        </div>

        <AdminTabBar
          section="Communication"
          tabs={[
            { label: 'Compose', active: mode === 'compose', onClick: () => setMode('compose'), icon: Megaphone, color: 'blue' },
            { label: 'Sent List', active: mode === 'list', onClick: () => setMode('list'), icon: List, color: 'gold' },
            { label: 'Scheduled', active: mode === 'scheduled', onClick: () => setMode('scheduled'), icon: Calendar, color: 'purple' },
            { label: 'Settings', active: mode === 'settings', onClick: () => setMode('settings'), icon: Settings, color: 'green' },
          ]}
        />

        {message && (
          <p className={cn('text-sm mb-4 p-3 rounded-xl', message.includes('fail') || message.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700')}>
            {message}
          </p>
        )}

        {mode === 'compose' && (
          <div className="admin-card p-6 space-y-4">
            <div>
              <label className="admin-label block text-sm font-medium mb-1.5">Title *</label>
              <input className={adminFieldClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event reminder, promotion..." />
            </div>
            <div>
              <label className="admin-label block text-sm font-medium mb-1.5">Header (optional)</label>
              <input className={adminFieldClass} value={form.header} onChange={(e) => setForm({ ...form, header: e.target.value })} placeholder="*Indatwa Protocol & Services*" />
            </div>
            <div>
              <label className="admin-label block text-sm font-medium mb-1.5">Message body *</label>
              <textarea className={`${adminFieldClass} resize-none`} rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Hello {name}, ... Tokens: {name} {phone} {email} {reference} {date}" />
            </div>
            <div>
              <label className="admin-label block text-sm font-medium mb-1.5">Audience</label>
              <select className={adminSelectClass} value={form.audience_type} onChange={(e) => setForm({ ...form, audience_type: e.target.value as typeof form.audience_type })}>
                <option value="clients">All clients (from service requests)</option>
                <option value="staff">All staff</option>
                <option value="custom">Custom phone number</option>
              </select>
            </div>
            {form.audience_type === 'custom' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={adminFieldClass} placeholder="Name" value={form.custom_name} onChange={(e) => setForm({ ...form, custom_name: e.target.value })} />
                <input className={adminFieldClass} placeholder="Phone +250..." value={form.custom_phone} onChange={(e) => setForm({ ...form, custom_phone: e.target.value })} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Attachments (PDF, images)</label>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="text-sm" onChange={(e) => setFiles(e.target.files)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Schedule for later (optional)</label>
              <input type="datetime-local" className={adminSelectClass} value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={() => submit(true)} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send Now
              </Button>
              <Button variant="outline" onClick={() => submit(false)} disabled={saving}>
                Save / Schedule
              </Button>
            </div>
          </div>
        )}

        {(mode === 'list' || mode === 'scheduled') && (
          loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
          ) : (
            <div className="space-y-3">
              {items.length ? items.map((item) => (
                <div key={item.id} className="admin-card p-5">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <div>
                      <p className="font-mono text-xs text-ips-blue">{item.reference}</p>
                      <h3 className="font-bold">{item.title}</h3>
                    </div>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize h-fit',
                      item.status === 'sent' ? 'bg-green-100 text-green-700' :
                      item.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'partial' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">{item.body}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Audience: {item.audience_type}</span>
                    {item.sent_count != null && <span>Sent: {item.sent_count}</span>}
                    {item.scheduled_at && <span>Scheduled: {new Date(item.scheduled_at).toLocaleString()}</span>}
                  </div>
                  {(item.status === 'scheduled' || item.status === 'draft' || item.status === 'failed') && (
                    <Button size="sm" className="mt-3 gap-1" onClick={() => resend(item.id)} disabled={saving}>
                      <Send size={14} /> Send Now
                    </Button>
                  )}
                </div>
              )) : (
                <div className="admin-card p-12 text-center text-slate-400">No announcements yet.</div>
              )}
            </div>
          )
        )}

        {mode === 'settings' && settings && (
          <div className="admin-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Company name</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default header</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={settings.default_header || ''} onChange={(e) => setSettings({ ...settings, default_header: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Serial prefix</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={settings.serial_prefix} onChange={(e) => setSettings({ ...settings, serial_prefix: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Next serial #</label>
                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={settings.next_serial} onChange={(e) => setSettings({ ...settings, next_serial: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={saveSettings} disabled={saving}>Save Settings</Button>
          </div>
        )}
      </div>
    </>
  )
}
