import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminUser, type RoleOption } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AdminUsers() {
  const { token } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', password: '', roles: ['customer_service'] as string[],
  })
  const [error, setError] = useState('')

  const load = () => {
    if (!token) return
    Promise.all([api.getAdminUsers(token), api.getAdminRoles(token)]).then(([u, r]) => {
      if (u) setUsers(u)
      if (r) setRoles(r)
      setLoading(false)
    })
  }

  useEffect(load, [token])

  const createUser = async () => {
    if (!token) return
    setSaving(true)
    setError('')
    const res = await api.createAdminUser(token, form)
    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setForm({ name: '', username: '', email: '', phone: '', password: '', roles: ['customer_service'] })
      load()
    } else {
      setError(res.message || 'Failed to create user')
    }
  }

  const toggleActive = async (user: AdminUser) => {
    if (!token) return
    await api.updateAdminUser(token, user.id, { is_active: !user.is_active })
    load()
  }

  const removeUser = async (user: AdminUser) => {
    if (!token || !window.confirm(`Remove ${user.name}?`)) return
    const res = await api.deleteAdminUser(token, user.id)
    if (!res.success) alert(res.message || 'Could not remove user')
    else load()
  }

  return (
    <>
      <Seo title="Manage Users" path="/admin/users" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ips-blue">Manage Users</h1>
            <p className="text-slate-600 text-sm mt-1">Create staff accounts and assign roles</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <UserPlus size={16} /> Add User
          </Button>
        </div>

        <AdminTabBar
          section="Administration"
          tabs={[
            { label: 'User List', active: true, color: 'blue' },
            { label: 'Add User', onClick: () => setShowForm(true), icon: Plus, color: 'gold' },
          ]}
        />

        {showForm && (
          <div className="admin-card p-6 mb-6">
            <h2 className="font-bold text-ips-blue mb-4">New Staff User</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  value={form.roles[0]}
                  onChange={(e) => setForm({ ...form, roles: [e.target.value] })}
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>{r.display_name}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <Button onClick={createUser} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
        ) : (
          <div className="admin-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-600">Name</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Contact</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      {user.username && <p className="text-xs text-slate-400">@{user.username}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p>{user.phone}</p>
                      {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ips-gold/20 text-ips-blue">
                        {user.role_labels?.[0] || user.roles[0]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(user)}
                        className={cn(
                          'text-xs font-bold px-2.5 py-1 rounded-full',
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        )}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => removeUser(user)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-ips-blue/20 focus:border-ips-blue"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
