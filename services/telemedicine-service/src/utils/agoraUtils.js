const { RtcTokenBuilder, RtcRole } = require('agora-token');

// Agora RTC Token Generation
const TOKEN_EXPIRATION_SECONDS = 3600; // 1 hour

/**
 * Generate Agora RTC Access Token (using official Agora token library)
 * @param {string} channelName - Channel name for the meeting
 * @param {number} uid - Unique identifier (1 for doctor, 2 for patient)
 * @param {number} role - 1 for publisher (host), 2 for subscriber (viewer)
 * @param {number} expirationSeconds - Token expiration time in seconds
 */
const generateAgoraToken = (channelName, uid, role, expirationSeconds = TOKEN_EXPIRATION_SECONDS) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured (AGORA_APP_ID or AGORA_APP_CERTIFICATE missing)');
    }

    // Use official Agora token generation
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + expirationSeconds;

    // Convert role number to Agora RtcRole
    // role 1 = Publisher (Host/Doctor), role 2 = Subscriber (Patient)
    const agoraRole = role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    console.log(`🔐 Generating Agora RTC Token:`);
    console.log(`   appId: ${appId.substring(0, 16)}...`);
    console.log(`   channel: ${channelName}`);
    console.log(`   uid: ${uid}`);
    console.log(`   role: ${role === 1 ? 'PUBLISHER (Doctor)' : 'SUBSCRIBER (Patient)'}`);
    console.log(`   expiration: ${expirationTime} (in ${expirationSeconds}s)`);

    // Generate token using official library
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      expirationTime
    );

    console.log(`✅ Token generated: ${token.substring(0, 40)}...`);

    return {
      token,
      issuedAt: currentTime,
      expireAt: expirationTime,
      channelName,
      uid,
      role
    };
  } catch (error) {
    console.error('❌ Error generating Agora token:', error.message);
    throw error;
  }
};

/**
 * Create Agora meeting with tokens for both doctor and patient
 * @param {string} channelName - Channel name for the meeting
 * @param {number} doctorUid - Doctor's UID (default: 1)
 * @param {number} patientUid - Patient's UID (default: 2)
 */
const createMeeting = (channelName, doctorUid = 1, patientUid = 2) => {
  try {
    if (!channelName) {
      throw new Error('Channel name is required');
    }

    console.log(`\n📞 Creating Agora Meeting:`);
    console.log(`   Channel: ${channelName}`);
    console.log(`   Doctor UID: ${doctorUid} (Publisher)`);
    console.log(`   Patient UID: ${patientUid} (Subscriber)`);

    // Generate tokens for both users
    // Role 1 = Publisher (Doctor), Role 2 = Subscriber (Patient)
    const doctorTokenData = generateAgoraToken(channelName, doctorUid, 1);
    const patientTokenData = generateAgoraToken(channelName, patientUid, 2);

    const meetingData = {
      agoraChannelName: channelName,
      agoraChannelId: channelName,
      doctorToken: doctorTokenData.token,
      doctorUid: doctorUid,
      patientToken: patientTokenData.token,
      patientUid: patientUid,
      tokenExpiration: doctorTokenData.expireAt,
      appId: process.env.AGORA_APP_ID,
    };

    console.log(`✅ Meeting created successfully\n`);

    return meetingData;
  } catch (error) {
    console.error('❌ Error creating Agora meeting:', error.message);
    throw error;
  }
};

/**
 * Validate Agora configuration
 */
const validateAgoraConfig = () => {
  return !!process.env.AGORA_APP_ID && !!process.env.AGORA_APP_CERTIFICATE;
};

/**
 * Get Agora configuration status
 */
const getAgoraConfig = () => {
  return {
    appId: process.env.AGORA_APP_ID ? '✓ Configured' : '✗ Missing',
    appCertificate: process.env.AGORA_APP_CERTIFICATE ? '✓ Configured' : '✗ Missing',
    isValid: validateAgoraConfig(),
  };
};

module.exports = {
  generateAgoraToken,
  createMeeting,
  validateAgoraConfig,
  getAgoraConfig,
  TOKEN_EXPIRATION_SECONDS,
};
