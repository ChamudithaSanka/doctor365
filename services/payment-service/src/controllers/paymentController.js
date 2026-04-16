const Payment = require('../models/Payment');
const { getPatientPhone } = require('../utils/contactLookup');
const { sendInternalNotification } = require('../utils/notificationClient');
const {
  formatAmount,
  generateCheckoutHash,
  generateNotifySignature,
  getPayHereActionUrl,
  mapPayHereStatusCode,
} = require('../utils/payhereUtils');

const generateOrderId = () => {
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `PH-${Date.now()}-${random}`;
};

const notifyPaymentResult = async ({ payment, status }) => {
  const isSuccess = status === 'paid';
  const contact = payment.customerEmail || payment.customerPhone
    ? {
        email: payment.customerEmail,
        phone: payment.customerPhone,
      }
    : null;

  await sendInternalNotification({
    userId: payment.patientId,
    type: isSuccess ? 'payment.paid' : 'payment.failed',
    title: isSuccess ? 'Payment successful' : 'Payment failed',
    message: isSuccess
      ? `Your payment of ${payment.currency} ${payment.amount} for appointment ${payment.appointmentId} was successful.`
      : `Your payment of ${payment.currency} ${payment.amount} for appointment ${payment.appointmentId} failed.`,
    recipientEmail: contact?.email || undefined,
    recipientPhone: contact?.phone || undefined,
    channels: {
      inApp: true,
      email: Boolean(contact?.email),
      sms: Boolean(contact?.phone),
    },
    metadata: {
      paymentId: payment._id,
      appointmentId: payment.appointmentId,
      orderId: payment.orderId,
      status,
      amount: payment.amount,
      currency: payment.currency,
    },
  });
};

// @desc    Initialize PayHere checkout
// @route   POST /payments/checkout/payhere
// @access  Private (patient)
const initiatePayHereCheckout = async (req, res, next) => {
  try {
    const {
      appointmentId,
      amount,
      currency,
      items,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      country,
      orderId,
      metadata,
    } = req.body;

    if (!appointmentId || !amount || !firstName || !lastName || !email || !phone || !address || !city || !country) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Please provide appointmentId, amount, firstName, lastName, email, phone, address, city, and country',
        },
      });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const returnUrl = process.env.PAYHERE_RETURN_URL;
    const cancelUrl = process.env.PAYHERE_CANCEL_URL;
    const notifyUrl = process.env.PAYHERE_NOTIFY_URL;

    if (!merchantId || !merchantSecret || !returnUrl || !cancelUrl || !notifyUrl) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PAYHERE_CONFIG_ERROR',
          message: 'Missing PayHere configuration in environment variables',
        },
      });
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Amount must be a valid number greater than 0',
        },
      });
    }

    const generatedOrderId = orderId || generateOrderId();
    const selectedCurrency = (currency || process.env.PAYHERE_CURRENCY || 'LKR').toUpperCase();
    const amountForGateway = formatAmount(parsedAmount);

    const hash = generateCheckoutHash({
      merchantId,
      orderId: generatedOrderId,
      amount: amountForGateway,
      currency: selectedCurrency,
      merchantSecret,
    });

    const actionUrl = getPayHereActionUrl(process.env.PAYHERE_IS_SANDBOX === 'true');

    const payment = await Payment.create({
      orderId: generatedOrderId,
      appointmentId,
      patientId: req.user.userId,
      amount: parsedAmount,
      currency: selectedCurrency,
      paymentMethod: 'payhere',
      transactionId: generatedOrderId,
      status: 'pending',
      customerEmail: email,
      customerPhone: phone,
      metadata: {
        ...(metadata || {}),
        payhere: {
          checkoutInitializedAt: new Date(),
          items: items || `Appointment ${appointmentId}`,
          customer: {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            country,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        paymentId: payment._id,
        actionUrl,
        fields: {
          merchant_id: merchantId,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          notify_url: notifyUrl,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address,
          city,
          country,
          order_id: generatedOrderId,
          items: items || `Appointment ${appointmentId}`,
          currency: selectedCurrency,
          amount: amountForGateway,
          hash,
        },
      },
      message: 'PayHere checkout initialized successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle PayHere notify callback
// @route   POST /payments/payhere/notify
// @access  Public callback
const handlePayHereNotify = async (req, res, next) => {
  try {
    const merchantId = req.body.merchant_id;
    const orderId = req.body.order_id;
    const paymentId = req.body.payment_id;
    const amount = req.body.amount || req.body.payhere_amount;
    const currency = req.body.currency || req.body.payhere_currency;
    const statusCode = req.body.status_code;
    const md5sig = req.body.md5sig;

    if (!merchantId || !orderId || !amount || !currency || !statusCode || !md5sig) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required PayHere notify fields',
        },
      });
    }

    if (merchantId !== process.env.PAYHERE_MERCHANT_ID) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_MERCHANT',
          message: 'Merchant ID mismatch',
        },
      });
    }

    const expectedSignature = generateNotifySignature({
      merchantId,
      orderId,
      amount: formatAmount(amount),
      currency: String(currency).toUpperCase(),
      statusCode: String(statusCode),
      merchantSecret: process.env.PAYHERE_MERCHANT_SECRET,
    });

    if (expectedSignature !== String(md5sig).toUpperCase()) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'PayHere signature verification failed',
        },
      });
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found for provided order_id',
        },
      });
    }

    const mappedStatus = mapPayHereStatusCode(statusCode);

    if (!(payment.status === 'paid' && (mappedStatus === 'pending' || mappedStatus === 'failed'))) {
      const previousStatus = payment.status;
      payment.status = mappedStatus;

      if (mappedStatus !== previousStatus && (mappedStatus === 'paid' || mappedStatus === 'failed')) {
        await notifyPaymentResult({ payment, status: mappedStatus });
      }
    }

    if (mappedStatus === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    if (paymentId) {
      payment.transactionId = String(paymentId);
    }

    payment.metadata = {
      ...(payment.metadata || {}),
      payhere: {
        ...((payment.metadata && payment.metadata.payhere) || {}),
        notifiedAt: new Date(),
        payload: req.body,
      },
    };

    await payment.save();

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        status: payment.status,
      },
      message: 'PayHere notification processed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new payment
// @route   POST /payments
// @access  Private (patient)
const createPayment = async (req, res, next) => {
  try {
    const { appointmentId, orderId, amount, currency, paymentMethod, transactionId, metadata } = req.body;

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
      orderId: orderId || transactionId,
      appointmentId,
      patientId: req.user.userId,
      amount,
      currency: currency || 'USD',
      paymentMethod,
      transactionId,
      customerEmail: req.user.email || null,
      customerPhone: await getPatientPhone(req.headers.authorization),
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

// @desc    Get all payments (admin only)
// @route   GET /payments
// @access  Private (admin)
const getAllPayments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.patientId) {
      query.patientId = req.query.patientId;
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

    if (req.query.search) {
      query.$or = [
        { transactionId: { $regex: req.query.search, $options: 'i' } },
        { orderId: { $regex: req.query.search, $options: 'i' } },
        { patientId: { $regex: req.query.search, $options: 'i' } },
      ];
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

// @desc    Get current user's payments
// @route   GET /payments/me
// @access  Private (patient)
const getMyPayments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

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
      data: items,
      pagination: {
        page,
        limit,
        total,
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

    if (status === 'paid' || status === 'failed') {
      await notifyPaymentResult({ payment, status });
    }

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refund payment when appointment is cancelled
// @route   POST /payments/refund
// @access  Private (internal service only)
const refundPayment = async (req, res, next) => {
  try {
    const { appointmentId, patientId, paymentOrderId, reason } = req.body;

    if (!appointmentId || !patientId || !paymentOrderId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide appointmentId, patientId, and paymentOrderId',
        },
      });
    }

    const payment = await Payment.findOne({
      orderId: paymentOrderId,
      patientId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found for this appointment',
        },
      });
    }

    const hasAppointmentIdMismatch = payment.appointmentId !== appointmentId;

    const previousStatus = payment.status;

    // Only refund paid or pending payments
    if (!['paid', 'pending'].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot refund payments with status: ${payment.status}`,
        },
      });
    }

    payment.status = 'refunded';
    payment.metadata = {
      ...payment.metadata,
      refund: {
        refundedAt: new Date(),
        reason: reason || 'appointment_cancelled',
        previousStatus,
      },
      ...(hasAppointmentIdMismatch
        ? {
            refundContext: {
              requestedAppointmentId: appointmentId,
              paymentAppointmentId: payment.appointmentId,
            },
          }
        : {}),
    };

    await payment.save();

    // Send refund notification
    await notifyPaymentResult({
      payment,
      status: 'refunded',
      message: 'Your payment has been refunded due to appointment cancellation.',
    });

    return res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment refunded successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayHereCheckout,
  handlePayHereNotify,
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  refundPayment,
};
