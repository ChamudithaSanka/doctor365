const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
      index: true,
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
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
    meetingRoomId: {
      type: String,
      required: [true, 'Meeting room ID is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'active', 'ended'],
        message: 'Status must be one of: scheduled, active, ended',
      },
      default: 'scheduled',
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
      min: [0, 'Duration cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookups
telemedicineSessionSchema.index({ appointmentId: 1, doctorId: 1, patientId: 1 });

// Pre-save validation
telemedicineSessionSchema.pre('save', function (next) {
  // Calculate duration if session has ended
  if (this.status === 'ended' && this.startedAt && this.endedAt) {
    const durationMs = this.endedAt - this.startedAt;
    this.duration = Math.floor(durationMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
