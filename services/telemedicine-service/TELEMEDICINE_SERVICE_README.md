# Telemedicine Service

## Overview

The Telemedicine Service manages online consultation sessions for the Doctor365 platform. It enables doctors to create video consultation sessions, start/end sessions, and both doctors and patients to view session details.

## Microservice Port
- **Port**: 5005

## Features

- Create telemedicine consultation sessions
- Start and end consultation sessions
- Retrieve session details by session ID or appointment ID
- View all sessions for an authenticated user
- Role-based access control (Doctor/Patient)
- JWT-based authentication
- Standard error handling and response formatting

## Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Mongoose schema validation

## Environment Variables

Create a `.env` file in the service root with:

```
PORT=5005
MONGODB_URI=mongodb://localhost:27017/telemedicine_db
JWT_SECRET=your_shared_jwt_secret_key
SERVICE_NAME=telemedicine-service
```

## Installation

```bash
npm install
```

## Running the Service

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

All endpoints (except `/health`) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Health Check
- **Method**: GET
- **Path**: `/health`
- **Auth**: Not required
- **Response**:
```json
{
  "status": "ok",
  "service": "telemedicine-service"
}
```

### 2. Create Telemedicine Session
- **Method**: POST
- **Path**: `/telemedicine/sessions`
- **Auth**: Required (Doctor role only)
- **Request Body**:
```json
{
  "appointmentId": "string (required)",
  "patientId": "string (required)",
  "meetingProvider": "string (jitsi|agora|twilio, default: jitsi)"
}
```
- **Success Response** (201):
```json
{
  "success": true,
  "data": {
    "_id": "session_id",
    "appointmentId": "apt-001",
    "doctorId": "doctor-001",
    "patientId": "patient-001",
    "meetingProvider": "jitsi",
    "meetingLink": "https://meet.jitsi/apt-001-timestamp",
    "status": "scheduled",
    "startedAt": null,
    "endedAt": null,
    "sessionToken": "token_apt-001_timestamp",
    "notes": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Telemedicine session created successfully"
}
```

### 3. Get Session by ID
- **Method**: GET
- **Path**: `/telemedicine/sessions/:id`
- **Auth**: Required (Doctor or Patient in session)
- **Success Response** (200):
```json
{
  "success": true,
  "data": { /* session object */ },
  "message": "Session retrieved successfully"
}
```

### 4. Get Session by Appointment ID
- **Method**: GET
- **Path**: `/telemedicine/sessions/appointment/:appointmentId`
- **Auth**: Required (Doctor or Patient in session)
- **Success Response** (200):
```json
{
  "success": true,
  "data": { /* session object */ },
  "message": "Session retrieved successfully"
}
```

### 5. Get All User Sessions
- **Method**: GET
- **Path**: `/telemedicine/sessions`
- **Auth**: Required (Any authenticated user)
- **Query Parameters**: None
- **Success Response** (200):
```json
{
  "success": true,
  "data": [ /* array of session objects */ ],
  "message": "Sessions retrieved successfully"
}
```

### 6. Start Session
- **Method**: PATCH
- **Path**: `/telemedicine/sessions/:id/start`
- **Auth**: Required (Doctor role only, must be assigned doctor)
- **Request Body**: Empty
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* session object with status: "active" and startedAt: timestamp */
  },
  "message": "Session started successfully"
}
```

### 7. End Session
- **Method**: PATCH
- **Path**: `/telemedicine/sessions/:id/end`
- **Auth**: Required (Doctor role only, must be assigned doctor)
- **Request Body**:
```json
{
  "notes": "string (optional) - consultation notes"
}
```
- **Success Response** (200):
```json
{
  "success": true,
  "data": {
    /* session object with status: "ended" and endedAt: timestamp */
  },
  "message": "Session ended successfully"
}
```

## Data Model

### TelemedicineSession Schema

```javascript
{
  appointmentId: String (required, unique),     // Reference to appointment
  doctorId: String (required),                   // Doctor conducting session
  patientId: String (required),                  // Patient in session
  meetingProvider: String (enum: jitsi|agora|twilio, default: jitsi),
  meetingLink: String (required),               // Video meeting URL
  status: String (enum: scheduled|active|ended, default: scheduled),
  startedAt: Date (null initially),             // When session started
  endedAt: Date (null initially),               // When session ended
  sessionToken: String,                         // Token for session access
  notes: String (max 1000 chars),               // Doctor's consultation notes
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| NO_TOKEN | 401 | Authorization token missing |
| INVALID_TOKEN | 401 | Token invalid or expired |
| TOKEN_ERROR | 401 | Error verifying token |
| FORBIDDEN | 403 | User doesn't have permission |
| NOT_AUTHENTICATED | 401 | User not authenticated |
| VALIDATION_ERROR | 400 | Required field missing or invalid |
| SESSION_NOT_FOUND | 404 | Session doesn't exist |
| SESSION_EXISTS | 409 | Session already exists for appointment |
| INVALID_STATE | 400 | Invalid operation for current status |
| INVALID_ID | 400 | Invalid resource ID format |
| DUPLICATE_ERROR | 409 | Duplicate resource |

## Authorization Rules

### Session Access Control
- **Doctor**: Can view/modify sessions where they are the assigned doctor
- **Patient**: Can view sessions where they are involved
- **Admin**: Can access any session (when implemented)

### Role-Based Permissions

| Action | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| Create Session | ❌ | ✅ | ✅ |
| View Own Sessions | ✅ | ✅ | ✅ |
| View Other Sessions | ❌ | (if involved) | ✅ |
| Start Session | ❌ | ✅ (own) | ✅ |
| End Session | ❌ | ✅ (own) | ✅ |

## Testing

### Using Postman

1. Import `telemedicine-service-postman-collection.json` into Postman
2. Set up collection variables:
   - `base_url`: http://localhost:5005
   - `doctor_token`: JWT token with doctor role
   - `patient_token`: JWT token with patient role
3. Run through the test cases in order

### Test Cases Included

1. Health Check - Verify service is running
2. Create Session - Doctor creates a new session
3. Get Session by ID - Retrieve session using ID
4. Get Session by Appointment ID - Retrieve using appointment reference
5. Start Session - Doctor starts the session
6. End Session - Doctor ends the session with notes
7. Get All Sessions - Retrieve all sessions for user
8. Unauthorized Test - Missing token (should fail with 401)
9. Validation Test - Missing required fields (should fail with 400)
10. Permission Test - Patient attempts to create session (should fail with 403)

## Session Lifecycle

```
Created (scheduled)
    ↓
Started (active)
    ↓
Ended (ended)
```

### Status Transitions
- `scheduled` → `active`: Doctor calls /start
- `active` → `ended`: Doctor calls /end
- No backward transitions allowed

## Docker Support

Build and run in Docker:

```bash
# Build image
docker build -t telemedicine-service .

# Run container
docker run -p 5005:5005 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/telemedicine_db \
  -e JWT_SECRET=your_secret \
  telemedicine-service
```

## Integration with Gateway

The service is accessible through the API Gateway at:
```
http://localhost:5000/api/telemedicine
```

The gateway forwards all requests and headers to the service endpoint.

## Database

### MongoDB Collections
- `telemedicinesessions` - Stores all telemedicine session records

### Indexes
- `appointmentId` - For quick appointment-based lookups
- `doctorId` - For doctor's sessions list
- `patientId` - For patient's sessions list
- `status` - For filtering by session status

## Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured properly
- [ ] MongoDB connection verified
- [ ] JWT_SECRET matches across all services
- [ ] CORS configuration appropriate for domain
- [ ] All tests passing
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Security headers added if needed
- [ ] Rate limiting considered
- [ ] Backup/restore procedures documented

## Future Enhancements

- [ ] WebRTC integration for real-time video
- [ ] Session recording with access controls
- [ ] Prescription generation during session
- [ ] Real-time session notifications
- [ ] Session continuation/rescheduling
- [ ] Media upload during consultation
- [ ] Session transcript generation
- [ ] AI-powered session summarization
- [ ] Performance analytics per doctor

## Troubleshooting

### Service Won't Start
- Check MongoDB connection string
- Verify JWT_SECRET is set
- Check port 5005 isn't already in use

### Cannot Create Session
- Ensure JWT token has doctor role
- Verify appointmentId and patientId format
- Check if session already exists for appointment

### Token Errors
- Verify JWT_SECRET matches in all services
- Check token hasn't expired
- Ensure Authorization header format: `Bearer <token>`

### Database Errors
- Verify MongoDB is running
- Check MONGODB_URI format
- Review MongoDB connection logs

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error codes and messages
3. Check service logs: `docker logs telemedicine-service`
4. Contact the development team

## License

Doctor365 - All Rights Reserved
