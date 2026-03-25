# Doctor365 Service Implementation Guide

This guide aligns all team members on what to implement in each microservice and how to implement it consistently.

## 1. Shared Standards (Applies to Every Service)

### 1.1 API Response Format
Use this response shape in all services.

Success response:
{
  "success": true,
  "data": {},
  "message": "Descriptive success message"
}

Error response:
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}

### 1.2 Required Middleware
- JSON parser enabled
- CORS enabled
- Auth verification middleware for protected routes
- Centralized error handling

### 1.3 Health Endpoint
Each service must expose:
- GET /health

Expected response:
{
  "status": "ok",
  "service": "service-name"
}

### 1.4 Auth Contract
JWT payload is expected to include:
- userId
- email
- role

Protected endpoints must read user info from req.user.

## 2. Service-by-Service Implementation

## 2.1 Patient Service
Purpose: patient profile and patient-specific data.

Implement:
- GET /patients/me (protected, patient/admin)
- PUT /patients/me (protected, patient/admin)
- GET /patients/:id (protected, admin/doctor)

Model fields (minimum):
- userId (required, unique)
- firstName
- lastName
- dateOfBirth
- gender
- phone
- address
- emergencyContact
- medicalHistorySummary

Rules:
- Patients can update only their own profile
- Admin can read any patient
- Doctor can read patient only if appointment relationship exists (phase 2)

## 2.2 Doctor Service
Purpose: doctor profile, specialization, schedule.

Implement:
- GET /doctors
- GET /doctors/:id
- POST /doctors/me (protected, doctor)
- PUT /doctors/me (protected, doctor)
- GET /doctors/me (protected, doctor)

Model fields (minimum):
- userId (required, unique)
- firstName
- lastName
- specialization
- licenseNumber
- yearsOfExperience
- consultationFee
- availability (time slots)
- hospitalOrClinic

Rules:
- Public endpoints for doctor discovery
- Doctor can manage only own profile

## 2.3 Appointment Service
Purpose: create and manage appointments.

Implement:
- POST /appointments (protected, patient)
- GET /appointments/me (protected, patient/doctor)
- PATCH /appointments/:id/status (protected, doctor)
- GET /appointments/:id (protected, patient/doctor/admin)

Model fields (minimum):
- patientId
- doctorId
- appointmentDate
- appointmentTime
- reason
- status (pending, confirmed, cancelled, completed)
- notes

Rules:
- Patient creates appointment in pending state
- Doctor confirms or rejects
- Only owner patient or assigned doctor can access appointment

## 2.4 Telemedicine Service
Purpose: online consultation session lifecycle.

Implement:
- POST /telemedicine/sessions (protected, doctor)
- GET /telemedicine/sessions/:appointmentId (protected, patient/doctor)
- PATCH /telemedicine/sessions/:id/start (protected, doctor)
- PATCH /telemedicine/sessions/:id/end (protected, doctor)

Model fields (minimum):
- appointmentId
- doctorId
- patientId
- meetingProvider
- meetingLink
- status (scheduled, active, ended)
- startedAt
- endedAt

Rules:
- Session must be tied to an appointment
- Only assigned patient and doctor can access session data

## 2.5 Payment Service
Purpose: handle payment records for appointments.

Implement:
- POST /payments (protected, patient)
- GET /payments/me (protected, patient)
- GET /payments/:id (protected, patient/admin)
- PATCH /payments/:id/status (protected, admin/system)

Model fields (minimum):
- appointmentId
- patientId
- amount
- currency
- paymentMethod
- transactionId
- status (pending, paid, failed, refunded)
- paidAt

Rules:
- Payment must reference valid appointment
- Only patient owner and admin can view payment details

## 2.6 Notification Service
Purpose: notification creation and delivery status.

Implement:
- POST /notifications (internal service route)
- GET /notifications/me (protected)
- PATCH /notifications/:id/read (protected)

Model fields (minimum):
- userId
- type (email, sms, in-app)
- title
- message
- status (queued, sent, failed, read)
- metadata
- sentAt
- readAt

Rules:
- Only owner can view or mark own notifications as read
- Internal create route should be restricted to gateway/internal token

## 3. Role Authorization Matrix

- patient:
  - Own profile
  - Create/view own appointments
  - View own payments
  - View own notifications

- doctor:
  - Own profile
  - View assigned appointments
  - Update appointment status
  - Manage telemedicine sessions for assigned appointments

- admin:
  - Read across services
  - Moderate or update statuses where needed

## 4. Implementation Pattern (Recommended Folder Structure)

For each service:
- src/models
- src/controllers
- src/routes
- src/middleware
- src/config
- src/server.js

Flow:
1. Define Mongoose model
2. Build controller with validation and business rules
3. Wire routes with verifyToken and role checks
4. Add health route
5. Add error handling
6. Test with Postman

## 5. Minimum Postman Test Set Per Service

Each team member should provide:
- 1 health check request
- 1 create request
- 1 read request
- 1 update request
- 2 negative tests (unauthorized and validation failure)

## 6. Integration Requirements for Gateway

Each service must be reachable via gateway routes:
- /api/auth
- /api/patients
- /api/doctors
- /api/appointments
- /api/telemedicine
- /api/payments
- /api/notifications

Gateway must forward Authorization header to downstream services.

## 7. Done Definition (Per Service)

A service is done only if all are true:
- Service starts and connects to MongoDB
- /health returns success
- CRUD endpoints implemented as agreed
- Protected routes require valid JWT
- Role checks enforced
- Standard success/error response format used
- Postman collection exported and shared
- Basic README section added by owner (routes + sample payloads)

## 8. Team Execution Plan

1. Finalize route contracts in a short sync
2. Implement service endpoints in parallel
3. Merge to feature branches per service
4. Run integration tests through gateway
5. Fix contract mismatches
6. Prepare demo flow: register, login, book appointment, confirm, notify

## 9. Priority Order for Delivery

1. Auth service (done)
2. Patient and Doctor services
3. Appointment service
4. Notification service
5. Payment and Telemedicine services

This order reduces blockers and enables early end-to-end demo coverage.
