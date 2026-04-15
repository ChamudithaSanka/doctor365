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
      enum: ['male', 'female'],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
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
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: 'Sri Lanka',
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    medicalHistorySummary: {
      type: String,
      default: '',
    },
    medicalHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        condition: {
          type: String,
          required: true,
        },
        treatment: {
          type: String,
          required: true,
        },
        doctorName: String,
      },
    ],
    prescriptions: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        doctorName: {
          type: String,
          required: true,
        },
        doctorId: {
          type: String,
          required: true,
        },
        diagnosis: {
          type: String,
          default: '',
        },
        medication: [
          {
            name: String,
            dosage: String,
            frequency: String,
            duration: String,
          },
        ],
        instructions: String,
        isDigital: {
          type: Boolean,
          default: true,
        },
      },
    ],
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
