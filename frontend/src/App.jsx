import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AppShell from './layouts/AppShell'
import PatientDashboard from './pages/patient/PatientDashboard'
import Doctors from './pages/patient/Doctors'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
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
          <Route path="/doctors" element={<Doctors />} />
          <Route
            path="/doctors/:id"
            element={<ComingSoon title="Doctor Details" description="Doctor profile details and booking context will be available here." />}
          />
          <Route
            path="/appointments/book"
            element={<ComingSoon title="Book Appointment" description="Booking flow will be available here." />}
          />
          <Route
            path="/appointments"
            element={<ComingSoon title="Appointments" description="View your upcoming and past appointments." />}
          />
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
          <Route
            path="/doctor/appointments"
            element={<ComingSoon title="Doctor Appointments" description="Review and respond to appointment requests." />}
          />
          <Route
            path="/consultation"
            element={<ComingSoon title="Consultations" description="Start or manage telemedicine sessions here." />}
          />
          <Route path="/admin/dashboard" element={<Navigate to="/403" replace />} />
        </Route>
        <Route path="/403" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App