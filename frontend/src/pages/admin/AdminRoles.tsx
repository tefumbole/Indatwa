import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type PermissionGroup, type RoleDetail } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Loader2, Plus, Shield, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function AdminRoles() {
  const { token } = useAuth()
  const [roles, setRoles] = useState<RoleDetail[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<RoleDetail | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    display_name: '',
    name: '',
    description: '',
    permission_ids: [] as number[],
  })

  const load = () => {
    if (!token) return
    setLoading(true)
    Promise.all([api.getAdminRoles(token), api.getPermissionGroups(token)]).then(([r, p]) => {
      if (r) setRoles(r)
      if (p) setPermissionGroups(p)
      setLoading(false)
    })
  }

  useEffect(load, [token])

  const openCreate = () => {
    setEditing(null)
    setForm({ display_name: '', name: '', description: '', permission_ids: [] })
    setShowForm(true)
    setError('')
  }

  const openEdit = (role: RoleDetail) => {
    setEditing(role)
    setForm({
      display_name: role.display_name,
      name: role.name,
      description: role.description || '',
      permission_ids: role.permissions.map((p) => p.id),
    })
    setShowForm(true)
    setError('')
  }

  const togglePermission = (id: number) => {
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter((p) => p !== id)
        : [...f.permission_ids, id],
    }))
  }

  const toggleModule = (ids: number[]) => {
    const allSelected = ids.every((id) => form.permission_ids.includes(id))
    setForm((f) => ({
      ...f,
      permission_ids: allSelected
        ? f.permission_ids.filter((id) => !ids.includes(id))
        : [...new Set([...f.permission_ids, ...ids])],
    }))
  }

  const save = async () => {
    if (!token || !form.display_name.trim()) return
    setSaving(true)
    setError('')

    const payload = {
      display_name: form.display_name,
      name: form.name || undefined,
      description: form.description || undefined,
      permission_ids: form.permission_ids,
    }

    const res = editing
      ? await api.updateAdminRole(token, editing.id, payload)
      : await api.createAdminRole(token, payload)

    setSaving(false)
    if (res.success) {
      setShowForm(false)
      setEditing(null)
      load()
    } else {
      setError(res.message || 'Failed to save role')
    }
  }

  const remove = async (role: RoleDetail) => {
    if (!token || role.is_protected || !window.confirm(`Delete role "${role.display_name}"?`)) return
    const res = await api.deleteAdminRole(token, role.id)
    if (!res.success) alert(res.message || 'Could not delete role')
    else load()
  }

  return (
    <>
      <Seo title="Roles & Permissions" path="/admin/roles" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ips-blue">Roles & Permissions</h1>
            <p className="text-slate-600 text-sm mt-1">Create roles and control what each role can access</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> New Role
          </Button>
        </div>

        <AdminTabBar
          section="Administration"
          tabs={[
            { label: 'Role List', active: !showForm, onClick: () => setShowForm(false), color: 'blue' },
            { label: 'Create Role', active: showForm && !editing, onClick: openCreate, icon: Plus, color: 'gold' },
            { label: 'Users', href: '/admin/users', color: 'purple' },
          ]}
        />

        {showForm && (
          <div className="admin-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ips-blue flex items-center gap-2">
                <Shield size={18} />
                {editing ? `Edit Role — ${editing.display_name}` : 'New Role'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Field label="Display Name *" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
              <Field
                label="System Name (optional)"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="auto-generated from display name"
                disabled={Boolean(editing?.is_protected)}
              />
              <div className="sm:col-span-2">
                <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              </div>
            </div>

            <h3 className="font-semibold text-slate-800 mb-3">Permissions</h3>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {permissionGroups.map((group) => {
                const ids = group.permissions.map((p) => p.id)
                const selectedCount = ids.filter((id) => form.permission_ids.includes(id)).length
                return (
                  <div key={group.module} className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-ips-blue">{group.label}</p>
                      <button
                        type="button"
                        onClick={() => toggleModule(ids)}
                        className="text-xs font-semibold text-ips-blue hover:underline"
                      >
                        {selectedCount === ids.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.id}
                          className={cn(
                            'flex items-start gap-2 text-sm p-2 rounded-lg cursor-pointer border',
                            form.permission_ids.includes(perm.id)
                              ? 'border-ips-gold bg-ips-gold/10 text-slate-900'
                              : 'border-transparent bg-white text-slate-700'
                          )}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={form.permission_ids.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="flex gap-3 mt-5">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {editing ? 'Save Changes' : 'Create Role'}
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
                  <th className="px-5 py-3 font-semibold text-slate-600">Role</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Permissions</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Users</th>
                  <th className="px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{role.display_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{role.name}</p>
                      {role.description && <p className="text-xs text-slate-500 mt-1">{role.description}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ips-blue/10 text-ips-blue">
                        {role.permissions.length} permissions
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{role.users_count}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(role)}>Edit</Button>
                        {!role.is_protected && (
                          <button onClick={() => remove(role)} className="text-red-500 hover:text-red-700 p-2">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Assign roles to staff under <Link to="/admin/users" className="text-ips-blue hover:underline">Manage Users</Link>.
        </p>
      </div>
    </>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="admin-label block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className="admin-input w-full px-4 py-2.5 rounded-xl border text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
