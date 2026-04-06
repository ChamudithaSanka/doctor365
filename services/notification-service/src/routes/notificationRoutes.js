const express = require('express');
const {
  createNotification,
  getMyNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyInternalToken } = require('../middleware/internalMiddleware');

const router = express.Router();

// Internal-only route for service-to-service notification creation
router.post('/', verifyInternalToken, createNotification);

// Protected user routes
router.use(verifyToken);
router.get('/me', getMyNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
