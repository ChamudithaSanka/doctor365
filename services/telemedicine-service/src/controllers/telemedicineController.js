const TelemedicineSession = require('../models/TelemedicineSession');
const jitsiUtils = require('../utils/jitsiUtils');

// POST /telemedicine/sessions - Create a new telemedicine session (doctor)
exports.createSession = async (req, res, next) => {
  try {
    const { appointmentId, patientId, meetingProvider } = req.body;
    const doctorId = req.user.userId;
    const userName = req.user.name || req.user.email || doctorId;

    // Validate required fields
    if (!appointmentId || !patientId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'appointmentId and patientId are required',
        },
      });
    }

    // Check if session already exists for this appointment
    const existingSession = await TelemedicineSession.findOne({ appointmentId });
    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SESSION_EXISTS',
          message: 'A session already exists for this appointment',
        },
      });
    }

    // Create real Jitsi meeting with JWT for SECURE MODE
    const meetingResult = await jitsiUtils.createMeeting(appointmentId, {
      userId: doctorId,
      name: userName,
      email: req.user.email,
    });

    if (!meetingResult.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'MEETING_CREATION_ERROR',
          message: meetingResult.error,
        },
      });
    }

    // Create session with real Jitsi meeting details
    const session = new TelemedicineSession({
      appointmentId,
      doctorId,
      patientId,
      meetingProvider: 'jitsi',
      meetingRoomId: meetingResult.meetingRoomId,
      meetingLink: meetingResult.meetingUrl,
      meetingJWT: meetingResult.meetingJWT,
      status: 'scheduled',
      sessionToken: meetingResult.meetingRoomId,
    });

    await session.save();

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Telemedicine session created successfully with secure Jitsi meeting',
      meetingDetails: {
        url: meetingResult.meetingUrl,
        roomId: meetingResult.meetingRoomId,
        jwt: meetingResult.meetingJWT,
        mode: meetingResult.config.mode,
        domain: meetingResult.config.domain,
        jwtEnabled: meetingResult.config.jwtEnabled,
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /telemedicine/sessions/:appointmentId - Get session by appointment ID (patient/doctor)
exports.getSessionByAppointmentId = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    // Find session by appointment ID
    const session = await TelemedicineSession.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found for this appointment',
        },
      });
    }

    // Check if user has access (must be doctor or patient in session)
    if (userId !== session.doctorId && userId !== session.patientId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /telemedicine/sessions/:id - Get session by session ID (patient/doctor)
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Find session by ID
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    // Check if user has access (must be doctor or patient in session)
    if (userId !== session.doctorId && userId !== session.patientId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /telemedicine/sessions/:id/start - Start a session (doctor only)
exports.startSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.userId;

    // Find session by ID
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    // Check if user is the doctor assigned to this session
    if (doctorId !== session.doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned doctor can start this session',
        },
      });
    }

    // Check if session is in scheduled state
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot start a session with status: ${session.status}`,
        },
      });
    }

    // Update session
    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      data: session,
      message: 'Session started successfully',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /telemedicine/sessions/:id/end - End a session (doctor only)
exports.endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const doctorId = req.user.userId;

    // Find session by ID
    const session = await TelemedicineSession.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    // Check if user is the doctor assigned to this session
    if (doctorId !== session.doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned doctor can end this session',
        },
      });
    }

    // Check if session is in active state
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot end a session with status: ${session.status}`,
        },
      });
    }

    // Update session
    session.status = 'ended';
    session.endedAt = new Date();
    if (notes) {
      session.notes = notes;
    }
    await session.save();

    return res.status(200).json({
      success: true,
      data: session,
      message: 'Session ended successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /telemedicine/sessions - Get all sessions for a user
exports.getUserSessions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Find sessions where user is either doctor or patient
    const sessions = await TelemedicineSession.find({
      $or: [{ doctorId: userId }, { patientId: userId }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: sessions,
      message: 'Sessions retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
