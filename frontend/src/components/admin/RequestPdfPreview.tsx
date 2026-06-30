import type { AdminRequestDetail } from '@/lib/api'
import { cn } from '@/lib/utils'

export function RequestPdfPreview({ data }: { data: AdminRequestDetail }) {
  const approved = data.services.filter((s) => s.status === 'approved')
  const misc = Number(data.miscellaneous_amount || 0)
  const itemsTotal = approved.reduce((sum, s) => sum + Number(s.quoted_price || 0), 0)
  const total = itemsTotal + misc

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white text-sm">
      <div className="bg-[#0B3D91] text-white p-5">
        <p className="text-lg font-bold">Indatwa Protocol & Services Agency</p>
        <p className="text-xs opacity-90 mt-1">Kimironko, Kigali, Rwanda · +250780759253</p>
        <span className="inline-block mt-3 bg-[#FACC15] text-[#0B3D91] font-bold px-3 py-1 text-xs">{data.reference_number}</span>
      </div>
      <div className="p-5 space-y-5">
        <section>
          <h4 className="text-xs font-bold text-[#0B3D91] uppercase border-b-2 border-[#FACC15] pb-1 mb-2">Request Status</h4>
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase">{data.status.replace(/_/g, ' ')}</span>
        </section>
        <section>
          <h4 className="text-xs font-bold text-[#0B3D91] uppercase border-b-2 border-[#FACC15] pb-1 mb-2">Client Information</h4>
          <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><dt className="font-semibold text-slate-600">Full Name</dt><dd>{data.client_name}</dd></div>
            <div><dt className="font-semibold text-slate-600">Phone</dt><dd>{data.client_phone}</dd></div>
            {data.client_email && <div><dt className="font-semibold text-slate-600">Email</dt><dd>{data.client_email}</dd></div>}
            {data.client_nationality && <div><dt className="font-semibold text-slate-600">Nationality</dt><dd>{data.client_nationality}</dd></div>}
          </dl>
        </section>
        <section>
          <h4 className="text-xs font-bold text-[#0B3D91] uppercase border-b-2 border-[#FACC15] pb-1 mb-2">Event Information</h4>
          <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div><dt className="font-semibold text-slate-600">Event Title</dt><dd>{data.event_title}</dd></div>
            <div><dt className="font-semibold text-slate-600">Event Type</dt><dd>{data.event_type}</dd></div>
            <div><dt className="font-semibold text-slate-600">Event Date</dt><dd>{new Date(data.event_date).toLocaleDateString()}</dd></div>
            {data.venue && <div><dt className="font-semibold text-slate-600">Venue</dt><dd>{data.venue}</dd></div>}
          </dl>
        </section>
        <section>
          <h4 className="text-xs font-bold text-[#0B3D91] uppercase border-b-2 border-[#FACC15] pb-1 mb-2">Services & Quotation</h4>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[#0B3D91]">
                <th className="border p-2 text-left">Service</th>
                <th className="border p-2 text-left">Admin</th>
                <th className="border p-2 text-left">Client</th>
                <th className="border p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((s) => (
                <tr key={s.id}>
                  <td className="border p-2">{s.name}</td>
                  <td className={cn('border p-2 capitalize', s.status === 'approved' ? 'text-green-700' : s.status === 'rejected' ? 'text-red-700' : 'text-amber-700')}>{s.status}</td>
                  <td className="border p-2 capitalize">{s.client_status || 'pending'}</td>
                  <td className="border p-2 text-right">{s.status === 'approved' && s.quoted_price != null ? `${Number(s.quoted_price).toLocaleString()} RWF` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {approved.length > 0 && (
            <div className="text-right mt-2 text-xs space-y-1">
              {misc > 0 && <p>Miscellaneous: {misc.toLocaleString()} RWF</p>}
              <p className="font-bold text-[#0B3D91]">Total: {total.toLocaleString()} RWF</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
