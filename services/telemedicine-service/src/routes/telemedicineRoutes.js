const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  createSession,
  getSessionByAppointmentId,
  getSessionById,
  startSession,
  endSession,
  getUserSessions,
} = require('../controllers/telemedicineController');

// ========================
// ALL ROUTES REQUIRE AUTHENTICATION
// ========================
router.use(verifyToken);

// ========================
// CREATE SESSION (Doctor Only)
// ========================
// POST /api/telemedicine/sessions
// Body: { appointmentId, patientId, notes? }
// Returns: New telemedicine session with meeting link
router.post('/sessions', authorizeRole('doctor'), createSession);

// ========================
// GET SESSIONS (All Authenticated Users)
// ========================
// GET /api/telemedicine/sessions?status=scheduled&limit=10&offset=0
// Returns: Paginated list of user's sessions (where they're doctor OR patient)
router.get('/sessions', getUserSessions);

// ========================
// GET SESSION BY APPOINTMENT ID (Doctor/Patient Only)
// ========================
// GET /api/telemedicine/sessions/appointment/:appointmentId
// Returns: Session details for specific appointment
// Authorization: Must be assigned doctor or patient
router.get('/sessions/appointment/:appointmentId', getSessionByAppointmentId);

// ========================
// GET SESSION BY SESSION ID (Doctor/Patient/Admin)
// ========================
// GET /api/telemedicine/sessions/:id
// Returns: Complete session details including meeting link
router.get('/sessions/:id', getSessionById);

// ========================
// START SESSION (Doctor Only)
// ========================
// PATCH /api/telemedicine/sessions/:id/start
// Transitions session from 'scheduled' → 'active'
// Returns: Updated session with startedAt timestamp
router.patch('/sessions/:id/start', authorizeRole('doctor'), startSession);

// ========================
// END SESSION (Doctor Only)
// ========================
// PATCH /api/telemedicine/sessions/:id/end
// Body: { notes? }
// Transitions session from 'active' → 'ended'
// Calculates duration and stores clinical notes
router.patch('/sessions/:id/end', authorizeRole('doctor'), endSession);

module.exports = router;
