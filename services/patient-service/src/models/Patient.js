const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    medicalHistorySummary: {
      type: String,
      default: '',
    },
    reports: [
      {
        title: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
