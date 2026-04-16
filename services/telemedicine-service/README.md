# Telemedicine Service - Doctor365

## Overview

The Telemedicine Service manages secure online consultation sessions between doctors and patients using **Agora RTC (Real-Time Communication)**. It handles session creation, lifecycle management (scheduled → active → ended), and integration with the appointment service.

## Features

✅ **Agora RTC Integration** - Token-based authentication with 1-hour expiration
✅ **Secure Video Channels** - Channel-based architecture with role-based access
✅ **Doctor Notes & Prescriptions** - Save consultation details
✅ **Patient Feedback** - 1-5 star ratings post-consultation
✅ **Session Analytics** - Track participation timing and detailed session metrics
✅ **Role-Based Access** - Doctor, Patient, Admin controls
✅ **Cross-Service Integration** - Validates appointment/doctor/patient data
✅ **Full Session Lifecycle** - Track participation timing and status

## Quick Start

```bash
npm install
npm run dev          # Start with auto-reload
npm run dev                   # Start in development mode
```

## Key Features

✅ **Agora RTC Integration** - Real-time video consultations with token-based authentication
✅ **JWT Authentication** - Token-based authorization  
✅ **Role-Based Access** - Doctor-only session management  
✅ **Session Lifecycle** - Scheduled → Active → Ended → Cancelled  
✅ **Doctor Notes & Prescriptions** - Consultation notes with prescription support  
✅ **Patient Feedback** - 1-5 star ratings and comments  
✅ **Session Analytics** - Duration, timestamps, participation tracking  

## API Routes

All routes require `Authorization: Bearer <JWT_TOKEN>` header (except `/health` and `/generate-token`).

### POST /telemedicine/sessions
**Create a new consultation session** (Doctor only)

```
Request:
POST /telemedicine/sessions
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "appointmentId": "apt-001",
  "patientId": "pat-001",
  "notes": "Follow-up consultation"
}

Response:
{
  "success": true,
  "data": {
    "_id": "67a8b9c0def12345678",
    "appointmentId": "apt-001",
    "agoraChannelName": "appointment-apt-001",
    "doctorToken": "007eJxTYGiRDl2n3no...",
    "patientToken": "007eJxTYDh0vVzXbZ...",
    "doctorUid": 1,
    "patientUid": 2,
    "appId": "088f132e19a24596849c9ff989fa049e",
    "status": "scheduled",
    "createdAt": "2026-04-08T10:00:00Z"
  },
  "message": "Telemedicine session created successfully"
}
```

### GET /telemedicine/sessions/appointment/:appointmentId
**Retrieve session by appointment** (Patient or Doctor)

```
Request:
GET /telemedicine/sessions/appointment/apt-001
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "data": {
    "_id": "67a8b9c0def12345678",
    "appointmentId": "apt-001",
    "doctorId": "doc-001",
    "patientId": "pat-001",
    "agoraChannelName": "appointment-apt-001",
    "doctorToken": "007eJxTYGiRDl2n3no...",
    "patientToken": "007eJxTYDh0vVzXbZ...",
    "appId": "088f132e19a24596849c9ff989fa049e",
    "status": "scheduled",
    "startedAt": null,
    "endedAt": null,
    "createdAt": "2026-04-08T10:00:00Z"
  },
  "message": "Session retrieved successfully"
}
```

### GET /telemedicine/sessions/:id
**Get session by ID** (Authorized users only)

```
Request:
GET /telemedicine/sessions/67a8b9c0def12345678
Authorization: Bearer eyJhbGc...

Response: { "success": true, "data": { ...session } }
```

### GET /telemedicine/sessions
**Get all user's sessions** (Paginated)

```
Request:
GET /telemedicine/sessions?status=active&limit=10&offset=0
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "data": {
    "sessions": [
      { ...session }, { ...session }
    ],
    "pagination": {
      "total": 20,
      "limit": 10,
      "offset": 0
    }
  },
  "message": "Sessions retrieved successfully"
}
```

### PATCH /telemedicine/sessions/:id/start
**Start a consultation** (Doctor only)

```
Request:
PATCH /telemedicine/sessions/67a8b9c0def12345678/start
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "data": {
    "_id": "67a8b9c0def12345678",
    "status": "active",
    "agoraChannelName": "appointment-apt-001",
    "doctorToken": "007eJxTYGiRDl2n3no...",
    "patientToken": "007eJxTYDh0vVzXbZ...",
    "appId": "088f132e19a24596849c9ff989fa049e",
    "startedAt": "2026-04-08T10:30:00Z"
  },
  "message": "Session started successfully"
}
```

### PATCH /telemedicine/sessions/:id/end
**End a consultation** (Doctor only)

```
Request:
PATCH /telemedicine/sessions/67a8b9c0def12345678/end
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "notes": "Patient advised to take rest. Prescribed Amoxicillin 500mg TDS for 5 days."
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "67a8b9c0def12345678",
    "status": "ended",
    "startedAt": "2026-04-08T10:30:00Z",
    "endedAt": "2026-04-08T11:15:00Z",
    "duration": 45
  },
  "message": "Session ended successfully"
}
```

## Session Status Flow

```
scheduled
    ↓
[Doctor starts session with Agora RTC channel]
    ↓
active (PATCH /start)
    ↓
[Video consultation happens over Agora RTC]
    ↓
ended (PATCH /end)
```

## Testing with Postman

1. **Generate Test Token**
   - POST: `http://localhost:5005/generate-token`
   - Body: `{ "userId": "doc-001", "role": "doctor", ... }`
   - Copy the token from response

2. **Create Session**
   - POST: `http://localhost:5005/telemedicine/sessions`
   - Header: `Authorization: Bearer <TOKEN>`
   - Body: `{ "appointmentId": "apt-001", "patientId": "pat-001" }`

3. **Start Session**
   - PATCH: `http://localhost:5005/telemedicine/sessions/<SESSION_ID>/start`
   - Header: `Authorization: Bearer <TOKEN>`

4. **End Session**
   - PATCH: `http://localhost:5005/telemedicine/sessions/<SESSION_ID>/end`
   - Body: `{ "notes": "..." }`

## Environment Configuration

```env
# Required (shared with other services)
JWT_SECRET=your-super-secret-key
NODE_ENV=development
PORT=5005

# Database
MONGODB_URI=mongodb://localhost:27017/telemedicine_db

# Agora RTC Configuration
# Get these from https://console.agora.io/
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# Service URLs (for cross-service communication)
DOCTOR_SERVICE_URL=http://localhost:5003
PATIENT_SERVICE_URL=http://localhost:5002
APPOINTMENT_SERVICE_URL=http://localhost:5004
```

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error"
  }
}
```

Common errors:
- **NO_TOKEN** (401) - Missing authorization header
- **INVALID_TOKEN** (401) - Invalid JWT
- **FORBIDDEN** (403) - User not authorized
- **SESSION_NOT_FOUND** (404) - Session doesn't exist
- **INVALID_STATE** (400) - Cannot perform action in current status
- **SESSION_EXISTS** (409) - Session already created for appointment

## Integration with Gateway

The gateway forwards requests to this service:

```
Client Request      →    Gateway              →    Telemedicine Service
POST /api/telemedicine/sessions → POST /telemedicine/sessions
```

## Database

Uses MongoDB. Collection: `telemedicinesessions`

Schema fields:
- `appointmentId` - Link to appointment
- `doctorId` - Attending doctor
- `patientId` - Consulting patient
- `agoraChannelName` - Agora RTC channel identifier
- `doctorToken` - Doctor's Agora RTC access token
- `patientToken` - Patient's Agora RTC access token
- `doctorUid` - Doctor's user ID in Agora (1)
- `patientUid` - Patient's user ID in Agora (2)
- `tokenExpiration` - Token expiration timestamp
- `status` - Session state (scheduled, active, ended, cancelled)
- `startedAt` - Consultation start time
- `endedAt` - Consultation end time
- `doctorNotes` - Doctor's consultation notes
- `patientFeedback` - Patient's feedback and rating

---

For complete setup instructions, see [SETUP.md](./SETUP.md)
