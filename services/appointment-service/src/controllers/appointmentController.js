const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { getPatientPhone, getUserContact } = require('../utils/contactLookup');
const { sendInternalNotification } = require('../utils/notificationClient');

const getAppointmentDateTime = (appointmentDate, appointmentTime) => {
  if (!appointmentDate || !appointmentTime) {
    return null;
  }

  const date = new Date(appointmentDate);
  const [hours, minutes] = String(appointmentTime).split(':').map((value) => Number(value));

  if (Number.isNaN(date.getTime()) || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
};

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (patient)
exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, notes } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide doctorId, appointmentDate, appointmentTime, and reason',
        },
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: req.user.userId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      notes: notes || '',
      status: 'pending',
    });

    const [patientPhone, doctorContact] = await Promise.all([
      getPatientPhone(req.headers.authorization),
      getUserContact(doctorId),
    ]);

    appointment.patientEmail = req.user.email || null;
    appointment.patientPhone = patientPhone;
    appointment.doctorEmail = doctorContact?.email || null;

    await appointment.save();

    await sendInternalNotification({
      userId: req.user.userId,
      type: 'appointment.booked',
      title: 'Appointment booked',
      message: `Your appointment for ${appointmentDate} at ${appointmentTime} has been booked.`,
      recipientEmail: appointment.patientEmail || undefined,
      recipientPhone: appointment.patientPhone || undefined,
      channels: {
        inApp: true,
        email: Boolean(appointment.patientEmail),
        sms: Boolean(appointment.patientPhone),
      },
      metadata: {
        appointmentId: appointment._id,
        doctorId,
        appointmentDate,
        appointmentTime,
      },
    });

    await sendInternalNotification({
      userId: doctorId,
      type: 'appointment.booked',
      title: 'New appointment booked',
      message: `A new appointment has been booked for ${appointmentDate} at ${appointmentTime}.`,
      recipientEmail: appointment.doctorEmail || undefined,
      channels: {
        inApp: true,
        email: Boolean(appointment.doctorEmail),
        sms: false,
      },
      metadata: {
        appointmentId: appointment._id,
        patientId: req.user.userId,
        appointmentDate,
        appointmentTime,
      },
    });

    res.status(201).json({
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my appointments (patient or doctor)
// @route   GET /api/appointments/me
// @access  Private (patient/doctor)
exports.getMyAppointments = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patientId = req.user.userId;
    } else if (req.user.role === 'doctor') {
      query.doctorId = req.user.userId;
    } else if (req.user.role === 'admin') {
      // Admins can see all
      query = {};
    }

    const appointments = await Appointment.find(query).sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
      message: 'Appointments retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (patient/doctor/admin)
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    // Check if user has access
    if (
      req.user.role !== 'admin' &&
      appointment.patientId !== req.user.userId &&
      appointment.doctorId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this appointment',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private (doctor/admin)
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
      });
    }

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be one of: pending, confirmed, cancelled, completed',
        },
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    // Doctor can only update their own appointments or if status is being set to completed
    if (
      req.user.role === 'doctor' &&
      appointment.doctorId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own appointments',
        },
      });
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      await sendInternalNotification({
        userId: appointment.patientId,
        type: 'appointment.cancelled',
        title: 'Appointment cancelled',
        message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime} has been cancelled.`,
        recipientEmail: appointment.patientEmail || undefined,
        recipientPhone: appointment.patientPhone || undefined,
        channels: {
          inApp: true,
          email: Boolean(appointment.patientEmail),
          sms: Boolean(appointment.patientPhone),
        },
        metadata: {
          appointmentId: appointment._id,
          doctorId: appointment.doctorId,
          status,
        },
      });

      await sendInternalNotification({
        userId: appointment.doctorId,
        type: 'appointment.cancelled',
        title: 'Appointment cancelled',
        message: `An appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime} has been cancelled.`,
        recipientEmail: appointment.doctorEmail || undefined,
        channels: {
          inApp: true,
          email: Boolean(appointment.doctorEmail),
          sms: false,
        },
        metadata: {
          appointmentId: appointment._id,
          patientId: appointment.patientId,
          status,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment (patient can update only their pending appointments)
// @route   PUT /api/appointments/:id
// @access  Private (patient)
exports.updateAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, appointmentTime, reason, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    // Patient can only update their own pending appointments
    if (
      req.user.role === 'patient' &&
      (appointment.patientId !== req.user.userId ||
        appointment.status !== 'pending')
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own pending appointments',
        },
      });
    }

    const previousAppointmentDate = appointment.appointmentDate;
    const previousAppointmentTime = appointment.appointmentTime;

    if (appointmentDate) {
      appointment.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime) {
      appointment.appointmentTime = appointmentTime;
    }
    if (reason) {
      appointment.reason = reason;
    }
    if (notes !== undefined) {
      appointment.notes = notes;
    }

    const dateChanged = Boolean(appointmentDate) && new Date(appointmentDate).getTime() !== previousAppointmentDate.getTime();
    const timeChanged = Boolean(appointmentTime) && appointmentTime !== previousAppointmentTime;

    await appointment.save();

    if (dateChanged || timeChanged) {
      await sendInternalNotification({
        userId: appointment.patientId,
        type: 'appointment.rescheduled',
        title: 'Appointment rescheduled',
        message: `Your appointment has been updated to ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime}.`,
        recipientEmail: appointment.patientEmail || undefined,
        recipientPhone: appointment.patientPhone || undefined,
        channels: {
          inApp: true,
          email: Boolean(appointment.patientEmail),
          sms: Boolean(appointment.patientPhone),
        },
        metadata: {
          appointmentId: appointment._id,
          doctorId: appointment.doctorId,
        },
      });

      await sendInternalNotification({
        userId: appointment.doctorId,
        type: 'appointment.rescheduled',
        title: 'Appointment rescheduled',
        message: `An appointment has been updated to ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime}.`,
        recipientEmail: appointment.doctorEmail || undefined,
        channels: {
          inApp: true,
          email: Boolean(appointment.doctorEmail),
          sms: false,
        },
        metadata: {
          appointmentId: appointment._id,
          patientId: appointment.patientId,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete appointment (patient can delete only their pending appointments)
// @route   DELETE /api/appointments/:id
// @access  Private (patient)
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        },
      });
    }

    // Patient can only delete their own pending appointments
    if (
      req.user.role === 'patient' &&
      (appointment.patientId !== req.user.userId ||
        appointment.status !== 'pending')
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own pending appointments',
        },
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    await sendInternalNotification({
      userId: appointment.patientId,
      type: 'appointment.cancelled',
      title: 'Appointment cancelled',
      message: `Your appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime} has been cancelled.`,
      recipientEmail: appointment.patientEmail || undefined,
      recipientPhone: appointment.patientPhone || undefined,
      channels: {
        inApp: true,
        email: Boolean(appointment.patientEmail),
        sms: Boolean(appointment.patientPhone),
      },
      metadata: {
        appointmentId: appointment._id,
        doctorId: appointment.doctorId,
      },
    });

    await sendInternalNotification({
      userId: appointment.doctorId,
      type: 'appointment.cancelled',
      title: 'Appointment cancelled',
      message: `An appointment on ${appointment.appointmentDate.toDateString()} at ${appointment.appointmentTime} has been cancelled.`,
      recipientEmail: appointment.doctorEmail || undefined,
      channels: {
        inApp: true,
        email: Boolean(appointment.doctorEmail),
        sms: false,
      },
      metadata: {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
