const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      index: true,
    },
    appointmentId: {
      type: String,
      required: [true, 'Appointment ID is required'],
      index: true,
    },
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be greater than or equal to 0'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      default: 'USD',
      maxlength: [3, 'Currency code must be 3 characters'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['credit_card', 'debit_card', 'bank_transfer', 'wallet', 'payhere'],
        message: 'Payment method must be one of: credit_card, debit_card, bank_transfer, wallet, payhere',
      },
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: 'Status must be one of: pending, paid, failed, refunded',
      },
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    customerEmail: {
      type: String,
      default: null,
    },
    customerPhone: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
