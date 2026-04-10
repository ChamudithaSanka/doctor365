# Doctor365 Frontend - Phase 1 MVP Pages

## Goal
Deliver a usable end-to-end frontend for patients and doctors using already implemented basic backend services.

## 1. Public and Auth Pages

### 1. Home
- Route: `/`
- Purpose: Product intro, CTA to login/register, doctor search entry point

### 2. Login
- Route: `/login`
- Purpose: Authenticate patient/doctor/admin and store JWT

### 3. Register
- Route: `/register`
- Purpose: New account creation (patient/doctor)

## 2. Patient MVP Pages

### 4. Patient Dashboard
- Route: `/patient/dashboard`
- Purpose: Quick overview (upcoming appointments, notifications summary)

### 5. Doctor Search/List
- Route: `/doctors`
- Purpose: Browse/filter doctors by specialization/search term

### 6. Doctor Details
- Route: `/doctors/:id`
- Purpose: View doctor profile and start booking flow

### 7. Book Appointment
- Route: `/appointments/book`
- Purpose: Create appointment (doctor, date, time, reason)

### 8. My Appointments
- Route: `/appointments`
- Purpose: View upcoming/history and cancel/update where allowed

### 9. Payment Checkout/Status
- Route: `/payments/:appointmentId`
- Purpose: Trigger payment and show transaction status

### 10. Notifications
- Route: `/notifications`
- Purpose: View user notifications and mark as read

## 3. Doctor MVP Pages

### 11. Doctor Dashboard
- Route: `/doctor/dashboard`
- Purpose: Daily overview (pending requests, confirmed appointments)

### 12. Doctor Appointments
- Route: `/doctor/appointments`
- Purpose: Accept/reject/update status for assigned appointments

### 13. Consultation Session
- Route: `/consultation/:appointmentId`
- Purpose: Start/end telemedicine session (basic status controls)

## 4. Shared Utility Pages

### 14. Profile (Role-Aware)
- Route: `/profile`
- Purpose: View/update profile data for current role

### 15. Unauthorized
- Route: `/403`
- Purpose: Access denied page for role-protected routes

### 16. Not Found
- Route: `*`
- Purpose: Fallback for unknown routes

## Suggested Build Order (Fast Delivery)
1. Authentication pages and protected routing
2. Patient flow: doctors -> booking -> appointments -> payment
3. Doctor flow: appointment management -> consultation page
4. Notifications + profile page
5. 403/404 pages and basic UI polish

## Out of Scope for Phase 1
- Full admin panel
- Advanced analytics and reporting
- Complex telemedicine integrations UI
- Deep document/report management UX

## Done Criteria for Phase 1 Frontend
- User can register/login
- Patient can find a doctor, book appointment, view appointments, and pay
- Doctor can view and manage assigned appointments
- Notifications page is functional with backend data
- Role-based route protection is working
- 403 and 404 pages are present
