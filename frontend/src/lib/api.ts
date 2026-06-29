import type { RequestFormData } from '@/schemas/requestSchema'

const API_BASE = import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:8000/api/v1')

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

async function fetchApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

async function postApi<T>(endpoint: string, body: unknown, token?: string): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch {
    return { success: false, message: 'Network error. Please try again.' }
  }
}

async function deleteApi<T>(endpoint: string, token: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    })
    return await res.json()
  } catch {
    return { success: false, message: 'Network error.' }
  }
}

async function postAuthApi<T>(endpoint: string, body: unknown, token: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch {
    return { success: false, message: 'Network error.' }
  }
}
async function patchApi<T>(endpoint: string, body: unknown, token: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch {
    return { success: false, message: 'Network error.' }
  }
}

async function authFetch<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
    if (!res.ok) return null
    const json: ApiResponse<T> = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export interface AuthUser {
  id: number
  uuid: string
  name: string
  email: string | null
  phone: string
  roles: string[]
  has_2fa: boolean
}

export interface AuthResult {
  token?: string
  user?: AuthUser
  requires_2fa?: boolean
  temp_token?: string
}

export interface PortalRequestSummary {
  id: number
  reference_number: string
  status: string
  event_title: string
  event_date: string
  event_type: string
  submitted_at: string
  items_count: number
}

export interface PortalRequestDetail extends PortalRequestSummary {
  event_description: string | null
  venue: string | null
  number_of_guests: number | null
  services: { name: string; status: string }[]
  documents: { id: number; type: string; name: string; uploaded_at: string }[]
  status_history: { from_status: string | null; to_status: string; created_at: string }[]
  messages: { id: number; message: string; sender: { id: number; name: string }; created_at: string }[]
  pdf_url: string | null
  tracking_url: string
}

export interface Service {
  id: number
  name: string
  slug: string
  short_description: string
  description: string
  base_price: number
  price_unit: string
  currency: string
  image_path: string | null
  is_featured: boolean
  category?: { name: string; slug: string }
}

export interface Faq {
  id: number
  question: string
  answer: string
  category: string | null
}

export interface GalleryItem {
  id: number
  title: string | null
  image_path: string
  category: string | null
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content?: string
  featured_image: string | null
  author_name: string
  published_at: string
}

export interface Testimonial {
  id: number
  client_name: string
  client_title: string | null
  content: string
  rating: number
}

export interface ServiceReview {
  id: number
  client_name: string
  rating: number
  comment: string | null
  created_at: string
}

export interface SubmitRequestResult {
  reference_number: string
  tracking_token: string
  tracking_url: string
  pdf_url: string | null
  status: string
}

export interface AdminDashboardData {
  stats: {
    total_requests: number
    pending_review: number
    in_progress: number
    completed: number
    total_clients: number
    active_services: number
  }
  status_counts: Record<string, number>
  monthly_trend: { month: string; count: number }[]
  popular_services: { service_name: string; count: number }[]
  recent_requests: AdminRequestSummary[]
}

export interface AdminRequestSummary {
  id: number
  reference_number: string
  status: string
  client_name: string
  client_phone?: string
  event_title: string
  event_date: string
  event_type: string
  submitted_at: string
  items_count: number
  assigned_to?: number | null
  quoted_amount?: number | null
  client_signed_at?: string | null
  sent_for_signature_at?: string | null
}

export interface AdminRequestDetail {
  id: number
  reference_number: string
  status: string
  client_name: string
  client_phone: string
  event_title: string
  event_date: string
  event_type: string
  submitted_at: string
  items_count: number
  client_email: string | null
  client_nationality: string | null
  client_country: string | null
  client_city: string | null
  event_description: string | null
  venue: string | null
  number_of_guests: number | null
  event_start_date: string | null
  event_end_date: string | null
  admin_notes: string | null
  client_notes: string | null
  assigned_to: { id: number; name: string; email?: string } | null
  services: { id: number; name: string; status: string; admin_comment: string | null; quoted_price?: number | null }[]
  documents: { id: number; type: string; name: string; uploaded_at: string }[]
  status_history: { from_status: string | null; to_status: string; created_at: string; note?: string }[]
  messages: { id: number; message: string; is_internal: boolean; sender: { id: number; name: string }; created_at: string }[]
  pdf_url: string | null
  tracking_url: string
  quoted_amount?: number | null
  quotation_notes?: string | null
  sent_for_signature_at?: string | null
  client_signed_at?: string | null
  assignments?: ServiceAssignment[]
}

export interface ServiceAssignment {
  id: number
  assigned_user_ids: number[]
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  notes: string | null
}

export interface BookingCalendarDay {
  date: string
  is_booked: boolean
  label?: string | null
  notes?: string | null
  service_request?: {
    id: number
    reference_number: string
    event_title: string
    client_name: string
  } | null
}

export interface StaffMember {
  id: number
  name: string
  email: string | null
}

export interface AdminUser {
  id: number
  name: string
  username: string | null
  email: string | null
  phone: string
  is_active: boolean
  roles: string[]
  role_labels?: string[]
  created_at?: string
}

export interface RoleOption {
  id: number
  name: string
  display_name: string
}

export interface RolePermission {
  id: number
  name: string
  module: string
  label: string
}

export interface RoleDetail {
  id: number
  name: string
  display_name: string
  description: string | null
  is_protected: boolean
  users_count: number
  permissions: RolePermission[]
}

export interface PermissionGroup {
  module: string
  label: string
  permissions: { id: number; name: string; label: string }[]
}

export interface StaffTask {
  id: number
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  completed_at: string | null
  assignment_notified_at?: string | null
  last_reminder_at?: string | null
  created_at: string | null
  assigned_to: { id: number; name: string; email?: string | null } | null
  created_by: { id: number; name: string } | null
  service_request: { id: number; reference_number: string; client_name: string; event_title: string } | null
}

export interface WhatsAppLogEntry {
  id: number
  phone: string
  message_type: string
  status: string
  created_at: string
}

export interface WhatsAppLogData {
  stats: { total: number; sent: number; failed: number; configured: boolean }
  logs: WhatsAppLogEntry[]
}

export interface Announcement {
  id: number
  reference: string
  title: string
  body: string
  header: string | null
  footer: string | null
  audience_type: string
  status: string
  whatsapp_status: string
  scheduled_at: string | null
  sent_at: string | null
  sent_count: number | null
  failed_count: number | null
  created_at: string
}

export interface AnnouncementSettings {
  id: number
  company_name: string
  default_header: string | null
  serial_prefix: string
  next_serial: number
  serial_padding: number
  timezone: string
}

export interface TrackRequestResult {
  reference_number: string
  status: string
  client_name: string
  event_title: string
  event_date: string
  event_type: string
  venue: string | null
  services: { name: string; status: string; quoted_price?: number | null }[]
  documents_count: number
  pdf_url: string | null
  submitted_at: string
  quoted_amount?: number | null
  quotation_notes?: string | null
  sent_for_signature_at?: string | null
  client_signed_at?: string | null
  can_accept_quotation?: boolean
}

function buildRequestFormData(data: RequestFormData): FormData {
  const form = new FormData()

  data.services.forEach((id) => form.append('services[]', String(id)))

  const fields: (keyof RequestFormData)[] = [
    'client_name', 'client_phone', 'client_email', 'client_nationality',
    'client_country', 'client_city', 'event_title', 'event_type',
    'event_start_date', 'event_end_date', 'event_start_time', 'event_end_time',
    'venue', 'event_description',
  ]

  for (const key of fields) {
    const val = data[key]
    if (val !== undefined && val !== '' && val !== null && typeof val !== 'object') {
      form.append(key, String(val))
    }
  }

  if (data.event_start_date) {
    form.append('event_date', data.event_start_date)
  }

  if (data.signature) {
    form.append('signature', data.signature)
  }

  if (data.number_of_guests) {
    form.append('number_of_guests', String(data.number_of_guests))
  }

  return form
}

export const api = {
  getServices: () => fetchApi<Service[]>('/services?per_page=50'),
  getService: (slug: string) => fetchApi<Service>(`/services/${slug}`),
  getFaqs: () => fetchApi<Faq[]>('/faqs'),
  getGallery: () => fetchApi<GalleryItem[]>('/gallery'),
  getBlogPosts: () => fetchApi<BlogPost[]>('/blog?per_page=20'),
  getBlogPost: (slug: string) => fetchApi<BlogPost>(`/blog/${slug}`),
  getTestimonials: () => fetchApi<Testimonial[]>('/testimonials'),
  getReviews: () => fetchApi<ServiceReview[]>('/reviews'),
  submitContact: (data: { name: string; email?: string; phone: string; subject: string; message: string }) =>
    postApi('/contact', data),

  submitRequest: async (data: RequestFormData, token?: string): Promise<ApiResponse<SubmitRequestResult>> => {
    try {
      const form = buildRequestFormData(data)
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000)

      const res = await fetch(`${API_BASE}/requests/submit`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const text = await res.text()
      let json: ApiResponse<SubmitRequestResult>
      try {
        json = text ? JSON.parse(text) : { success: false, message: 'Empty server response' }
      } catch {
        return {
          success: false,
          message: res.ok
            ? 'Unexpected server response. Please try again.'
            : `Server error (${res.status}). Please try again in a moment.`,
        }
      }

      if (!res.ok) {
        return {
          success: false,
          message: json.message || 'Submission failed',
          errors: json.errors,
        }
      }
      return json
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          message: 'Request timed out. If you received a WhatsApp confirmation, your request was submitted.',
        }
      }
      return { success: false, message: 'Network error. Please check your connection and try again.' }
    }
  },

  trackRequest: (token: string) => fetchApi<TrackRequestResult>(`/track/${token}`),

  acceptQuotation: (token: string, signature: string) =>
    postApi<{ status: string; client_signed_at: string; pdf_url: string | null }>(`/track/${token}/accept`, { signature }),

  getPdfDownloadUrl: (token: string) => `${API_BASE}/track/${token}/pdf`,

  // Auth
  register: (data: { name: string; phone: string; password: string; password_confirmation: string; email?: string }) =>
    postApi<AuthResult>('/auth/register', data),

  login: (data: { username?: string; phone?: string; email?: string; password: string }) =>
    postApi<AuthResult>('/auth/login', data),

  requestOtp: (phone: string, context: 'login' | 'register' = 'login') =>
    postApi<{ message: string }>('/auth/otp/request', { phone, context }),

  verifyOtp: (data: { phone: string; otp: string; context?: string; name?: string }) =>
    postApi<AuthResult>('/auth/otp/verify', data),

  verify2fa: (temp_token: string, code: string) =>
    postApi<AuthResult>('/auth/2fa/verify', { temp_token, code }),

  getMe: (token: string) => authFetch<AuthUser>('/auth/me', token),

  logout: (token: string) => postApi('/auth/logout', {}, token),

  submitReview: (token: string, data: { service_request_id: number; rating: number; comment?: string }) =>
    postApi('/reviews', data, token),

  // Client portal
  getPortalRequests: (token: string) => authFetch<PortalRequestSummary[]>('/portal/requests', token),

  getPortalRequest: (token: string, id: number) => authFetch<PortalRequestDetail>(`/portal/requests/${id}`, token),

  sendPortalMessage: (token: string, id: number, message: string) =>
    postApi(`/portal/requests/${id}/messages`, { message }, token),

  uploadPortalDocument: async (token: string, id: number, file: File, documentType?: string) => {
    const form = new FormData()
    form.append('document', file)
    if (documentType) form.append('document_type', documentType)
    const res = await fetch(`${API_BASE}/portal/requests/${id}/documents`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      body: form,
    })
    return res.json()
  },

  downloadPortalPdf: async (token: string, id: number, filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/portal/requests/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch {
      return false
    }
  },

  initiatePayment: (token: string, id: number) =>
    postApi(`/portal/requests/${id}/payments/initiate`, {}, token),

  // Admin
  getAdminDashboard: (token: string) => authFetch<AdminDashboardData>('/admin/dashboard', token),

  getAdminRequests: (token: string, params?: { tab?: string; status?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.tab) qs.set('tab', params.tab)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    const query = qs.toString() ? `?${qs}` : ''
    return authFetch<AdminRequestSummary[]>(`/admin/requests${query}`, token)
  },

  createAdminRequest: (token: string, data: {
    services: number[]
    client_name: string
    client_phone: string
    client_email?: string
    event_title: string
    event_type: string
    event_date: string
    venue?: string
    event_description?: string
  }) => postAuthApi<AdminRequestSummary>('/admin/requests', data, token),

  acceptAllAdminServices: (token: string, id: number) =>
    postApi(`/admin/requests/${id}/accept-all`, {}, token),

  assignAdminSchedule: (token: string, id: number, data: {
    assigned_user_ids: number[]
    start_date: string
    end_date?: string
    start_time?: string
    end_time?: string
    notes?: string
  }) => postApi(`/admin/requests/${id}/assign-schedule`, data, token),

  getBookingCalendar: (token: string, year: number, month: number) =>
    authFetch<{ year: number; month: number; booked_dates: BookingCalendarDay[] }>(
      `/admin/bookings/calendar?year=${year}&month=${month}`, token
    ),

  toggleBookingDate: (token: string, data: {
    date: string
    is_booked: boolean
    service_request_id?: number
    label?: string
    notes?: string
  }) => postApi('/admin/bookings/calendar/toggle', data, token),

  getAdminRequest: (token: string, id: number) =>
    authFetch<AdminRequestDetail>(`/admin/requests/${id}`, token),

  updateAdminRequestStatus: (token: string, id: number, status: string, note?: string) =>
    patchApi(`/admin/requests/${id}/status`, { status, note }, token),

  updateAdminRequestItem: (token: string, id: number, itemId: number, data: { status: string; admin_comment?: string; quoted_price?: number }) =>
    patchApi(`/admin/requests/${id}/items/${itemId}`, data, token),

  updateAdminNotes: (token: string, id: number, admin_notes: string) =>
    patchApi(`/admin/requests/${id}/notes`, { admin_notes }, token),

  assignAdminRequest: (token: string, id: number, assigned_to: number | null) =>
    patchApi(`/admin/requests/${id}/assign`, { assigned_to }, token),

  addAdminMessage: (token: string, id: number, message: string, is_internal = true) =>
    postApi(`/admin/requests/${id}/messages`, { message, is_internal }, token),

  setAdminQuotation: (token: string, id: number, data: {
    quoted_amount?: number
    quotation_notes?: string
    send_to_client?: boolean
    send_for_signature?: boolean
    items?: { id: number; quoted_price?: number }[]
  }) => postApi(`/admin/requests/${id}/quotation`, data, token),

  updateReviewsEnabled: (token: string, enabled: boolean) =>
    patchApi('/admin/settings/reviews', { enabled }, token),

  getAdminStaff: (token: string) => authFetch<StaffMember[]>('/admin/staff', token),

  getAdminUsers: (token: string) => authFetch<AdminUser[]>('/admin/users', token),

  getStaffRoleOptions: (token: string) => authFetch<RoleOption[]>('/admin/users/roles', token),

  getAdminRoles: (token: string) => authFetch<RoleDetail[]>('/admin/roles', token),

  getPermissionGroups: (token: string) => authFetch<PermissionGroup[]>('/admin/roles/permissions', token),

  createAdminRole: (token: string, data: {
    display_name: string
    name?: string
    description?: string
    permission_ids?: number[]
  }) => postAuthApi<RoleDetail>('/admin/roles', data, token),

  updateAdminRole: (token: string, id: number, data: {
    display_name?: string
    description?: string
    permission_ids?: number[]
  }) => patchApi(`/admin/roles/${id}`, data, token),

  deleteAdminRole: (token: string, id: number) => deleteApi(`/admin/roles/${id}`, token),

  createAdminUser: (token: string, data: {
    name: string; phone: string; password: string; email?: string; username?: string; roles: string[]
  }) => postAuthApi<AdminUser>('/admin/users', data, token),

  updateAdminUser: (token: string, id: number, data: Partial<{
    name: string; phone: string; password: string; email: string; username: string; roles: string[]; is_active: boolean
  }>) => patchApi(`/admin/users/${id}`, data, token),

  deleteAdminUser: (token: string, id: number) => deleteApi(`/admin/users/${id}`, token),

  getAdminTasks: (token: string, status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return authFetch<StaffTask[]>(`/admin/tasks${qs}`, token)
  },

  createAdminTask: (token: string, data: {
    title: string; description?: string; assigned_to?: number; service_request_id?: number
    priority?: string; due_date?: string
  }) => postAuthApi<StaffTask>('/admin/tasks', data, token),

  updateAdminTask: (token: string, id: number, data: Partial<{
    title: string; description: string; assigned_to: number | null; status: string; priority: string; due_date: string
  }>) => patchApi(`/admin/tasks/${id}`, data, token),

  deleteAdminTask: (token: string, id: number) => deleteApi(`/admin/tasks/${id}`, token),

  getWhatsAppLogs: (token: string) => authFetch<WhatsAppLogData>('/admin/whatsapp/logs', token),

  testWhatsApp: (token: string, phone?: string) =>
    postAuthApi<{ success: boolean; message?: string }>('/whatsapp/test', phone ? { phone } : {}, token),

  getAnnouncements: (token: string, status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return authFetch<Announcement[]>(`/admin/announcements${qs}`, token)
  },

  createAnnouncement: async (token: string, data: {
    title: string; body: string; header?: string; footer?: string
    audience_type: string; recipients?: { name?: string; phone: string; email?: string }[]
    send_now?: boolean; scheduled_at?: string; attachments?: File[]
  }): Promise<ApiResponse<Announcement>> => {
    try {
      const form = new FormData()
      form.append('title', data.title)
      form.append('body', data.body)
      form.append('audience_type', data.audience_type)
      if (data.header) form.append('header', data.header)
      if (data.footer) form.append('footer', data.footer)
      if (data.send_now) form.append('send_now', '1')
      if (data.scheduled_at) form.append('scheduled_at', data.scheduled_at)
      if (data.recipients) form.append('recipients', JSON.stringify(data.recipients))
      data.attachments?.forEach((f) => form.append('attachments[]', f))

      const res = await fetch(`${API_BASE}/admin/announcements`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: form,
      })
      return await res.json()
    } catch {
      return { success: false, message: 'Network error.' }
    }
  },

  sendAnnouncementNow: (token: string, id: number) =>
    postAuthApi<Announcement>(`/admin/announcements/${id}/send`, {}, token),

  getAnnouncementSettings: (token: string) =>
    authFetch<AnnouncementSettings>('/admin/announcements/settings', token),

  updateAnnouncementSettings: (token: string, data: Partial<AnnouncementSettings>) =>
    patchApi('/admin/announcements/settings', data, token),

  downloadAdminPdf: async (token: string, id: number, filename: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      return true
    } catch {
      return false
    }
  },
}
