const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    workingDays: {
      type: [
        {
          type: String,
          enum: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        },
      ],
      default: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    },
    availabilityStartTime: {
      type: String,
      required: true,
      default: '08:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    availabilityEndTime: {
      type: String,
      required: true,
      default: '18:00',
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    slotMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
    },
    hospitalOrClinic: {
      type: String,
      required: false,
      default: 'Online',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
