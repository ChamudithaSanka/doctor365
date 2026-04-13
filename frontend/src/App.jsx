import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AppShell from './layouts/AppShell'
import PatientDashboard from './pages/patient/PatientDashboard'
import Doctors from './pages/patient/Doctors'
import DoctorDetails from './pages/patient/DoctorDetails'
import BookAppointment from './pages/patient/BookAppointment'
import AppointmentList from './pages/patient/AppointmentList'
import AppointmentDetail from './pages/patient/AppointmentDetail'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import VerificationPending from './pages/doctor/VerificationPending'
import AdminDoctorVerification from './pages/admin/AdminDoctorVerification'
import AdminAppointments from './pages/admin/AdminAppointments'
import ComingSoon from './pages/shared/ComingSoon'
import AccessDenied from './pages/shared/AccessDenied'
import NotFound from './pages/shared/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<AppShell />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/pending-verification" element={<VerificationPending />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/appointments" element={<AppointmentList />} />
          <Route
            path="/payments"
            element={<ComingSoon title="Payments" description="Track payment status and history here." />}
          />
          <Route
            path="/notifications"
            element={<ComingSoon title="Notifications" description="Read your latest alerts and reminders." />}
          />
          <Route
            path="/profile"
            element={<ComingSoon title="Profile" description="Update your personal and account information." />}
          />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route
            path="/consultation"
            element={<ComingSoon title="Consultations" description="Start or manage telemedicine sessions here." />}
          />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/doctor-verification" replace />} />
          <Route path="/admin/doctor-verification" element={<AdminDoctorVerification />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
        </Route>
        <Route path="/403" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App