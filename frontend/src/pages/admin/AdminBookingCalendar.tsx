import { Button } from '@/components/ui/Button'
import { Seo } from '@/components/shared/Seo'
import { useAuth } from '@/context/AuthContext'
import { api, type BookingCalendarDay } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AdminBookingCalendar() {
  const { token } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [bookedDates, setBookedDates] = useState<BookingCalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const bookedMap = useMemo(() => {
    const map = new Map<string, BookingCalendarDay>()
    bookedDates.forEach((d) => map.set(d.date, d))
    return map
  }, [bookedDates])

  const load = () => {
    if (!token) return
    setLoading(true)
    api.getBookingCalendar(token, year, month).then((d) => {
      if (d) setBookedDates(d.booked_dates)
      setLoading(false)
    })
  }

  useEffect(load, [token, year, month])

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const cells: ({ day: number; date: string } | null)[] = []

    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, date })
    }
    return cells
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }

  const selectDay = (date: string) => {
    setSelectedDate(date)
    const entry = bookedMap.get(date)
    setLabel(entry?.label || '')
    setNotes(entry?.notes || '')
  }

  const toggleBooked = async (isBooked: boolean) => {
    if (!token || !selectedDate) return
    setSaving(true)
    await api.toggleBookingDate(token, {
      date: selectedDate,
      is_booked: isBooked,
      label: label || undefined,
      notes: notes || undefined,
    })
    setSaving(false)
    load()
    if (!isBooked) {
      setSelectedDate(null)
      setLabel('')
      setNotes('')
    }
  }

  const selectedEntry = selectedDate ? bookedMap.get(selectedDate) : null

  return (
    <>
      <Seo title="Booking Calendar" path="/admin/bookings" />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-ips-blue mb-2">Booking Calendar</h1>
        <p className="text-slate-600 text-sm mb-6">View and manage booked dates per month</p>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={prevMonth} className="gap-1">
              <ChevronLeft size={16} /> Previous
            </Button>
            <span className="font-bold text-lg text-ips-blue min-w-[160px] text-center">{monthLabel}</span>
            <Button variant="outline" size="sm" onClick={nextMonth} className="gap-1">
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-ips-blue" /></div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 admin-card p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-500 py-2">{d.slice(0, 3)}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} className="min-h-[72px] rounded-lg bg-slate-50 dark:bg-slate-800/30" />
                  const booked = bookedMap.has(cell.date)
                  const selected = selectedDate === cell.date
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => selectDay(cell.date)}
                      className={cn(
                        'min-h-[72px] rounded-lg border p-2 text-left transition-all',
                        booked ? 'bg-ips-blue/10 border-ips-blue/30' : 'bg-amber-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
                        selected && 'ring-2 ring-ips-gold'
                      )}
                    >
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cell.day}</span>
                      {booked && (
                        <span className="block mt-1 text-[9px] font-bold uppercase bg-ips-blue text-white rounded px-1.5 py-0.5 w-fit">
                          Booked
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="admin-card p-5">
              {selectedDate ? (
                <>
                  <h3 className="font-bold text-ips-blue mb-1">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {selectedEntry ? 'This date is marked as booked.' : 'This date is currently free.'}
                  </p>

                  {selectedEntry?.service_request && (
                    <div className="text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-4">
                      <p className="font-mono font-bold text-ips-blue">{selectedEntry.service_request.reference_number}</p>
                      <p>{selectedEntry.service_request.event_title}</p>
                      <p className="text-slate-500">{selectedEntry.service_request.client_name}</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    <input
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      placeholder="Label (optional)"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                    <textarea
                      className="w-full px-3 py-2 rounded-lg border text-sm min-h-[80px]"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {!selectedEntry ? (
                      <Button size="sm" onClick={() => toggleBooked(true)} disabled={saving}>
                        Mark as Booked
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toggleBooked(false)} disabled={saving}>
                        Mark as Free
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 py-8 text-center">Select a date to view or update its booking status.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
