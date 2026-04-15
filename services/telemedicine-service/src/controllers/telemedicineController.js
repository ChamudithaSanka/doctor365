const TelemedicineSession = require('../models/TelemedicineSession');
const { createMeeting } = require('../utils/zoomUtils');

// Fetch doctor profile from doctor service
const fetchDoctorProfile = async (doctorId) => {
  try {
    const doctorServiceUrl = process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:5003';
    const response = await fetch(`${doctorServiceUrl}/api/doctors/${doctorId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return null;
  }
};

// Fetch patient profile from patient service
const fetchPatientProfile = async (patientId) => {
  try {
    const patientServiceUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:5002';
    const response = await fetch(`${patientServiceUrl}/api/patients/${patientId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return null;
  }
};

// Fetch appointment from appointment service
const fetchAppointment = async (appointmentId, token) => {
  try {
    const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:5004';
    const url = `${appointmentServiceUrl}/api/appointments/${appointmentId}`;
    console.log('Fetching appointment from:', url);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    const data = await response.json();
    console.log('Appointment fetch response:', response.status, data);
    if (!response.ok) return null;
    return data?.data || null;
  } catch (error) {
    console.error('Error fetching appointment:', error.message);
    return null;
  }
};

// @desc    Create telemedicine session (doctor creates with Zoom meeting)
// @route   POST /api/telemedicine/sessions
// @access  Private (doctor)
exports.createSession = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    const doctorId = req.user.userId;
    const doctorEmail = req.user.email;

    // Validate required fields
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Appointment ID is required',
        },
      });
    }

    // Fetch appointment details
    const appointment = await fetchAppointment(appointmentId, req.headers.authorization?.replace('Bearer ', ''));
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create sessions for your own appointments',
        },
      });
    }

    // Check if session already exists for this appointment
    const existingSession = await TelemedicineSession.findOne({
      appointmentId,
      status: { $ne: 'cancelled' },
    });

    if (existingSession) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_EXISTS',
          message: 'A telemedicine session already exists for this appointment',
        },
      });
    }

    // Create Zoom meeting
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    let zoomMeetingData;
    try {
      // IMPORTANT: Must use the actual registered Zoom user (service account)
      // Doctor's email from the system is NOT a registered Zoom user
      const serviceAccountEmail = process.env.ZOOM_MEETING_HOST_ID;
      if (!serviceAccountEmail) {
        throw new Error('Zoom service account not configured (ZOOM_MEETING_HOST_ID)');
      }
      
      console.log(`📌 Creating Zoom meeting on service account: ${serviceAccountEmail}`);
      console.log(`👨‍⚕️ Doctor email: ${doctorEmail} (will have effective control via waiting room approval)`);
      
      zoomMeetingData = await createMeeting(serviceAccountEmail, appointmentDateTime.toISOString());
      
      console.log(`✅ Meeting created successfully`);
      console.log(`  📍 Meeting ID: ${zoomMeetingData.zoomMeetingId}`);
      console.log(`  🔒 Waiting room: ENABLED (doctor must approve patient entry)`);
      console.log(`  🚪 Join before host: DISABLED (patient cannot start without doctor)`);
    } catch (error) {
      console.error('❌ Zoom meeting creation failed:', error.message);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ZOOM_ERROR',
          message: 'Failed to create Zoom meeting: ' + error.message,
        },
      });
    }

    // Create telemedicine session
    const session = new TelemedicineSession({
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
      meetingProvider: 'zoom',
      zoomMeetingId: zoomMeetingData.zoomMeetingId,
      meetingLink: zoomMeetingData.meetingLink,
      meetingPassword: zoomMeetingData.meetingPassword,
      doctorJoinUrl: zoomMeetingData.doctorJoinUrl,
      patientJoinUrl: zoomMeetingData.patientJoinUrl,
      status: 'scheduled',
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
      message: 'Telemedicine session created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sessions for current user
// @route   GET /api/telemedicine/sessions
// @access  Private (patient/doctor/admin)
exports.getUserSessions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = {};

    // Build query based on user role
    if (userRole === 'patient') {
      query.patientId = userId;
    } else if (userRole === 'doctor') {
      query.doctorId = userId;
    }
    // admin can see all sessions (empty query)

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const sessions = await TelemedicineSession.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sessions,
      message: 'Sessions retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session by appointment ID
// @route   GET /api/telemedicine/sessions/appointment/:appointmentId
// @access  Private (patient/doctor/admin)
exports.getSessionByAppointmentId = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const session = await TelemedicineSession.findOne({ appointmentId });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Telemedicine session not found',
        },
      });
    }

    // Check access: patient/doctor own the session or admin
    if (
      userRole !== 'admin' &&
      !(session.patientId === userId || session.doctorId === userId)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session by ID
// @route   GET /api/telemedicine/sessions/:id
// @access  Private (patient/doctor/admin)
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

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

    // Check access: patient/doctor own the session or admin
    if (
      userRole !== 'admin' &&
      !(session.patientId === userId || session.doctorId === userId)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this session',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start session (doctor marks active)
// @route   PATCH /api/telemedicine/sessions/:id/start
// @access  Private (doctor)
exports.startSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.userId;

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

    // Verify doctor owns this session
    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned doctor can start this session',
        },
      });
    }

    // Check if session is still scheduled
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot start a session that is ${session.status}`,
        },
      });
    }

    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session started successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End session (doctor marks ended with notes)
// @route   PATCH /api/telemedicine/sessions/:id/end
// @access  Private (doctor)
exports.endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { doctorNotes } = req.body;
    const doctorId = req.user.userId;
    const doctorEmail = req.user.email;

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

    // Verify doctor owns this session
    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned doctor can end this session',
        },
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: `Cannot end a session that is ${session.status}`,
        },
      });
    }

    // Update session
    session.status = 'ended';
    session.endedAt = new Date();
    if (doctorNotes) {
      session.doctorNotes = doctorNotes;
    }

    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session ended successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add patient feedback
// @route   PATCH /api/telemedicine/sessions/:id/feedback
// @access  Private (patient)
exports.addPatientFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const patientId = req.user.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 5',
        },
      });
    }

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

    // Verify patient owns this session
    if (session.patientId !== patientId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the patient can add feedback to this session',
        },
      });
    }

    // Check if session is ended
    if (session.status !== 'ended') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Can only add feedback to ended sessions',
        },
      });
    }

    session.patientFeedback = {
      rating,
      comment: comment || null,
      submittedAt: new Date(),
    };

    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Feedback added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel session
// @route   PATCH /api/telemedicine/sessions/:id/cancel
// @access  Private (doctor)
exports.cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.userId;

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

    // Verify doctor owns this session
    if (session.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the assigned doctor can cancel this session',
        },
      });
    }

    // Can only cancel scheduled sessions
    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Can only cancel scheduled sessions',
        },
      });
    }

    session.status = 'cancelled';
    await session.save();

    res.status(200).json({
      success: true,
      data: session,
      message: 'Session cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
