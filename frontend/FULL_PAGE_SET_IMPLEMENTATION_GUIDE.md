# Doctor365 Frontend - Full Page Set Implementation Guide

## Goal
Build the complete Doctor365 frontend in a structured way using a responsive public site and a role-based authenticated app shell.

## 1. Layout Strategy

### 1.1 Public Layout
Use for landing, login, and register.
- Top header
- Centered content areas
- Optional footer
- No sidebar

### 1.2 Authenticated App Shell
Use for patient, doctor, and admin areas.
- Desktop: persistent left sidebar
- Mobile: hamburger menu and slide-in drawer
- Top header: logo, notifications shortcut, user info
- Main content area rendered through route outlet

## 2. Route Groups

## 2.1 Public Pages
- `/` - Home / landing page
- `/login` - Login page
- `/register` - Register page
- `/403` - Access denied page
- `*` - Not found page

## 2.2 Patient Pages
- `/patient/dashboard` - Patient dashboard
- `/doctors` - Doctor list and search
- `/doctors/:id` - Doctor details
- `/appointments/book` - Book appointment
- `/appointments` - My appointments
- `/appointments/:id` - Appointment detail
- `/payments/:appointmentId` - Payment status
- `/notifications` - Notifications
- `/profile` - Profile
- `/reports` - Medical reports
- `/medical-history` - Medical history
- `/prescriptions` - Prescriptions
- `/telemedicine/:appointmentId` - Telemedicine session

## 2.3 Doctor Pages
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/appointments` - Appointment management
- `/doctor/profile` - Doctor profile and availability manager
- `/doctor/reports` - Patient reports review
- `/doctor/prescriptions/new` - Prescription issuing page
- `/consultation/:appointmentId` - Telemedicine session page
- `/notifications` - Notifications
- `/profile` - Profile

## 2.4 Admin Pages
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/doctor-verification` - Doctor verification
- `/admin/transactions` - Transactions and payments monitoring
- `/admin/notifications` - Notifications center
- `/admin/payment-results` - Payment result page
- `/admin/appointments` - Appointment status tracking

## 3. Patient Page Requirements

### 3.1 Doctors
Purpose: Search and browse available doctors.
- Filters by specialty, name, fee, availability
- List cards with quick actions

### 3.2 Doctor Details
Purpose: Show a single doctor profile.
- Profile summary
- Specialty, fee, availability
- Book appointment CTA

### 3.3 Book Appointment
Purpose: Create a new appointment.
- Doctor selection
- Date and time selection
- Reason input
- Submit booking

### 3.4 My Appointments
Purpose: View current and past appointments.
- Upcoming appointments
- Past appointments
- Cancel / reschedule actions where allowed

### 3.5 Payment Status
Purpose: Show payment state for an appointment.
- Pending / success / failed states
- Reference and amount
- Retry payment action if needed

### 3.6 Notifications
Purpose: Show patient alerts.
- Booking confirmations
- Reminders
- Payment updates
- Read / unread state

### 3.7 Profile
Purpose: View and edit patient profile.
- Basic personal details
- Contact details
- Emergency contact

### 3.8 Medical Reports
Purpose: Manage uploaded reports.
- Upload report files
- View uploaded reports
- Delete reports

### 3.9 Medical History
Purpose: Show past medical history.
- Conditions
- Treatments
- Dates and notes

### 3.10 Prescriptions
Purpose: Show current and past prescriptions.
- List prescriptions
- Download or view details

### 3.11 Appointment Detail
Purpose: Full appointment timeline page.
- Booking details
- Payment details
- Consultation access
- Status timeline

### 3.12 Telemedicine Session
Purpose: Join the consultation session.
- Join session button
- Session status
- Start/end state visibility

## 4. Doctor Page Requirements

### 4.1 Dashboard
Purpose: Overview of workload.
- Today appointments
- Pending requests
- Active consultations
- Quick stats

### 4.2 Appointments
Purpose: Manage patient bookings.
- Accept / reject / update status
- View appointment details

### 4.3 Consultation Session
Purpose: Run telemedicine session.
- Start session
- Join session
- End session
- Status updates

### 4.4 Notifications
Purpose: Read system and patient updates.
- New booking alerts
- Consultation reminders
- Status updates

### 4.5 Profile
Purpose: View doctor profile.
- Basic profile data
- Specialization
- Consultation fee

### 4.6 Doctor Profile and Availability Manager
Purpose: Manage doctor schedule.
- Edit availability slots
- Set schedule by day/time
- Update consultation fee and clinic details

### 4.7 Patient Reports Review
Purpose: Review uploaded patient reports.
- List reports by patient
- Open, download, or inspect report files

### 4.8 Prescription Issuing Page
Purpose: Create digital prescription.
- Patient info
- Medication form
- Dosage and instructions
- Save or issue prescription

## 5. Admin Page Requirements

### 5.1 Admin Dashboard
Purpose: Platform overview.
- KPIs
- User counts
- Appointment counts
- Revenue / payment summaries

### 5.2 User Management
Purpose: Manage all users.
- Patients
- Doctors
- Admins
- Search and status controls

### 5.3 Doctor Verification
Purpose: Approve or reject doctor accounts.
- Verification status
- License review actions

### 5.4 Transactions and Payments Monitoring
Purpose: Track payment activity.
- Transaction list
- Success / failed / pending breakdown

### 5.5 Notifications Center
Purpose: Monitor platform notifications.
- Delivery status
- Read status
- Notification history

### 5.6 Payment Result Page
Purpose: Show payment outcome.
- Success
- Failed
- Pending
- Retry or return actions

### 5.7 Appointment Status Tracking
Purpose: Track all appointment states.
- Pending
- Accepted
- Completed
- Cancelled

## 6. Shared Components
- Responsive header
- Responsive sidebar
- Mobile drawer
- Breadcrumbs
- Stat cards
- Tables and lists
- Status badges
- Empty states
- Loading states
- Error states
- Modal / dialog components
- Confirmation dialog

## 7. Build Order
1. Public pages (done)
2. Auth pages (done)
3. Authenticated shell (done)
4. Patient dashboard and patient flows
5. Doctor dashboard and doctor flows
6. Admin dashboard and admin flows
7. Shared UI polish and responsive behavior

## 8. Recommended MVP Priority
### Phase 1
- Home
- Login
- Register
- Patient dashboard
- Doctor list/details
- Book appointment
- My appointments
- Payment status
- Notifications
- Doctor dashboard
- Appointment management
- Consultation session
- Profile
- 403 / 404

### Phase 2
- Medical reports
- Medical history
- Prescriptions
- Doctor profile and availability manager
- Patient reports review
- Prescription issuing

### Phase 3
- Admin dashboard
- User management
- Doctor verification
- Transactions monitoring
- Notifications center
- Payment result page
- Appointment status tracking

## 9. Done Criteria
The frontend is considered complete when:
- Mobile and desktop layouts work correctly
- Role-based routing is enforced
- Each role lands in the correct shell and page set
- All main flows can be reached through navigation
- Placeholder pages are replaced with functional UI
- API integration is wired for auth, appointments, notifications, and payments
