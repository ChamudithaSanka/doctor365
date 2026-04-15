const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
    },
    meetingProvider: {
      type: String,
      enum: {
        values: ['zoom'],
        message: 'Meeting provider must be: zoom',
      },
      default: 'zoom',
    },
    zoomMeetingId: {
      type: String,
      default: null,
    },
    meetingLink: {
      type: String,
      required: [true, 'Meeting link is required'],
    },
    meetingPassword: {
      type: String,
      default: null,
    },
    doctorJoinUrl: {
      type: String,
      default: null,
    },
    patientJoinUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'active', 'ended', 'cancelled'],
        message: 'Status must be one of: scheduled, active, ended, cancelled',
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
    doctorNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Doctor notes cannot exceed 2000 characters'],
      default: null,
    },
    patientFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback comment cannot exceed 500 characters'],
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    participationDetails: {
      doctorJoinedAt: {
        type: Date,
        default: null,
      },
      doctorLeftAt: {
        type: Date,
        default: null,
      },
      patientJoinedAt: {
        type: Date,
        default: null,
      },
      patientLeftAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
telemedicineSessionSchema.index({ appointmentId: 1 });
telemedicineSessionSchema.index({ patientId: 1, status: 1 });
telemedicineSessionSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
