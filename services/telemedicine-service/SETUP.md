# Telemedicine Service - Complete Setup Guide

## Overview
The telemedicine service handles secure video consultation sessions using **Jitsi Meet**. It integrates JWT-based authentication and follows the Doctor365 microservices standards.

---

## Prerequisites

- **Node.js** v18+ 
- **MongoDB** running locally or remote access
- **npm** or **yarn**
- **Jitsi Meet** account (public or self-hosted)
- **JWT_SECRET** (shared across all services)

---

## Setup Steps

### 1. Install Dependencies

```bash
cd services/telemedicine-service
npm install
```

### 2. Configure Environment Variables

Copy the template and configure:

```bash
cp .env.example .env
```

Open `.env` and update:

```env
# Must match the JWT_SECRET used in auth-service and gateway
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database
MONGODB_URI=mongodb://localhost:27017/doctor365

# Jitsi Configuration
JITSI_MODE=public                    # Use 'public' for meet.jitsi
JITSI_DOMAIN=meet.jitsi              # Default: meet.jitsi
JITSI_JWT_ENABLE=false               # Set to true for self-hosted Jitsi with JWT
# JITSI_APP_ID=xxx                  # Uncomment if JWT enabled
# JITSI_APP_SECRET=xxx              # Uncomment if JWT enabled
```

### 3. Ensure MongoDB is Running

```bash
# Option A: Local MongoDB
mongod

# Option B: Remote MongoDB (update MONGODB_URI in .env)
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/doctor365
```

### 4. Start the Service

**Development Mode** (with hot reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

Expected output:
```
[dotenv] injecting env from .env
telemedicine-service connected to MongoDB

📞 JITSI CONFIGURATION:
   Mode: public
   Domain: meet.jitsi
   JWT Enabled: false
   App ID: Not configured
   App Secret: Not configured

telemedicine-service running on port 5005
🎥 Ready to create SECURE Jitsi meetings with JWT authentication ✨
🔑 Test token generation: POST /generate-token (development only)
```

---

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "service": "telemedicine-service" }
```

### Generate Test Token (Development Only)
```
POST /generate-token
Body: {
  "userId": "doc-123",
  "email": "doctor@example.com",
  "role": "doctor",
  "name": "Dr. John"
}
Response: { "success": true, "token": "...", "expiresIn": "24h" }
```

### Create Telemedicine Session
```
POST /telemedicine/sessions
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "appointmentId": "apt-123",
  "patientId": "pat-456"
}
Response: {
  "success": true,
  "data": {
    "sessionId": "sess-xxx",
    "meetingLink": "https://meet.jitsi/doctor365-apt-123-...",
    "status": "scheduled"
  }
}
```

### Get Session by Appointment ID
```
GET /telemedicine/sessions/appointment/:appointmentId
Headers: Authorization: Bearer <JWT_TOKEN>
Response: { "success": true, "data": { ...session } }
```

### Get Session by ID
```
GET /telemedicine/sessions/:id
Headers: Authorization: Bearer <JWT_TOKEN>
Response: { "success": true, "data": { ...session } }
```

### Get User Sessions (Doctor/Patient)
```
GET /telemedicine/sessions?status=active&limit=10&offset=0
Headers: Authorization: Bearer <JWT_TOKEN>
Response: { 
  "success": true, 
  "data": { 
    "sessions": [...],
    "pagination": { "total": 5, "limit": 10, "offset": 0 }
  }
}
```

### Start Session
```
PATCH /telemedicine/sessions/:id/start
Headers: Authorization: Bearer <JWT_TOKEN>
Response: {
  "success": true,
  "data": {
    "sessionId": "sess-xxx",
    "status": "active",
    "startedAt": "2026-04-08T10:30:00Z",
    "meetingLink": "https://meet.jitsi/..."
  }
}
```

### End Session
```
PATCH /telemedicine/sessions/:id/end
Headers: Authorization: Bearer <JWT_TOKEN>
Body: {
  "notes": "Patient has diabetic issues. Prescribed metformin."
}
Response: {
  "success": true,
  "data": {
    "sessionId": "sess-xxx",
    "status": "ended",
    "startedAt": "2026-04-08T10:30:00Z",
    "endedAt": "2026-04-08T11:15:00Z",
    "duration": 45
  }
}
```

---

## Jitsi Meet Integration Options

### Option 1: Public Jitsi (Default - No Setup Required)
- **Domain**: `meet.jitsi`
- **Cost**: Free
- **JWT**: Not required
- **Limitations**: Can have more drop-ins from others
- **Setup**: No additional configuration needed

```env
JITSI_MODE=public
JITSI_DOMAIN=meet.jitsi
JITSI_JWT_ENABLE=false
```

### Option 2: Self-Hosted Jitsi (Recommended for Production)
- **Domain**: Your custom domain
- **Cost**: Hosting cost
- **JWT**: Secure authentication required
- **Limitations**: None
- **Setup**: Deploy Jitsi, configure JWT

#### Self-Hosted Jitsi Setup with Docker

```bash
# Get Jitsi Docker Compose
git clone https://github.com/jitsi/docker-jitsi-meet.git
cd docker-jitsi-meet

# Generate JWT secret
openssl rand -base64 32

# Create .env
cp env.example .env
# Edit .env with JWT configuration

# Start Jitsi
docker-compose up -d
```

#### Configure Telemedicine Service for Self-Hosted Jitsi

```env
JITSI_MODE=private
JITSI_DOMAIN=your-jitsi-domain.com    # Your custom domain
JITSI_JWT_ENABLE=true
JITSI_APP_ID=doctor365-app
JITSI_APP_SECRET=<base64-secret-from-jitsi>
```

### Option 3: Jitsi Cloud
- **Domain**: `8x8.vc`
- **Cost**: Paid service
- **JWT**: Required
- **Setup**: Get credentials from Jitsi Cloud dashboard

```env
JITSI_MODE=private
JITSI_DOMAIN=8x8.vc
JITSI_JWT_ENABLE=true
JITSI_APP_ID=your-app-id
JITSI_APP_SECRET=your-app-secret
```

---

## Testing the Service

### 1. Health Check
```bash
curl http://localhost:5005/health
```

### 2. Generate Test Token
```bash
curl -X POST http://localhost:5005/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "doc-123",
    "email": "doctor@example.com",
    "role": "doctor",
    "name": "Dr. Smith"
  }'
```

### 3. Create Session Using Postman
- **URL**: `http://localhost:5005/telemedicine/sessions`
- **Method**: POST
- **Header**: `Authorization: Bearer <TOKEN_FROM_STEP_2>`
- **Body**:
```json
{
  "appointmentId": "apt-001",
  "patientId": "pat-001"
}
```

### 4. Get Session
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5005/telemedicine/sessions/appointment/apt-001
```

### 5. Start Session
```bash
curl -X PATCH -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5005/telemedicine/sessions/<SESSION_ID>/start
```

### 6. End Session
```bash
curl -X PATCH -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Consultation completed"}' \
  http://localhost:5005/telemedicine/sessions/<SESSION_ID>/end
```

---

## Integration with API Gateway

The gateway should route requests to this service:

```javascript
// In gateway/src/server.js
app.use('/api/telemedicine', proxyTo('http://localhost:5005/telemedicine'));
```

Client requests:
```
POST http://localhost:5000/api/telemedicine/sessions
GET http://localhost:5000/api/telemedicine/sessions/appointment/:appointmentId
PATCH http://localhost:5000/api/telemedicine/sessions/:id/start
```

---

## Authorization & Security

### Role-Based Access Control

| Endpoint | Doctor | Patient | Admin |
|----------|--------|---------|-------|
| POST /sessions | ✅ Create only | ❌ | ❌ |
| GET /sessions | ✅ Own + assigned | ✅ Own sessions | ❌ |
| PATCH /start | ✅ Own session | ❌ | ❌ |
| PATCH /end | ✅ Own session | ❌ | ❌ |

### JWT Token Requirements

Each request must include:
```
Authorization: Bearer <JWT_TOKEN>
```

Token payload must contain:
```json
{
  "userId": "unique-user-id",
  "email": "user@example.com",
  "role": "doctor|patient|admin",
  "name": "User Name"
}
```

### Securing Jitsi with JWT

When `JITSI_JWT_ENABLE=true`:
- All meeting links include JWT token
- Token expires in 1 hour
- Only authenticated users can join
- Meeting room access is restricted

---

## Database Schema

### TelemedicineSession Model

```javascript
{
  _id: ObjectId,
  appointmentId: String (required, indexed),
  doctorId: String (required),
  patientId: String (required),
  meetingProvider: String (enum: ['jitsi', 'agora', 'twilio']),
  meetingLink: String (URL to Jitsi meeting),
  meetingRoomId: String (unique room identifier),
  status: String (enum: ['scheduled', 'active', 'ended']),
  startedAt: Date (null until started),
  endedAt: Date (null until ended),
  duration: Number (minutes),
  notes: String (doctor's notes),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Error Handling

All errors follow the standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| NO_TOKEN | 401 | Missing Authorization header |
| INVALID_TOKEN | 401 | Invalid or expired JWT |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Missing/invalid request body |
| SESSION_NOT_FOUND | 404 | Session doesn't exist |
| SESSION_EXISTS | 409 | Session already created for appointment |
| INVALID_STATE | 400 | Cannot perform action in current state |
| MEETING_GENERATION_FAILED | 500 | Failed to generate Jitsi meeting |

---

## Troubleshooting

### Service won't start
```bash
# Check MongoDB connection
mongod  # Ensure running

# Check port conflict
lsof -i :5005
```

### Cannot generate meeting link
```
# Verify Jitsi domain is accessible
curl https://meet.jitsi
```

### JWT validation fails
```
# Ensure JWT_SECRET matches across services
# Regenerate token and try again
```

### Meeting link doesn't work
```
# If using self-hosted Jitsi, verify:
# 1. Domain is accessible from client
# 2. SSL/TLS certificate is valid
# 3. CORS is properly configured
```

---

## Production Deployment

### 1. Use Environment Variables from Secure Vault
```bash
# Do NOT commit .env to git
echo ".env" >> .gitignore
```

### 2. Set Production Jitsi (Self-Hosted Recommended)
```env
NODE_ENV=production
JITSI_MODE=private
JITSI_DOMAIN=your-secure-domain.com
JITSI_JWT_ENABLE=true
```

### 3. Use Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 5005
CMD ["npm", "start"]
```

### 4. Deploy with Kubernetes
See `services/telemedicine-service/k8s/` for manifests

---

## Performance Optimization

- **Caching**: Implement Redis for session lookups
- **Indexing**: Add MongoDB index on appointmentId
- **Rate Limiting**: Limit session creation requests
- **Monitoring**: Track session duration and failures

---

## Support & Documentation

- **Jitsi Docs**: https://jitsi.github.io/handbook/
- **Jitsi API**: https://github.com/jitsi/lib-jitsi-meet
- **Doctor365 Guides**: See `TEAM_IMPLEMENTATION_GUIDE.md`

