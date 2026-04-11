# Telemedicine Service - Doctor365

## Overview

The Telemedicine Service manages secure online consultation sessions between doctors and patients using **Zoom Cloud Meetings**. It handles session creation, lifecycle management (scheduled → active → ended), and integration with the appointment service.

## Features

✅ **Real Zoom Integration** - OAuth 2.0 Server-to-Server authentication
✅ **Secure Meeting Links** - Auto-generated with password protection
✅ **Doctor Notes & Prescriptions** - Save consultation details
✅ **Patient Feedback** - 1-5 star ratings post-consultation
✅ **Recording Support** - Auto-fetch Zoom cloud recordings
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

✅ **Jitsi Meet Integration** - Secure video consultations  
✅ **JWT Authentication** - Token-based authorization  
✅ **Role-Based Access** - Doctor-only session management  
✅ **Session Lifecycle** - Scheduled → Active → Ended  
✅ **Doctor Notes** - Consultation notes with prescription support  
✅ **Session Tracking** - Duration, timestamps, and status  

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
    "sessionId": "67a8b9c0def12345678",
    "appointmentId": "apt-001",
    "meetingLink": "https://meet.jitsi/doctor365-apt-001-doc-pat/",
    "meetingRoomId": "doctor365-apt-001-doc-pat",
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
    "meetingLink": "https://meet.jitsi/...",
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
    "sessionId": "67a8b9c0def12345678",
    "status": "active",
    "startedAt": "2026-04-08T10:30:00Z",
    "meetingLink": "https://meet.jitsi/doctor365-apt-001-doc-pat/"
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
[Doctor joins Jitsi room]
    ↓
active (PATCH /start)
    ↓
[Consultation happens]
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

# Database
MONGODB_URI=mongodb://localhost:27017/doctor365

# Jitsi Meet
JITSI_MODE=public                    # public or private
JITSI_DOMAIN=meet.jitsi              # Jitsi server domain
JITSI_JWT_ENABLE=false               # Set true for self-hosted
JITSI_APP_ID=optional                # If JWT enabled
JITSI_APP_SECRET=optional            # If JWT enabled
```

## Jitsi Meet Options

### Free Public (Default)
- Uses `meet.jitsi` domain
- No setup required
- JWT not needed
- Meeting links: `https://meet.jitsi/doctor365-apt-001-...`

### Self-Hosted (Recommended for Production)
- Deploy your own Jitsi server
- Secure with JWT authentication
- Full control over data
- Better privacy

See `SETUP.md` for detailed Jitsi configuration.

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
- `meetingLink` - Jitsi meeting URL
- `status` - Session state
- `startedAt` - Consultation start time
- `endedAt` - Consultation end time
- `duration` - Session duration in minutes
- `notes` - Doctor's consultation notes

---

For complete setup instructions, see [SETUP.md](./SETUP.md)
