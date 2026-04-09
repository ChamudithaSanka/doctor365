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
- `/appointments/book` - Booking form page
- `/appointments` - My appointments
- `/appointments/:id` - Appointment detail
- `/payments/:appointmentId` - Checkout / payment page (PayHere)
- `/notifications` - Notifications
- `/profile` - Profile
- `/reports` - Medical reports
- `/medical-history` - Medical history
- `/prescriptions` - Prescriptions
- `/telemedicine/:appointmentId` - Telemedicine session

## 2.3 Doctor Pages
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/appointments` - View appointments
- `/doctor/profile` - Combined doctor profile and availability manager
- `/doctor/reports` - Patient reports review
- `/doctor/prescriptions/new` - Prescription issuing page
- `/consultation/:appointmentId` - Telemedicine session page
- `/notifications` - Notifications

## 2.4 Admin Pages
- `/admin/dashboard` - Admin dashboard
- `/admin/doctors` - Create doctor accounts and profiles
- `/admin/users` - User management
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
Purpose: Create a new appointment and move to payment.
- Doctor selection
- Date and time selection from available slots
- Reason input
- Show doctor details and editable booking summary
- Proceed to checkout / payment after booking

### 3.4 My Appointments
Purpose: View current and past appointments.
- Upcoming appointments
- Past appointments
- Cancel / reschedule actions where allowed
- Shows booked, paid, completed, and cancelled states

### 3.5 Payment Status
Purpose: Show payment state for an appointment.
- Pending / success / failed states
- Reference and amount
- Retry payment action if needed
- Checkout via PayHere before the appointment becomes upcoming

### 3.6 Notifications
Purpose: Show patient alerts.
- Booking confirmations
- Reminders
- Payment updates
- Read / unread state

### 3.7 Profile
Purpose: View and edit patient profile.

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
- Status

### 3.12 Telemedicine Session
Purpose: Join the consultation session.
- Join session button
- Session status
- Start/end state visibility

## 4. Doctor Page Requirements

### 4.1 Dashboard
Purpose: Overview of workload.
- Today appointments
- Active consultations
- Quick stats
- View-only schedule overview

### 4.2 Appointments
Purpose: View patient bookings.
- View appointment details
- Review schedule and status
- No accept / reject workflow

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
two sections:
- Personal Info: view/edit basic profile data
- Availability / Consultation Settings: edit fee and other info

### 4.6 Patient Reports Review
Purpose: Review uploaded patient reports.
- List reports by patient
- Open, download

### 4.7 Prescription Issuing Page
Purpose: Create digital prescription.
- Patient info
- Medication form
- Dosage and instructions
- Save or issue prescription

## 5. Admin Page Requirements

### 5.1 Admin Dashboard
Purpose: Platform overview.
- stat cards
- User counts
- Appointment counts

### 5.2 User Management
Purpose: Manage all users.
- Patients
- Doctors
- Admins

### 5.3 Doctor Creation
Purpose: Admin creates doctor accounts and links profiles.
- Create auth user first
- Create doctor profile with userId
- Set verified status on create

### 5.4 Notifications Center
Purpose: Show all notifications.

### 5.5 Payments Page
Purpose: Show all payments.

### 5.6 Appointments Page
Purpose: Show all payments.

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
### Phase 
- Home (done)
- Login (done)
- Register (done)
- Patient dashboard
- Doctor list/details
- Booking form
- Checkout / payment
- My appointments
- Payment status
- Notifications
- Doctor dashboard
- Appointment viewing
- Consultation session
- Profile
- 403 / 404 (done)

### Phase 2
- Medical reports
- Medical history
- Prescriptions
- Combined doctor profile and availability manager
- Patient reports review
- Prescription issuing

### Phase 3
- Admin dashboard
- User management
- Doctor creation
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
- API integration is wired for auth, appointments, notifications, payments, and admin doctor creation
