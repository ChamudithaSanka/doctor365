# Telemedicine Service - Architecture Reference

This document maps the telemedicine service implementation to actual patterns and references from other Doctor365 services (auth-service, appointment-service, doctor-service, patient-service).

---

## 📚 Model Architecture

### TelemedicineSession Model
Follows the same Mongoose schema patterns as other services:

**References from:**
- [auth-service/User.js](../auth-service/src/models/User.js) - Schema validation patterns
- [appointment-service/Appointment.js](../appointment-service/src/models/Appointment.js) - Required field validation
- [doctor-service/Doctor.js](../doctor-service/src/models/Doctor.js) - Enum field patterns

**Key Features:**

```javascript
// 1. Required field validation (from Appointment model)
appointmentId: { type: String, required: [true, 'Appointment ID is required'] }

// 2. Indexed fields for efficient queries (from Doctor model)
{ index: true } // On doctorId, patientId, status

// 3. Enum validation with messages (from Appointment model)
status: {
  type: String,
  enum: {
    values: ['scheduled', 'active', 'ended'],
    message: 'Status must be one of: scheduled, active, ended'
  }
}

// 4. Field constraints (from Patient model)
notes: {
  type: String,
  trim: true,
  maxlength: [1000, 'Notes cannot exceed 1000 characters']
}

// 5. Timestamps (from all services)
{ timestamps: true }

// 6. Pre-save hooks for automatic calculations
telemedicineSessionSchema.pre('save', function(next) {
  // Calculate duration automatically like auth-service calculates tokens
  if (this.status === 'ended' && this.startedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 60000);
  }
  next();
});

// 7. Compound indexes for lookups (from appointment-service pattern)
telemedicineSessionSchema.index({ appointmentId: 1, doctorId: 1, patientId: 1 });
```

---

## 🛡️ Authentication & Authorization

### Middleware Architecture
Follows exact patterns from [auth-service](../auth-service/src/middleware/verifyToken.js):

**1. Token Verification (`verifyToken`)**

```javascript
// PATTERN: Extract and validate Bearer token (shared across all services)
const authHeader = req.headers.authorization;
const parts = authHeader.split(' ');
if (parts[0] !== 'Bearer') { /* error */ }
const token = parts[1];

// PATTERN: Decode with JWT_SECRET (shared secret across all services)
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// PATTERN: Validate required payload fields
if (!decoded.userId || !decoded.email || !decoded.role) { /* error */ }

// PATTERN: Attach to request context
req.user = {
  userId: decoded.userId,
  email: decoded.email,
  role: decoded.role,
  name: decoded.name
};
```

**2. Role-Based Authorization (`authorizeRole`)**

Follows pattern from [appointment-service/appointmentController.js](../appointment-service/src/controllers/appointmentController.js):

```javascript
// PATTERN: Check single or multiple roles
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '...' }
      });
    }
    next();
  };
};

// PATTERN: Doctor-only operations (like appointment-service)
router.post('/sessions', authorizeRole('doctor'), createSession);
router.patch('/sessions/:id/start', authorizeRole('doctor'), startSession);
router.patch('/sessions/:id/end', authorizeRole('doctor'), endSession);
```

**Supported Roles (from auth-service User model):**
- `patient` - Can view sessions they're assigned to
- `doctor` - Can create, start, end sessions
- `admin` - Can view all sessions

---

## 🎮 Controller Patterns

### Pattern 1: Validation (from appointment-service)

```javascript
// PATTERN: Validate required fields
if (!appointmentId || !patientId) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Please provide appointmentId and patientId'
    }
  });
}

// PATTERN: Validate data format (MongoDB ObjectId)
if (!appointmentId.match(/^[a-f\d]{24}$/i)) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_APPOINTMENT_ID',
      message: 'Invalid appointment ID format'
    }
  });
}

// PATTERN: Validate string constraints (from Patient model)
if (notes && notes.length > 1000) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Notes cannot exceed 1000 characters'
    }
  });
}
```

### Pattern 2: Duplicate Checking (from auth-service register)

```javascript
// PATTERN: Check for duplicate before create
const existingSession = await TelemedicineSession.findOne({ appointmentId });
if (existingSession) {
  return res.status(409).json({
    success: false,
    error: {
      code: 'CONFLICT',
      message: 'A telemedicine session already exists for this appointment'
    }
  });
}
```

### Pattern 3: Authorization Checks (from appointment-service)

```javascript
// PATTERN: Verify user owns resource
if (appointment.patientId !== req.user.userId && 
    appointment.doctorId !== req.user.userId) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource'
    }
  });
}

// PATTERN: Doctor-specific authorization
if (session.doctorId !== doctorId) {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Only assigned doctor can perform this action'
    }
  });
}
```

### Pattern 4: State Validation (from appointment-service)

```javascript
// PATTERN: Validate state transitions
const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
if (!validStatuses.includes(status)) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_STATUS',
      message: 'Status must be one of: ' + validStatuses.join(', ')
    }
  });
}

// PATTERN: Check current state before transition
if (session.status !== 'scheduled') {
  return res.status(400).json({
    success: false,
    error: {
      code: 'INVALID_STATE',
      message: `Cannot start session. Current status: ${session.status}. Must be scheduled.`
    }
  });
}
```

### Pattern 5: Pagination (from appointment-service)

```javascript
// PATTERN: Parse and validate pagination params
const parsedLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 per page
const parsedOffset = Math.max(parseInt(offset) || 0, 0);

// PATTERN: Execute query with pagination
const sessions = await TelemedicineSession.find(query)
  .limit(parsedLimit)
  .skip(parsedOffset)
  .sort({ createdAt: -1 });

// PATTERN: Return pagination metadata
return res.status(200).json({
  success: true,
  data: { sessions, pagination: { total, limit, offset, hasMore } },
  message: 'Sessions retrieved successfully'
});
```

### Pattern 6: Standard Response Format (all services)

```javascript
// SUCCESS: 201 Create
return res.status(201).json({
  success: true,
  data: { /* object */ },
  message: 'Telemedicine session created successfully'
});

// SUCCESS: 200 OK
return res.status(200).json({
  success: true,
  data: { /* object */ },
  message: 'Session retrieved successfully'
});

// ERROR: 400 Bad Request
return res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Please provide all required fields'
  }
});

// ERROR: 403 Forbidden
return res.status(403).json({
  success: false,
  error: {
    code: 'FORBIDDEN',
    message: 'You do not have permission'
  }
});

// ERROR: 404 Not Found
return res.status(404).json({
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: 'Resource not found'
  }
});

// ERROR: 409 Conflict
return res.status(409).json({
  success: false,
  error: {
    code: 'CONFLICT',
    message: 'Resource already exists'
  }
});
```

---

## 🛣️ Route Architecture

### Route Structure (from all services)

```javascript
const router = express.Router();

// ALL ROUTES: Protected by verifyToken middleware
router.use(verifyToken);

// CRUD Operations with proper HTTP methods
router.post('/sessions', authorizeRole('doctor'), createSession);      // Create (201)
router.get('/sessions', getUserSessions);                              // List (200)
router.get('/sessions/appointment/:id', getSessionByAppointmentId);   // Read by APT
router.get('/sessions/:id', getSessionById);                           // Read by ID
router.patch('/sessions/:id/start', authorizeRole('doctor'), start);  // Update: Start
router.patch('/sessions/:id/end', authorizeRole('doctor'), end);      // Update: End

// NOTE: No DELETE operation (sessions are permanent records)
```

### Endpoint Documentation Pattern

```javascript
// ========================
// CREATE SESSION (Doctor Only)
// ========================
// POST /api/telemedicine/sessions
// Body: { appointmentId, patientId, notes? }
// Authorization: Bearer <doctor_token>
// Returns: 201 TelemedicineSession
// Errors: 400 VALIDATION_ERROR, 409 CONFLICT, 401 NO_AUTH_HEADER
router.post('/sessions', authorizeRole('doctor'), createSession);
```

---

## 📊 Query & Database Patterns

### Query Patterns

**1. Find by field (from all services)**
```javascript
const session = await TelemedicineSession.findOne({ appointmentId });
```

**2. Find by ID (from all services)**
```javascript
const session = await TelemedicineSession.findById(id);
```

**3. Complex queries (from appointment-service)**
```javascript
// OR condition
const sessions = await TelemedicineSession.find({
  $or: [{ doctorId: userId }, { patientId: userId }]
});

// With status filter
if (status) query.status = status;

// With sorting
.sort({ createdAt: -1 })

// With pagination
.limit(limit).skip(offset)
```

**4. Count documents (from doctor-service)**
```javascript
const total = await TelemedicineSession.countDocuments(query);
```

### Index Strategy (from doctor-service)

```javascript
// Single field indexes for common queries
{ appointmentId: 1 }  // When queries by appointment
{ doctorId: 1 }       // When filtering by doctor
{ patientId: 1 }      // When filtering by patient
{ status: 1 }         // When filtering by status

// Compound index for multi-field lookups
{ appointmentId: 1, doctorId: 1, patientId: 1 }
```

---

## 🔄 Business Logic Patterns

### Session Lifecycle (inspired by appointment-service status transitions)

```
SCHEDULED → ACTIVE → ENDED
   ↓          ↓        ↓
  [Create] [Start]  [End]
```

**State Transitions:**
- `SCHEDULED` (initial): Session created, awaiting doctor start
- `ACTIVE`: Doctor started consultation, meeting is live
- `ENDED`: Meeting concluded, data captured

**Automatic Calculations (like auth-service calculates tokens):**
```javascript
// Duration calculated in pre-save hook
if (status === 'ended' && startedAt && endedAt) {
  duration = Math.floor((endedAt - startedAt) / (60 * 1000)); // minutes
}
```

---

## 🔌 Integration Points

### 1. Appointment Service Integration (TODO)

When creating a session, verify appointment exists:

```javascript
// Pattern: Service-to-service verification (would be inter-service call)
// GET http://localhost:3002/api/appointments/:appointmentId
// Returns: { doctorId, patientId, status, ... }

// Validation logic
if (appointmentResponse.data.doctorId !== doctorId) 
  throw new Error('Doctor not assigned to appointment');
  
if (appointmentResponse.data.patientId !== patientId)
  throw new Error('Patient not assigned to appointment');
```

### 2. Doctor Service Integration (TODO)

When creating a session, verify doctor exists:

```javascript
// Pattern: GET http://localhost:3003/api/doctors/profile
// With Authorization header passed through
```

### 3. Patient Service Integration (TODO)

When creating a session, verify patient exists:

```javascript
// Pattern: GET http://localhost:3005/api/patients/profile
// With Authorization header passed through
```

---

## 🔐 Error Handling Pattern

Follows [error-middleware pattern](../telemedicine-service/src/middleware/errorMiddleware.js):

```javascript
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  // Custom error handling
  if (err.statusCode && err.code) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: { code: errorCode, message },
  });
};
```

Usage in controllers:

```javascript
try {
  // Business logic
} catch (error) {
  console.error('Error creating session:', error);
  next(error); // Pass to error middleware
}
```

---

## 📋 Validation Patterns by Field Type

| Field Type | Pattern | Example |
|---|---|---|
| **Required String** | `required: [true, 'X is required']` | appointmentId, doctorId |
| **Enum** | `enum: { values: [...], message: '...' }` | status, meetingProvider |
| **String with Length** | `maxlength: [N, 'Cannot exceed N']` | notes |
| **Number with Range** | `min: [0, 'Cannot be negative']` | duration |
| **Date** | `type: Date, validate: { validator: ... }` | appointmentDate |
| **Index** | `index: true` | For frequent queries |
| **ID Reference** | `type: String, required: true` | doctorId, patientId |

---

## 🔍 Query Filter Examples

Based on patterns from appointment-service and doctor-service:

```javascript
// Filter by doctor (doctor-only operations)
const sessions = await TelemedicineSession.find({ doctorId: req.user.userId });

// Filter by patient
const sessions = await TelemedicineSession.find({ patientId: req.user.userId });

// Filter by status
const sessions = await TelemedicineSession.find({ status: 'active' });

// Multi-condition (doctor OR patient + status)
const sessions = await TelemedicineSession.find({
  $or: [
    { doctorId: userId },
    { patientId: userId }
  ],
  status: 'active'
});

// Pagination
const limit = 10;
const offset = 0;
const sessions = await TelemedicineSession.find(query)
  .skip(offset)
  .limit(limit)
  .sort({ createdAt: -1 });
```

---

## 📝 Summary of Pattern Mappings

| Component | Pattern From | Pattern To |
|---|---|---|
| Model validation | appointment-service | TelemedicineSession |
| Enum fields | doctor-service | status, meetingProvider |
| Pre-save hooks | auth-service | duration calculation |
| Token verification | auth-service | verifyToken middleware |
| Role authorization | appointment-service | authorizeRole middleware |
| Error responses | all services | errorMiddleware |
| Pagination | appointment-service | getUserSessions |
| Resource ownership check | appointment-service | getSessionById |
| State transitions | appointment-service | session lifecycle |
| Database indexes | doctor-service | compound indexes |
| Response format | all services | standard success/error |

---

## ✅ Implementation Checklist

- [x] Model with validation matching other services
- [x] Authentication middleware matching auth-service pattern
- [x] Authorization middleware matching appointment-service pattern
- [x] Controller with standard error handling
- [x] Route definitions following REST convention
- [x] Database queries with proper indexing
- [x] Pagination support
- [x] State transition validation
- [x] Standard response format
- [x] Error codes matching team standards

---

**Version**: 1.0.0  
**Last Updated**: April 8, 2026  
**Status**: ✅ Complete
