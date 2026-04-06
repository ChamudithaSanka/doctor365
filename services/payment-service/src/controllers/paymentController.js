const Payment = require('../models/Payment');

// @desc    Create a new payment
// @route   POST /payments
// @access  Private (patient)
const createPayment = async (req, res, next) => {
  try {
    const { appointmentId, amount, currency, paymentMethod, transactionId, metadata } = req.body;

    if (!appointmentId || !amount || !paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide appointmentId, amount, paymentMethod, and transactionId',
        },
      });
    }

    const payment = await Payment.create({
      appointmentId,
      patientId: req.user.userId,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      transactionId,
      metadata: metadata || {},
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's payments
// @route   GET /payments/me
// @access  Private (patient)
const getMyPayments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const query = { patientId: req.user.userId };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(query),
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
      message: 'Payments retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /payments/:id
// @access  Private (patient/admin)
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    if (req.user.role === 'patient' && payment.patientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this payment',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status (callback from payment provider)
// @route   PATCH /payments/:id/status
// @access  Private (admin)
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, metadata } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide status',
        },
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    payment.status = status;

    if (status === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    if (metadata) {
      payment.metadata = { ...payment.metadata, ...metadata };
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
};
