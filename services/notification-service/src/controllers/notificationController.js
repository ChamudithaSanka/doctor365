const Notification = require('../models/Notification');
const { sendEmailNotification } = require('../utils/emailService');
const { sendSmsNotification } = require('../utils/smsService');
const {
  buildAppointmentBookedEmailHtml,
  buildAppointmentCancelledEmailHtml,
  buildAppointmentReminderEmailHtml,
  buildAppointmentCompletedEmailHtml,
} = require('../utils/appointmentEmailTemplate');
const { buildPaymentEmailHtml } = require('../utils/paymentEmailTemplate');

const normalizeChannels = (input) => {
  const channels = {
    inApp: true,
    email: false,
    sms: false,
  };

  if (!input) {
    return channels;
  }

  if (Array.isArray(input)) {
    input.forEach((channel) => {
      if (channel === 'email') {
        channels.email = true;
      }

      if (channel === 'sms') {
        channels.sms = true;
      }

      if (channel === 'inApp') {
        channels.inApp = true;
      }
    });

    return channels;
  }

  if (typeof input === 'object') {
    channels.email = Boolean(input.email);
    channels.sms = Boolean(input.sms);
  }

  return channels;
};

const getRecipientDetails = (reqBody, metadata = {}) => ({
  email: reqBody.recipientEmail || metadata.recipientEmail || metadata.email || null,
  phone: reqBody.recipientPhone || metadata.recipientPhone || metadata.phone || null,
});

const buildEmailMetadata = ({ type, metadata, title, message }) => {
  if (type === 'appointment.booked') {
    return {
      ...metadata,
      emailHtml: buildAppointmentBookedEmailHtml({ metadata, title, message }),
    };
  }

  if (type === 'appointment.cancelled') {
    return {
      ...metadata,
      emailHtml: buildAppointmentCancelledEmailHtml({ metadata, title, message }),
    };
  }

  if (type === 'appointment.reminder') {
    return {
      ...metadata,
      emailHtml: buildAppointmentReminderEmailHtml({ metadata, title, message }),
    };
  }

  if (type === 'appointment.completed') {
    return {
      ...metadata,
      emailHtml: buildAppointmentCompletedEmailHtml({ metadata, title, message }),
    };
  }

  if (type === 'payment.paid' || type === 'payment.failed' || type === 'payment.refunded') {
    return {
      ...metadata,
      emailHtml: buildPaymentEmailHtml({ metadata, title, message }),
    };
  }

  return metadata;
};

// @desc    Create notification (internal)
// @route   POST /notifications
// @access  Internal only
const createNotification = async (req, res, next) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      metadata = {},
      channels: rawChannels,
    } = req.body;

    const channels = normalizeChannels(rawChannels);
    const recipients = getRecipientDetails(req.body, metadata);

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide userId, type, title, and message',
        },
      });
    }

    if (channels.email && !recipients.email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide recipientEmail for email notifications',
        },
      });
    }

    if (channels.sms && !recipients.phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide recipientPhone for SMS notifications',
        },
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      metadata: metadata || {},
      channels,
      status: 'queued',
      deliveryStatus: {
        inApp: {
          status: 'sent',
          sentAt: new Date(),
          error: null,
        },
        email: {
          status: 'queued',
          sentAt: null,
          error: null,
        },
        sms: {
          status: 'queued',
          sentAt: null,
          error: null,
        },
        overall: 'queued',
      },
    });

    const deliveryTasks = [];

    if (channels.email) {
      deliveryTasks.push(
        sendEmailNotification({
          to: recipients.email,
          subject: title,
          text: message,
          metadata: buildEmailMetadata({ type, metadata, title, message }),
        })
      );
    }

    if (channels.sms) {
      deliveryTasks.push(
        sendSmsNotification({
          to: recipients.phone,
          body: `${title}\n${message}`,
        })
      );
    }

    const deliveryResults = await Promise.allSettled(deliveryTasks);
    let resultIndex = 0;
    let hadFailure = false;
    let hadExternalSuccess = false;

    const updatedDeliveryStatus = {
      inApp: {
        status: 'sent',
        sentAt: new Date(),
        error: null,
      },
      email: {
        status: 'queued',
        sentAt: null,
        error: null,
      },
      sms: {
        status: 'queued',
        sentAt: null,
        error: null,
      },
      overall: 'sent',
    };

    if (channels.email) {
      const emailResult = deliveryResults[resultIndex];
      resultIndex += 1;

      if (emailResult?.status === 'fulfilled') {
        updatedDeliveryStatus.email = {
          status: 'sent',
          sentAt: new Date(),
          error: null,
        };
        hadExternalSuccess = true;
      } else {
        updatedDeliveryStatus.email = {
          status: 'failed',
          sentAt: null,
          error: emailResult?.reason?.message || 'Email delivery failed',
        };
        hadFailure = true;
      }
    }

    if (channels.sms) {
      const smsResult = deliveryResults[resultIndex];
      resultIndex += 1;

      if (smsResult?.status === 'fulfilled') {
        updatedDeliveryStatus.sms = {
          status: 'sent',
          sentAt: new Date(),
          error: null,
        };
        hadExternalSuccess = true;
      } else {
        updatedDeliveryStatus.sms = {
          status: 'failed',
          sentAt: null,
          error: smsResult?.reason?.message || 'SMS delivery failed',
        };
        hadFailure = true;
      }
    }

    if (hadFailure) {
      updatedDeliveryStatus.overall = hadExternalSuccess ? 'partial' : 'partial';
    }

    let persistedNotification = notification;

    try {
      persistedNotification = await Notification.findByIdAndUpdate(
        notification._id,
        {
          status: updatedDeliveryStatus.overall,
          deliveryStatus: updatedDeliveryStatus,
        },
        { new: true }
      );
    } catch (updateError) {
      console.error('Failed to update notification delivery status:', updateError);
    }

    return res.status(201).json({
      success: true,
      data: persistedNotification,
      message: 'Notification created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's notifications
// @desc    Get all notifications (admin only)
// @route   GET /notifications
// @access  Private (admin)
const getAllNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
        },
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /notifications/me
// @access  Private
const getMyNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const query = { userId: req.user.userId };

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.type) {
      query.type = req.query.type;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
        },
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PATCH /notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this notification',
        },
      });
    }

    if (notification.status !== 'read') {
      notification.status = 'read';
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  markAsRead,
};
