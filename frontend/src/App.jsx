import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import PaymentFailed from './pages/PaymentFailed'
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

// Doctor pages
import DoctorReports from './pages/doctor/DoctorReports'
import DoctorProfile from './pages/doctor/DoctorProfile'

// Patient pages
import Profile from './pages/patient/Profile'
import MedicalHistory from './pages/patient/MedicalHistory'
import Reports from './pages/patient/Reports'
import Notifications from './pages/patient/Notifications'
import Payments from './pages/patient/Payments'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route element={<AppShell />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/pending-verification" element={<VerificationPending />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/appointments/book" element={<BookAppointment />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/patient/profile" element={<Profile />} />
          <Route path="/patient/reports" element={<Reports />} />
          <Route path="/patient/medical-history" element={<MedicalHistory />} />
          <Route
            path="/payments"
            element={<ComingSoon title="Payments" description="Track payment status and history here." />}
          />
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/profile"
            element={<ComingSoon title="Profile" description="Update your personal and account information." />}
          />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/reports" element={<DoctorReports />} />
          <Route path="/doctor/profile" element={<DoctorProfile />} />
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