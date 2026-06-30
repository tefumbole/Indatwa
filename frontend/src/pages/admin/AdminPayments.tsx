import { AdminTabBar } from '@/components/admin/AdminTabBar'
import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type InvoiceRecord } from '@/lib/api'
import { Loader2, Send } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'

type PayTab = 'all' | 'awaiting'

export function AdminPayments() {
  const { token } = useAuth()
  const [tab, setTab] = useState<PayTab>('all')
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference: '', notes: '' })

  const load = () => {
    if (!token) return
    setLoading(true)
    api.getAdminPayments(token, tab).then((d) => {
      if (d) setInvoices(d)
      setLoading(false)
    })
  }

  useEffect(load, [token, tab])

  const recordPayment = async (invoice: InvoiceRecord) => {
    if (!token || !payForm.amount) return
    setRecording(invoice.id)
    await api.recordInvoicePayment(token, invoice.id, {
      amount: Number(payForm.amount),
      payment_method: payForm.method,
      reference: payForm.reference || undefined,
      notes: payForm.notes || undefined,
    })
    setRecording(null)
    setPayForm({ amount: '', method: 'cash', reference: '', notes: '' })
    setExpanded(null)
    load()
  }

  const resend = async (invoiceId: number) => {
    if (!token) return
    await api.sendInvoice(token, invoiceId)
  }

  return (
    <>
      <Seo title="Payments" path="/admin/payments" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-ips-blue mb-2">Payments</h1>
        <p className="text-slate-600 text-sm mb-6">Track invoices, record installments, and send PDFs to clients.</p>

        <AdminTabBar
          section="Payments"
          tabs={[
            { label: 'All Payments', active: tab === 'all', onClick: () => setTab('all'), color: 'blue' },
            { label: 'Awaiting Payment', active: tab === 'awaiting', onClick: () => setTab('awaiting'), color: 'gold' },
          ]}
        />

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
        ) : (
          <div className="admin-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Client</th>
                  <th className="px-4 py-3 hidden md:table-cell">Reference</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? invoices.map((inv) => (
                  <Fragment key={inv.id}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-ips-blue">{inv.invoice_number}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{inv.service_request?.client_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{inv.service_request?.reference_number}</td>
                      <td className="px-4 py-3">{inv.total_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-700">{inv.amount_paid.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">{inv.balance_due.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {inv.balance_due > 0 && (
                            <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                              Record
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => resend(inv.id)} className="gap-1">
                            <Send size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expanded === inv.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid sm:grid-cols-4 gap-3 max-w-3xl">
                            <input className="form-input" type="number" placeholder="Amount RWF" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                            <input className="form-input" placeholder="Method" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} />
                            <input className="form-input" placeholder="Reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
                            <Button size="sm" onClick={() => recordPayment(inv)} disabled={recording === inv.id}>
                              {recording === inv.id ? 'Saving...' : 'Save Payment'}
                            </Button>
                          </div>
                          {inv.payments && inv.payments.length > 0 && (
                            <div className="mt-3 text-xs text-slate-600">
                              <p className="font-medium mb-1">Payment history</p>
                              {inv.payments.map((p) => (
                                <p key={p.id}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'} — {p.amount.toLocaleString()} RWF {p.payment_method && `(${p.payment_method})`}</p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )) : (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No invoices in this tab.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
