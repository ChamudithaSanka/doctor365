const mongoose = require('mongoose');

const channelDeliverySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed'],
      default: 'queued',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'sent', 'partial', 'failed', 'read'],
        message: 'Status must be one of: queued, sent, partial, failed, read',
      },
      default: 'queued',
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
    deliveryStatus: {
      inApp: {
        type: channelDeliverySchema,
        default: () => ({ status: 'sent', sentAt: new Date() }),
      },
      email: {
        type: channelDeliverySchema,
        default: () => ({}),
      },
      sms: {
        type: channelDeliverySchema,
        default: () => ({}),
      },
      overall: {
        type: String,
        enum: ['queued', 'sent', 'partial', 'failed'],
        default: 'queued',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
