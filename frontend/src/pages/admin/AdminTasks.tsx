import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminUser, type StaffTask } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CheckSquare, List, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STATUSES = ['', 'pending', 'in_progress', 'completed', 'cancelled'] as const

export function AdminTasks() {
  const { token } = useAuth()
  const [tasks, setTasks] = useState<StaffTask[]>([])
  const [staff, setStaff] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', priority: 'normal', due_date: '',
  })

  const load = () => {
    if (!token) return
    setLoading(true)
    Promise.all([
      api.getAdminTasks(token, status || undefined),
      api.getAdminUsers(token),
    ]).then(([t, u]) => {
      if (t) setTasks(t)
      if (u) setStaff(u.filter((s) => s.is_active))
      setLoading(false)
    })
  }

  useEffect(load, [token, status])

  const createTask = async () => {
    if (!token || !form.title.trim()) return
    setSaving(true)
    await api.createAdminTask(token, {
      title: form.title,
      description: form.description || undefined,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : undefined,
      priority: form.priority as 'low' | 'normal' | 'high',
      due_date: form.due_date || undefined,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ title: '', description: '', assigned_to: '', priority: 'normal', due_date: '' })
    load()
  }

  const updateStatus = async (task: StaffTask, newStatus: string) => {
    if (!token) return
    await api.updateAdminTask(token, task.id, { status: newStatus })
    load()
  }

  return (
    <>
      <Seo title="Task Management" path="/admin/tasks" />
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-ips-blue">Task Management</h1>
            <p className="text-slate-600 text-sm mt-1">Assign and track staff tasks</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus size={16} /> New Task
          </Button>
        </div>

        <AdminTabBar
          section="Work Management"
          tabs={[
            { label: 'All Tasks', active: !status, onClick: () => setStatus(''), icon: List, color: 'blue' },
            { label: 'Pending', active: status === 'pending', onClick: () => setStatus('pending'), color: 'gold' },
            { label: 'In Progress', active: status === 'in_progress', onClick: () => setStatus('in_progress'), color: 'purple' },
            { label: 'Completed', active: status === 'completed', onClick: () => setStatus('completed'), color: 'green' },
          ]}
        />

        {showForm && (
          <div className="admin-card p-6 mb-6">
            <h2 className="font-bold text-ips-blue mb-4">Create Task</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Title *</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Assign To</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Due Date</label>
                <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={createTask} disabled={saving} className="gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}
                Assign Task
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
        ) : (
          <div className="space-y-3">
            {tasks.length ? tasks.map((task) => (
              <div key={task.id} className="admin-card p-5 flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{task.title}</h3>
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'low' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-700'
                    )}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && <p className="text-sm text-slate-600 mb-2">{task.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {task.assigned_to && <span>Assigned: <strong className="text-ips-blue">{task.assigned_to.name}</strong></span>}
                    {task.due_date && <span>Due: {task.due_date}</span>}
                    {task.service_request && (
                      <Link to={`/admin/requests/${task.service_request.id}`} className="text-ips-blue hover:underline">
                        {task.service_request.reference_number}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs px-3 py-2 rounded-lg border border-slate-200 capitalize"
                    value={task.status}
                    onChange={(e) => updateStatus(task, e.target.value)}
                  >
                    {STATUSES.filter(Boolean).map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            )) : (
              <div className="admin-card p-12 text-center text-slate-400">No tasks yet. Create one to assign work to your team.</div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
