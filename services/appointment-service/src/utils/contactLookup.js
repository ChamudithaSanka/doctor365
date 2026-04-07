const DEFAULT_PATIENT_SERVICE_URL = 'http://localhost:5000';
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:5000';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const getPatientPhone = async (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const patientServiceUrl = process.env.PATIENT_SERVICE_URL || DEFAULT_PATIENT_SERVICE_URL;
  const result = await fetchJson(`${patientServiceUrl}/api/patients/me`, {
    headers: {
      Authorization: authorizationHeader,
    },
  });

  return result?.data?.phone || null;
};

const getUserContact = async (userId) => {
  if (!userId) {
    return null;
  }

  const authServiceUrl = process.env.AUTH_SERVICE_URL || DEFAULT_AUTH_SERVICE_URL;
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken) {
    return null;
  }

  const result = await fetchJson(`${authServiceUrl}/auth/internal/users/${userId}`, {
    headers: {
      'x-internal-token': internalToken,
    },
  });

  return result?.data || null;
};

module.exports = {
  getPatientPhone,
  getUserContact,
};