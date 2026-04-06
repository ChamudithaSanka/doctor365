const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    meetingProvider: {
      type: String,
      enum: {
        values: ['jitsi', 'agora', 'twilio'],
        message: 'Meeting provider must be one of: jitsi, agora, twilio',
      },
      default: 'jitsi',
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'active', 'ended'],
        message: 'Status must be one of: scheduled, active, ended',
      },
      default: 'scheduled',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    sessionToken: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
