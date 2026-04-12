const jwt = require('jsonwebtoken');
const { verifyToken, restrictTo } = require('../../../shared/authUtils');

module.exports = {
  verifyToken,
  restrictTo,
};
