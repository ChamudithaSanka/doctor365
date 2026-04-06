# Appointment Service

The appointment service handles booking, managing, and tracking appointments between patients and doctors.

## Features
- Create appointments (patients)
- View personal appointments (patients/doctors)
- Update appointment status (doctors/admins)
- Cancel or modify pending appointments
- Role-based access control

## API Routes

### Public Routes
- `GET /api/appointments/health` - Service health check

### Protected Routes (require JWT token)

#### Create Appointment
- **POST** `/api/appointments`
- **Access**: Patient only
- **Body**:
```json
{
  "doctorId": "doctor_user_id",
  "appointmentDate": "2026-04-15T10:00:00Z",
  "appointmentTime": "10:30",
  "reason": "Regular checkup",
  "notes": "Additional notes (optional)"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "_id": "appointment_id",
    "patientId": "patient_id",
    "doctorId": "doctor_id",
    "appointmentDate": "2026-04-15T10:00:00.000Z",
    "appointmentTime": "10:30",
    "reason": "Regular checkup",
    "status": "pending",
    "notes": "Additional notes",
    "createdAt": "2026-04-05T...",
    "updatedAt": "2026-04-05T..."
  },
  "message": "Appointment created successfully"
}
```

#### Get My Appointments
- **GET** `/api/appointments/me`
- **Access**: Patient, Doctor, Admin
- **Response**: Array of appointments for the user

#### Get Appointment by ID
- **GET** `/api/appointments/:id`
- **Access**: Patient, Doctor, Admin (only if involved or admin)
- **Response**: Single appointment object

#### Update Appointment Status
- **PATCH** `/api/appointments/:id/status`
- **Access**: Doctor, Admin
- **Body**:
```json
{
  "status": "confirmed"
}
```
- **Status values**: `pending`, `confirmed`, `cancelled`, `completed`

#### Update Appointment Details
- **PUT** `/api/appointments/:id`
- **Access**: Patient (only own pending appointments)
- **Body**:
```json
{
  "appointmentDate": "2026-04-15T10:00:00Z",
  "appointmentTime": "11:00",
  "reason": "Updated reason",
  "notes": "Updated notes"
}
```

#### Delete Appointment
- **DELETE** `/api/appointments/:id`
- **Access**: Patient (only own pending appointments)

## Setup & Running

### 1. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Must match auth-service JWT secret
- `PORT`: Service port (default 5004)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Service
**Development**:
```bash
npm run dev
```

**Production**:
```bash
npm start
```

## Testing with Postman

### Prerequisites
1. Auth service is running
2. You have a patient account and doctor account with JWT tokens
3. You have a doctorId for booking

### Test Sequence

**1. Health Check**
```
GET http://localhost:5000/api/appointments/health
```
Expected: `{ "status": "ok", "service": "appointment-service" }`

**2. Create Appointment (as Patient)**
```
POST http://localhost:5000/api/appointments
Authorization: Bearer <patient_jwt_token>
Content-Type: application/json

{
  "doctorId": "doctor_user_id_from_database",
  "appointmentDate": "2026-04-15T10:00:00Z",
  "appointmentTime": "10:30",
  "reason": "General checkup",
  "notes": "First time appointment"
}
```

**3. Get My Appointments (as Patient)**
```
GET http://localhost:5000/api/appointments/me
Authorization: Bearer <patient_jwt_token>
```

**4. Get Appointment Details**
```
GET http://localhost:5000/api/appointments/<appointment_id>
Authorization: Bearer <patient_jwt_token>
```

**5. View Doctor's Appointments (as Doctor)**
```
GET http://localhost:5000/api/appointments/me
Authorization: Bearer <doctor_jwt_token>
```

**6. Update Appointment Status (as Doctor)**
```
PATCH http://localhost:5000/api/appointments/<appointment_id>/status
Authorization: Bearer <doctor_jwt_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

**7. Update Appointment (as Patient)**
```
PUT http://localhost:5000/api/appointments/<appointment_id>
Authorization: Bearer <patient_jwt_token>
Content-Type: application/json

{
  "appointmentTime": "11:00",
  "reason": "Rescheduled - need consultation"
}
```

**8. Delete Appointment (as Patient)**
```
DELETE http://localhost:5000/api/appointments/<appointment_id>
Authorization: Bearer <patient_jwt_token>
```

### Negative Test Cases

**Missing Authorization Header**
```
POST http://localhost:5000/api/appointments
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "appointmentDate": "2026-04-15T10:00:00Z",
  "appointmentTime": "10:30",
  "reason": "Checkup"
}
```
Expected: 401 NO_TOKEN

**Insufficient Permissions (Patient trying to update status)**
```
PATCH http://localhost:5000/api/appointments/<appointment_id>/status
Authorization: Bearer <patient_jwt_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```
Expected: 403 FORBIDDEN

**Invalid Appointment Date (past date)**
```
POST http://localhost:5000/api/appointments
Authorization: Bearer <patient_jwt_token>
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "appointmentDate": "2020-04-15T10:00:00Z",
  "appointmentTime": "10:30",
  "reason": "Checkup"
}
```
Expected: 400 VALIDATION_ERROR

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| NO_TOKEN | 401 | No JWT token provided |
| INVALID_TOKEN | 401 | JWT token is invalid or expired |
| FORBIDDEN | 403 | User lacks required role permissions |
| VALIDATION_ERROR | 400 | Missing or invalid input fields |
| INVALID_ID | 400 | Invalid MongoDB ID format |
| NOT_FOUND | 404 | Appointment does not exist |
| INTERNAL_ERROR | 500 | Server error |

## Model Schema

```javascript
{
  patientId: ObjectId (required),
  doctorId: ObjectId (required),
  appointmentDate: Date (required, must be future),
  appointmentTime: String (required, HH:MM format),
  reason: String (required, max 500 chars),
  status: String (pending|confirmed|cancelled|completed),
  notes: String (max 1000 chars),
  createdAt: Date,
  updatedAt: Date
}
```

## Integration Notes

- Patient ID is automatically extracted from JWT token (`req.user.userId`)
- Doctor ID must be provided in request body
- All timestamps are in ISO 8601 format
- Gateway forwards this service at `/api/appointments` prefix
- Ensure `JWT_SECRET` matches other services for token validation
