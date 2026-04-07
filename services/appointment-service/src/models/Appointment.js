const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: 'Appointment date must be in the future',
      },
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for appointment is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Status must be one of: pending, confirmed, cancelled, completed',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
