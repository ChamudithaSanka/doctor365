const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Jitsi Meeting Utilities - Jitsi Cloud (JaaS) Integration
 * Supports JWT-based secure meeting creation with Jitsi Cloud
 */

// Generate a secure room ID
const generateRoomId = (appointmentId) => {
  const timestamp = Date.now();
  const hash = crypto.randomBytes(4).toString('hex');
  return `${appointmentId}-${timestamp}-${hash}`.toLowerCase();
};

// Validate Jitsi configuration
const validateConfig = () => {
  const mode = process.env.JITSI_JWT_ENABLED === 'true' ? 'SECURE' : 'PUBLIC';
  
  if (mode === 'SECURE') {
    if (!process.env.JITSI_APP_ID || !process.env.JITSI_APP_SECRET) {
      throw new Error(
        'JITSI_JWT_ENABLED=true requires JITSI_APP_ID and JITSI_APP_SECRET'
      );
    }
  }
  
  return {
    domain: process.env.JITSI_DOMAIN || 'meet.jitsi',
    jwtEnabled: process.env.JITSI_JWT_ENABLED === 'true',
    appId: process.env.JITSI_APP_ID || null,
    appSecret: process.env.JITSI_APP_SECRET || null,
    mode,
  };
};

// Generate JWT token for Jitsi (SECURE mode only)
const generateJitsiJWT = (roomId, userInfo = {}) => {
  try {
    const config = validateConfig();
    
    if (!config.jwtEnabled) {
      return null;
    }

    const payload = {
      aud: 'jitsi',
      iss: config.appId,
      sub: config.domain,
      room: roomId,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      allow_recordings: true,
    };

    // Add user info if provided
    if (userInfo.userId) {
      payload.sub = userInfo.userId;
    }
    if (userInfo.email) {
      payload.email = userInfo.email;
    }
    if (userInfo.name) {
      payload.name = userInfo.name;
    }

    // Determine algorithm based on secret format
    // If it looks like a PEM private key (contains -----BEGIN), use RS256
    // Otherwise use HS256
    const secret = config.appSecret;
    let signOptions = { algorithm: 'HS256' };
    
    if (secret && secret.includes('-----BEGIN')) {
      // It's an RSA private key, use RS256
      signOptions = { algorithm: 'RS256' };
    }

    const token = jwt.sign(payload, secret, signOptions);

    return token;
  } catch (error) {
    console.error('Error generating Jitsi JWT:', error.message);
    throw error;
  }
};

// Create a Jitsi meeting
const createMeeting = async (appointmentId, userInfo = {}) => {
  try {
    const config = validateConfig();
    const roomId = generateRoomId(appointmentId);
    let token = null;

    // Generate JWT if in SECURE mode
    if (config.jwtEnabled) {
      token = generateJitsiJWT(roomId, userInfo);
    }

    // Build meeting URL with JWT parameter for SECURE mode
    let meetingUrl = `https://${config.domain}/${roomId}`;
    if (config.jwtEnabled && token) {
      meetingUrl = `${meetingUrl}#jwt=${token}`;
    }

    return {
      success: true,
      meetingRoomId: roomId,
      meetingUrl,
      meetingJWT: token,
      provider: 'jitsi',
      config: {
        domain: config.domain,
        mode: config.mode,
        jwtEnabled: config.jwtEnabled,
      },
    };
  } catch (error) {
    console.error('Error creating Jitsi meeting:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// End a Jitsi meeting (placeholder for future webhook integration)
const endMeeting = async (roomId) => {
  try {
    // Note: Jitsi Cloud (meet.jitsi and 8x8.vc) auto-close rooms when empty
    // For webhook integration, rooms can be closed programmatically
    
    return {
      success: true,
      message: `Meeting ${roomId} end request processed`,
      note: 'Room will auto-close when all participants leave',
    };
  } catch (error) {
    console.error('Error ending Jitsi meeting:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Validate meeting URL
const validateMeetingUrl = (url, domain) => {
  try {
    const expectedDomain = process.env.JITSI_DOMAIN || 'meet.jitsi';
    return url.includes(`https://${expectedDomain}/`);
  } catch (error) {
    return false;
  }
};

// Get Jitsi configuration (for health checks and debugging)
const getConfig = () => {
  try {
    const config = validateConfig();
    return {
      ...config,
      appSecret: config.appSecret ? '***' : null, // Hide secret
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

module.exports = {
  generateRoomId,
  createMeeting,
  endMeeting,
  generateJitsiJWT,
  validateMeetingUrl,
  validateConfig,
  getConfig,
};
