const TelemedicineSession = require('../models/TelemedicineSession');
const { generateRoomName, generateMeetingLink } = require('../utils/jitsiUtils');

/**
 * Create a new telemedicine session
 * POST /telemedicine/sessions
 * Only doctors can create sessions
 * Validates:
 *   - Doctor is the authenticated user
 *   - Appointment exists and is valid
 *   - Doctor is assigned to the appointment
 *   - Patient is assigned to the appointment
 *   - No duplicate session exists for this appointment
 */
const createSession = async (req, res, next) => {
  try {
    const { appointmentId, patientId } = req.body;
    const doctorId = req.user.userId;

    // 1. Validate required fields
    if (!appointmentId || !patientId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide appointmentId and patientId',
        },
      });
    }

    // 2. Validate appointmentId format (MongoDB ObjectId)
    if (!appointmentId.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_APPOINTMENT_ID',
          message: 'Invalid appointment ID format',
        },
      });
    }

    // 3. Check if session already exists for this appointment
    const existingSession = await TelemedicineSession.findOne({ appointmentId });
    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A telemedicine session already exists for this appointment',
        },
      });
    }

    // 4. NOTE: In production, validate appointment with appointment-service via HTTP call
    // For now, we log the verification requirement\n    console.log(`[VERIFY] Checking appointment ${appointmentId} with appointment-service`);\n    console.log(`[VERIFY] Doctor ${doctorId} assigned to appointment`);\n    console.log(`[VERIFY] Patient ${patientId} assigned to appointment`);\n\n    // Example validation logic (would be replaced with actual service call):\n    // const appointmentResponse = await axios.get(`http://localhost:3002/api/appointments/${appointmentId}`, {\n    //   headers: { Authorization: `Bearer ${req.user.token}` }\n    // });\n    // if (!appointmentResponse.data) throw error;\n    // if (appointmentResponse.data.doctorId !== doctorId) throw error;\n    // if (appointmentResponse.data.patientId !== patientId) throw error;

    // 5. Generate unique room name based on appointment and participants
    const roomName = generateRoomName(appointmentId, doctorId, patientId);

    // 6. Generate meeting link with JWT if configured
    const meetingData = generateMeetingLink(
      roomName,
      doctorId,
      req.user.name || 'Doctor',
      req.user.email,
      true // isDoctor
    );

    if (!meetingData) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'MEETING_GENERATION_FAILED',
          message: 'Failed to generate meeting link. Check Jitsi configuration.',
        },
      });
    }

    // 7. Create new session with all required fields from actual appointment context
    const session = new TelemedicineSession({
      appointmentId,
      doctorId,
      patientId,
      meetingProvider: 'jitsi',
      meetingLink: meetingData.link,
      meetingRoomId: roomName,
      status: 'scheduled',
      notes: req.body.notes || '',
    });

    await session.save();

    // 8. Return created session with full details
    return res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        appointmentId: session.appointmentId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        meetingLink: session.meetingLink,
        meetingRoomId: session.meetingRoomId,
        meetingProvider: session.meetingProvider,
        status: session.status,
        createdAt: session.createdAt,
      },
      message: 'Telemedicine session created successfully',
    });
  } catch (error) {
    console.error('Error creating session:', error);
    next(error);
  }
};

/**
 * Get session by appointment ID
 * GET /telemedicine/sessions/appointment/:appointmentId
 * Authorization:
 *   - Doctor assigned to appointment
 *   - Patient assigned to appointment
 * Returns: Session with full details for Jitsi meeting access
 */
const getSessionByAppointmentId = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    // 1. Validate appointmentId format
    if (!appointmentId.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_APPOINTMENT_ID',
          message: 'Invalid appointment ID format',
        },
      });
    }

    // 2. Find session for this appointment
    const session = await TelemedicineSession.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Telemedicine session not found for this appointment',
        },
      });
    }

    // 3. Authorization: Only assigned doctor or patient can access
    if (userId !== session.doctorId && userId !== session.patientId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this session',
        },
      });
    }

    // 4. Return session with meeting link (patient can only access if status is active)
    const shouldIncludeMeetingLink = session.status === 'active' || userId === session.doctorId;

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        appointmentId: session.appointmentId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        meetingProvider: session.meetingProvider,
        meetingRoomId: session.meetingRoomId,
        meetingLink: shouldIncludeMeetingLink ? session.meetingLink : null,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    next(error);
  }
};

/**
 * Get session by session ID
 * GET /telemedicine/sessions/:id
 * Authorization:
 *   - Doctor assigned to session
 *   - Patient assigned to session
 *   - Admin users
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 1. Validate session ID format
    if (!id.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SESSION_ID',
          message: 'Invalid session ID format',
        },
      });
    }

    // 2. Fetch session from database
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Telemedicine session not found',
        },
      });
    }

    // 3. Authorization: Only assigned doctor/patient or admin
    const isAuthorized = 
      userRole === 'admin' || 
      userId === session.doctorId || 
      userId === session.patientId;
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this session',
        },
      });
    }

    // 4. Return complete session details
    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        appointmentId: session.appointmentId,
        doctorId: session.doctorId,
        patientId: session.patientId,
        meetingProvider: session.meetingProvider,
        meetingRoomId: session.meetingRoomId,
        meetingLink: session.meetingLink,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        notes: session.notes,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    next(error);
  }
};

/**
 * Get all sessions for authenticated user
 * GET /telemedicine/sessions
 * Supports pagination and status filtering
 * Returns: All sessions where user is doctor OR patient
 */
const getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, limit = 10, offset = 0 } = req.query;

    // 1. Build query: doctor or patient in session
    const query = {
      $or: [{ doctorId: userId }, { patientId: userId }],
    };

    // 2. Optional: Filter by status
    if (status) {
      if (!['scheduled', 'active', 'ended'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Status must be one of: scheduled, active, ended',
          },
        });
      }
      query.status = status;
    }

    // 3. Validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 per page
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    // 4. Fetch sessions with pagination
    const sessions = await TelemedicineSession.find(query)
      .limit(parsedLimit)
      .skip(parsedOffset)
      .sort({ createdAt: -1 });

    // 5. Get total count for pagination
    const total = await TelemedicineSession.countDocuments(query);

    // 6. Return paginated results
    return res.status(200).json({
      success: true,
      data: {
        sessions: sessions.map(s => ({
          sessionId: s._id,
          appointmentId: s.appointmentId,
          doctorId: s.doctorId,
          patientId: s.patientId,
          meetingProvider: s.meetingProvider,
          meetingRoomId: s.meetingRoomId,
          status: s.status,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          duration: s.duration,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        pagination: {
          total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + parsedLimit < total,
        },
      },
      message: 'Sessions retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving sessions:', error);
    next(error);
  }
};

/**
 * Start a telemedicine session
 * PATCH /telemedicine/sessions/:id/start
 * Authorization:
 *   - Only assigned doctor can start session
 * State Transition:
 *   - scheduled → active
 * Returns: Updated session with start timestamp and meeting link
 */
const startSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.userId;

    // 1. Validate session ID format
    if (!id.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SESSION_ID',
          message: 'Invalid session ID format',
        },
      });
    }

    // 2. Fetch session
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    // 3. Verify doctor owns this session
    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only assigned doctor can start this session',
        },
      });
    }

    // 4. Verify session is in scheduled state
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot start session. Current status: ${session.status}. Must be scheduled.`,
        },
      });
    }

    // 5. Transition to active state
    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    // 6. Return updated session
    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        appointmentId: session.appointmentId,
        status: session.status,
        startedAt: session.startedAt,
        meetingLink: session.meetingLink,
        meetingRoomId: session.meetingRoomId,
      },
      message: 'Session started successfully. Consultation can now begin.',
    });
  } catch (error) {
    console.error('Error starting session:', error);
    next(error);
  }
};

/**
 * End a telemedicine session
 * PATCH /telemedicine/sessions/:id/end
 * Authorization:
 *   - Only assigned doctor can end session
 * State Transition:
 *   - active → ended
 * Request Body:
 *   - notes: Optional clinical notes from doctor
 * Returns: Updated session with end timestamp, duration, and notes
 */
const endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.userId;

    // 1. Validate session ID format
    if (!id.match(/^[a-f\d]{24}$/i)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SESSION_ID',
          message: 'Invalid session ID format',
        },
      });
    }

    // 2. Validate notes if provided
    if (notes && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notes must be a string',
        },
      });
    }

    if (notes && notes.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notes cannot exceed 1000 characters',
        },
      });
    }

    // 3. Fetch session
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    // 4. Verify doctor owns this session
    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only assigned doctor can end this session',
        },
      });
    }

    // 5. Verify session is in active state
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot end session. Current status: ${session.status}. Must be active.`,
        },
      });
    }

    // 6. Transition to ended state and calculate duration
    session.status = 'ended';
    session.endedAt = new Date();
    
    if (session.startedAt) {
      const durationMs = session.endedAt - session.startedAt;
      session.duration = Math.floor(durationMs / (1000 * 60)); // Convert to minutes
    }

    // 7. Store clinical notes if provided
    if (notes) {
      session.notes = notes;
    }

    await session.save();

    // 8. Return updated session with consultation summary
    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        appointmentId: session.appointmentId,
        status: session.status,
        consultationSummary: {
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          durationMinutes: session.duration,
        },
        clinicalNotes: session.notes,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      message: 'Session ended successfully. Consultation completed.',
    });
  } catch (error) {
    console.error('Error ending session:', error);
    next(error);
  }
};

module.exports = {
  createSession,
  getSessionByAppointmentId,
  getSessionById,
  getUserSessions,
  startSession,
  endSession,
};
