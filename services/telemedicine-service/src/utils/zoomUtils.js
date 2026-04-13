const axios = require('axios');

const ZOOM_AUTH_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

let cachedAccessToken = null;
let tokenExpiresAt = null;

/**
 * Get Zoom OAuth access token
 * Caches token for reuse if not expired
 */
const getZoomAccessToken = async () => {
  try {
    // Return cached token if still valid
    if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
      return cachedAccessToken;
    }

    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      ZOOM_AUTH_URL,
      'grant_type=account_credentials&account_id=' + process.env.ZOOM_ACCOUNT_ID,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedAccessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    return cachedAccessToken;
  } catch (error) {
    console.error('Zoom token error:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom access token');
  }
};

/**
 * Create a Zoom meeting and return meeting details
 */
const createMeeting = async (doctorEmail, appointmentDateTime) => {
  try {
    const accessToken = await getZoomAccessToken();

    // Generate secure password (alphanumeric, 8 chars)
    const meetingPassword = Math.random().toString(36).substring(2, 10).toUpperCase();

    const meetingData = {
      topic: `Medical Consultation - ${new Date(appointmentDateTime).toLocaleString()}`,
      type: 2, // Scheduled meeting
      start_time: appointmentDateTime,
      duration: 60, // 60 minutes default
      timezone: 'UTC',
      password: meetingPassword,
      agenda: 'Medical Consultation via Telemedicine',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: false,
        audio: 'both',
        auto_recording: 'cloud',
      },
    };

    const response = await axios.post(
      `${ZOOM_API_BASE_URL}/users/${doctorEmail}/meetings`,
      meetingData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      zoomMeetingId: response.data.id,
      meetingLink: response.data.join_url,
      meetingPassword,
      doctorJoinUrl: response.data.join_url,
      patientJoinUrl: generatePatientJoinUrl(response.data.join_url, meetingPassword),
    };
  } catch (error) {
    console.error('Zoom meeting creation error:', error.response?.data || error.message);
    throw new Error('Failed to create Zoom meeting');
  }
};

/**
 * Generate patient-specific join URL with password pre-filled
 */
const generatePatientJoinUrl = (joinUrl, password) => {
  try {
    const url = new URL(joinUrl);
    url.searchParams.append('pwd', Buffer.from(password).toString('base64'));
    return url.toString();
  } catch {
    return joinUrl;
  }
};

/**
 * Get meeting details from Zoom
 */
const getMeetingDetails = async (doctorEmail, zoomMeetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.get(
      `${ZOOM_API_BASE_URL}/users/${doctorEmail}/meetings/${zoomMeetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Zoom get meeting error:', error.response?.data || error.message);
    throw new Error('Failed to get Zoom meeting details');
  }
};

/**
 * Delete a Zoom meeting
 */
const deleteMeeting = async (doctorEmail, zoomMeetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    await axios.delete(
      `${ZOOM_API_BASE_URL}/users/${doctorEmail}/meetings/${zoomMeetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return true;
  } catch (error) {
    console.error('Zoom delete meeting error:', error.response?.data || error.message);
    throw new Error('Failed to delete Zoom meeting');
  }
};

/**
 * Get meeting recordings
 */
const getMeetingRecordings = async (doctorEmail, zoomMeetingId) => {
  try {
    const accessToken = await getZoomAccessToken();

    const response = await axios.get(
      `${ZOOM_API_BASE_URL}/users/${doctorEmail}/recordings?meeting_id=${zoomMeetingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.recording_files && response.data.recording_files.length > 0) {
      return {
        recordingId: response.data.id,
        recordingUrl: response.data.recording_files[0].download_url,
      };
    }

    return null;
  } catch (error) {
    console.error('Zoom get recordings error:', error.response?.data || error.message);
    return null;
  }
};

module.exports = {
  createMeeting,
  getMeetingDetails,
  deleteMeeting,
  getMeetingRecordings,
  getZoomAccessToken,
};
