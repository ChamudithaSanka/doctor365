const jwt = require('jsonwebtoken');

/**
 * Jitsi Meet Utilities
 * Handles JWT generation and Jitsi configuration for secure meetings
 */

const getJitsiConfig = () => {
  return {
    mode: process.env.JITSI_MODE || 'public', // public or private
    domain: process.env.JITSI_DOMAIN || 'meet.jitsi', // Jitsi server domain
    jwtEnabled: process.env.JITSI_JWT_ENABLE === 'true',
    appId: process.env.JITSI_APP_ID || null,
    appSecret: process.env.JITSI_APP_SECRET || null,
  };
};

/**
 * Generate Jitsi JWT token for secure meeting
 * If using JWT authentication with Jitsi
 */
const generateJitsiJWT = (roomName, userId, userName, email, isDoctor = false) => {
  const config = getJitsiConfig();

  if (!config.jwtEnabled || !config.appId || !config.appSecret) {
    return null;
  }

  const payload = {
    aud: 'jitsi',
    iss: config.appId,
    sub: config.domain,
    room: roomName,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    context: {
      user: {
        id: userId,
        name: userName || 'Guest',
        email: email || 'guest@example.com',
        avatar: `https://api.example.com/avatar/${userId}`,
      },
      features: {
        livestream: false,
        recording: true,
        'outbound-call': false,
      },
    },
    moderator: isDoctor,
  };

  const token = jwt.sign(payload, config.appSecret, { algorithm: 'HS256' });
  return token;
};

/**
 * Generate meeting link for Jitsi Meet
 * Supports both public and JWT-authenticated modes
 */
const generateMeetingLink = (roomName, userId, userName, email, isDoctor = false) => {
  const config = getJitsiConfig();
  const baseUrl = `https://${config.domain}`;
  const encodedRoom = encodeURIComponent(roomName);

  if (config.jwtEnabled) {
    try {
      const token = generateJitsiJWT(roomName, userId, userName, email, isDoctor);
      return {
        link: `${baseUrl}/${encodedRoom}?jwt=${token}`,
        token,
        roomName,
        provider: 'jitsi',
      };
    } catch (error) {
      console.error('Error generating Jitsi JWT:', error);
      return null;
    }
  }

  // Public mode - no JWT required
  return {
    link: `${baseUrl}/${encodedRoom}`,
    token: null,
    roomName,
    provider: 'jitsi',
  };
};

/**
 * Generate unique room name from appointment ID
 */
const generateRoomName = (appointmentId, doctorId, patientId) => {
  // Format: doctor365-appointment123-doc456-pat789
  const roomName = `doctor365-${appointmentId}-${doctorId.substring(0, 6)}-${patientId.substring(0, 6)}`;
  return roomName.toLowerCase().replace(/[^a-z0-9-]/g, '');
};

module.exports = {
  getJitsiConfig,
  generateJitsiJWT,
  generateMeetingLink,
  generateRoomName,
};
