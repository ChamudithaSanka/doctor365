const express = require('express');
const {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { verifyInternalToken } = require('../middleware/internalMiddleware');

const router = express.Router();

// Internal-only route for service-to-service notification creation
router.post('/', verifyInternalToken, createNotification);

// Protected user routes
router.use(verifyToken);

// Get all notifications (admin only)
router.get('/', restrictTo('admin'), getAllNotifications);

// Get my notifications (user)
router.get('/me', getMyNotifications);

// Mark notification as read (user)
router.patch('/:id/read', markAsRead);

module.exports = router;
