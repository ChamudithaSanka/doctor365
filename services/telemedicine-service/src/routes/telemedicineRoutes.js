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

// All telemedicine routes require authentication
router.use(verifyToken);

// POST /telemedicine/sessions - Create a new session (doctor only)
router.post('/sessions', authorizeRole('doctor'), createSession);

// GET /telemedicine/sessions - Get all sessions for the authenticated user
router.get('/sessions', getUserSessions);

// GET /telemedicine/sessions/appointment/:appointmentId - Get session by appointment ID
router.get('/sessions/appointment/:appointmentId', getSessionByAppointmentId);

// GET /telemedicine/sessions/:id - Get session by session ID
router.get('/sessions/:id', getSessionById);

// PATCH /telemedicine/sessions/:id/start - Start a session (doctor only)
router.patch('/sessions/:id/start', authorizeRole('doctor'), startSession);

// PATCH /telemedicine/sessions/:id/end - End a session (doctor only)
router.patch('/sessions/:id/end', authorizeRole('doctor'), endSession);

module.exports = router;
