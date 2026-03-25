# API Gateway

Central routing hub for all Doctor365 microservices.

## Overview

Gateway runs on **port 5000** and routes requests to backend services on ports 5001-5007.

All requests pass through the gateway with the following mapping:

| Path | Service | Port | Status |
|------|---------|------|--------|
| `/api/auth` | Auth Service | 5001 | ✅ Working |
| `/api/patients` | Patient Service | 5002 | ⏳ Pending |
| `/api/doctors` | Doctor Service | 5003 | ⏳ Pending |
| `/api/appointments` | Appointment Service | 5004 | ⏳ Pending |
| `/api/telemedicine` | Telemedicine Service | 5005 | ⏳ Pending |
| `/api/payments` | Payment Service | 5006 | ⏳ Pending |
| `/api/notifications` | Notification Service | 5007 | ⏳ Pending |
| `/health` | Gateway Health | N/A | ✅ Working |

## How It Works

### Request Flow
```
Client Request
    ↓
Gateway (port 5000)
    ↓
Path Rewrite & Route
    ↓
Backend Service (5001-5007)
    ↓
Response back to Client
```

### Authorization Header Forwarding
✅ Authorization headers are automatically forwarded to backend services.
- All `Authorization: Bearer <token>` headers pass through unchanged
- Services receive `req.headers.authorization` for validation

### Example: Authentication Flow

**1. Register via Gateway**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient"
}
```
Routes to: `http://localhost:5001/auth/register`

**2. Login via Gateway**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
Returns:
```json
{
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**3. Use Token on Protected Route (Example: Future Patient Service)**
```bash
GET http://localhost:5000/api/patients/me
Authorization: Bearer eyJhbGc...
```
Routes to: `http://localhost:5002/patients/me` with header forwarded

## Environment Configuration

Gateway reads from `.env`:
```
PORT=5000
AUTH_SERVICE_URL=http://localhost:5001
PATIENT_SERVICE_URL=http://localhost:5002
DOCTOR_SERVICE_URL=http://localhost:5003
APPOINTMENT_SERVICE_URL=http://localhost:5004
TELEMEDICINE_SERVICE_URL=http://localhost:5005
PAYMENT_SERVICE_URL=http://localhost:5006
NOTIFICATION_SERVICE_URL=http://localhost:5007
```

For Docker/production, update these URLs to match your container network.

## Running the Gateway

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Testing

**Health Check:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "gateway",
  "port": 5000
}
```

**Through Gateway (Auth service example):**
```bash
curl http://localhost:5000/api/auth/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "auth-service"
}
```

## For Team Members: Integrating Your Service

When your service is ready:

1. **Ensure service runs on assigned port** (see table above)
2. **Export health endpoint** at `GET /health`
3. **Use shared auth utils** for protected routes (import from `../../shared/authUtils.js`)
4. **Test directly first** on your service port (e.g., `http://localhost:5002` for patient service)
5. **Test through gateway** on gateway port with `/api/prefix` (e.g., `http://localhost:5000/api/patients`)

### Example Integration Checklist
- [ ] Service starts and logs "connected to MongoDB"
- [ ] `GET /health` works on service port
- [ ] `GET /api/{service}/health` works through gateway
- [ ] Protected routes require valid Bearer token
- [ ] Response uses standard format (success/data/error)
- [ ] Authorization header is preserved in cross-service calls
- [ ] Postman collection exported and shared

## Troubleshooting

**"Cannot GET /api/patients":** Service on port 5002 not running
→ Start patient service with `npm run dev`

**"401 Unauthorized on protected route":** Token not forwarded
→ Check Postman has `Authorization: Bearer <token>` header

**CORS errors:** Gateway already has CORS enabled
→ Confirm backend service also enables CORS with `app.use(cors())`

**Service unreachable:** Check `.env` URL matches running service
→ Verify service port in `.env` matches actual service port

## Architecture Notes

- Gateway uses `http-proxy-middleware` for HTTP proxying
- Path rewriting removes `/api/{service}` prefix before forwarding
- All backend services must be running for full functionality
- Gateway is stateless (can be scaled/load-balanced easily)
