import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AdminAnnouncements } from '@/pages/admin/AdminAnnouncements'
import { AdminBookingCalendar } from '@/pages/admin/AdminBookingCalendar'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminRoles } from '@/pages/admin/AdminRoles'
import { AdminRequestDetail } from '@/pages/admin/AdminRequestDetail'
import { AdminRequests } from '@/pages/admin/AdminRequests'
import { AdminTasks } from '@/pages/admin/AdminTasks'
import { AdminUsers } from '@/pages/admin/AdminUsers'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { PortalDashboard } from '@/pages/portal/PortalDashboard'
import { PortalRequestDetail } from '@/pages/portal/PortalRequestDetail'
import { AboutPage } from '@/pages/AboutPage'
import { BlogDetailPage } from '@/pages/BlogDetailPage'
import { BlogPage } from '@/pages/BlogPage'
import { ContactPage } from '@/pages/ContactPage'
import { FaqPage } from '@/pages/FaqPage'
import { GalleryPage } from '@/pages/GalleryPage'
import { HomePage } from '@/pages/HomePage'
import { RequestServicePage } from '@/pages/RequestServicePage'
import { RequestSuccessPage } from '@/pages/RequestSuccessPage'
import { ServicesPage } from '@/pages/ServicesPage'
import { TrackRequestPage } from '@/pages/TrackRequestPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/request" element={<RequestServicePage />} />
          <Route path="/request/success" element={<RequestSuccessPage />} />
          <Route path="/track/:token" element={<TrackRequestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/portal" element={<PortalDashboard />} />
          <Route path="/portal/requests/:id" element={<PortalRequestDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="requests/:id" element={<AdminRequestDetail />} />
                <Route path="bookings" element={<AdminBookingCalendar />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="roles" element={<AdminRoles />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
              </Route>
            </Route>
            <Route path="/*" element={<PublicSite />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
