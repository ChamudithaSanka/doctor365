import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import AppShell from './layouts/AppShell'
import AdminDoctors from './pages/admin/AdminDoctors'
import ComingSoon from './pages/shared/ComingSoon'
import AccessDenied from './pages/shared/AccessDenied'
import NotFound from './pages/shared/NotFound'

//DOCTOR PAGES
import DoctorReports from './pages/doctor/DoctorReports'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorDashboard from './pages/doctor/DoctorDashboard'

//PATIENT PAGES
import Profile  from './pages/patient/Profile'
import MedicalHistory from './pages/patient/MedicalHistory'
import Reports from './pages/patient/Reports'
import PatientDashboard from './pages/patient/PatientDashboard'
import Doctors from './pages/patient/Doctors'
import DoctorDetails from './pages/patient/DoctorDetails'



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
          <Route path="/doctors/:id" element={<DoctorDetails />} />
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
          <Route path="/admin/dashboard" element={<Navigate to="/admin/doctors" replace />} />
          <Route path="/admin/doctors" element={<AdminDoctors />} />
        </Route>
        <Route path="/403" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />


        {/* Doctor-specific routes */}
        <Route path="/doctor/reports" element={<DoctorReports />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />

        {/* Patient-specific routes */}
        <Route path="/patient/profile" element={<Profile />} />
        <Route path="/patient/reports" element={<Reports />} />
        <Route path="/patient/medical-history" element={<MedicalHistory />} />

        
      </Routes>
    </BrowserRouter>
  )
}

export default App